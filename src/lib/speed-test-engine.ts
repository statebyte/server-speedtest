import { DEFAULT_MEASUREMENT_STEPS } from "@/config/speed-test-measurement";
import { computeNetworkQuality } from "@/lib/network-quality";
import { randomUUID } from "@/lib/random-uuid";
import type {
  BandwidthPoint,
  LatencyPoint,
  MeasurementStep,
  PacketLossProgress,
  PacketLossResult,
  PacketStatus,
  SpeedTestPhase,
  SpeedTestResults,
} from "@/types";

export { DEFAULT_MEASUREMENT_STEPS };

function parseServerTimingDurMs(headers: Headers): number {
  const st = headers.get("server-timing");
  if (!st) return 0;
  for (const segment of st.split(",")) {
    const m = segment.match(/dur=([0-9.]+)/);
    if (m) {
      const v = Number.parseFloat(m[1]);
      return Number.isFinite(v) ? v : 0;
    }
  }
  return 0;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

function jitterMs(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < values.length; i++) {
    sum += Math.abs(values[i]! - values[i - 1]!);
  }
  return sum / (values.length - 1);
}

/**
 * Effective throughput for a sequence of transfers: total bits / total network time.
 * Not the mean of per-request bps (which distorts when sizes differ).
 */
function aggregateThroughputBps(points: readonly BandwidthPoint[]): number | null {
  if (points.length === 0) return null;
  let totalBits = 0;
  let totalNetSeconds = 0;
  for (const p of points) {
    const netMs = Math.max(1, p.durationMs - p.serverTimeMs);
    totalBits += p.bytes * 8;
    totalNetSeconds += netMs / 1000;
  }
  if (totalNetSeconds <= 0) return null;
  return totalBits / totalNetSeconds;
}

/** Browsers cap `crypto.getRandomValues` to 65536 bytes per call (Web Crypto). */
const CRYPTO_GET_RANDOM_VALUES_MAX_BYTES = 65536;

function randomBuffer(bytes: number): ArrayBuffer {
  const u8 = new Uint8Array(bytes);
  let offset = 0;
  while (offset < bytes) {
    const chunkSize = Math.min(CRYPTO_GET_RANDOM_VALUES_MAX_BYTES, bytes - offset);
    crypto.getRandomValues(u8.subarray(offset, offset + chunkSize));
    offset += chunkSize;
  }
  return u8.buffer;
}

export class SpeedTestEngine {
  private readonly steps: readonly MeasurementStep[];
  private running = false;
  private paused = false;
  private abort = false;
  private fetchController: AbortController | null = null;

  private downloadPoints: BandwidthPoint[] = [];
  private uploadPoints: BandwidthPoint[] = [];
  private unloadedLatencyPoints: LatencyPoint[] = [];
  private downLoadedLatencyPoints: LatencyPoint[] = [];
  private upLoadedLatencyPoints: LatencyPoint[] = [];
  private realtimeSeries: {
    t: number;
    downloadMbps: number | null;
    uploadMbps: number | null;
  }[] = [];
  private lastPacketLoss: PacketLossResult | null = null;
  private packetLossProgress: PacketLossProgress | null = null;
  /** Mutable packet row during WebRTC loss test; snapshotted into `packetLossProgress`. */
  private plLivePackets: PacketStatus[] | null = null;
  private plPhase: PacketLossProgress["phase"] = "sending";
  /** Browser timer id (`window.setTimeout`); typed as number for DOM + Node typings overlap. */
  private plThrottleTimer: number | null = null;
  private currentPhase: SpeedTestPhase = { type: "idle" };

  onRunningChange?: (running: boolean) => void;
  onResultsChange?: () => void;
  onFinish?: (results: SpeedTestResults) => void;
  onError?: (message: string) => void;

  constructor(steps: readonly MeasurementStep[] = DEFAULT_MEASUREMENT_STEPS) {
    this.steps = steps;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  getResults(): SpeedTestResults {
    const downloadBps = aggregateThroughputBps(this.downloadPoints);
    const uploadBps = aggregateThroughputBps(this.uploadPoints);

    const unloadedVals = this.unloadedLatencyPoints.map((p) => p.ms);
    const downLoadedVals = this.downLoadedLatencyPoints.map((p) => p.ms);
    const upLoadedVals = this.upLoadedLatencyPoints.map((p) => p.ms);

    const unloadedLatencyMs = median(unloadedVals);
    const downLoadedLatencyMs = median(downLoadedVals);
    const upLoadedLatencyMs = median(upLoadedVals);

    const unloadedJitterMs = jitterMs(unloadedVals);
    const downLoadedJitterMs = jitterMs(downLoadedVals);
    const upLoadedJitterMs = jitterMs(upLoadedVals);

    const networkQuality =
      downloadBps != null || uploadBps != null
        ? computeNetworkQuality({
            downloadMbps: downloadBps != null ? downloadBps / 1e6 : null,
            uploadMbps: uploadBps != null ? uploadBps / 1e6 : null,
            unloadedLatencyMs,
          })
        : null;

    return {
      downloadBps,
      uploadBps,
      unloadedLatencyMs,
      unloadedJitterMs,
      downLoadedLatencyMs,
      downLoadedJitterMs,
      upLoadedLatencyMs,
      upLoadedJitterMs,
      packetLoss: this.lastPacketLoss,
      packetLossProgress: this.packetLossProgress,
      currentPhase: this.currentPhase,
      downloadPoints: this.downloadPoints,
      uploadPoints: this.uploadPoints,
      unloadedLatencyPoints: this.unloadedLatencyPoints,
      downLoadedLatencyPoints: this.downLoadedLatencyPoints,
      upLoadedLatencyPoints: this.upLoadedLatencyPoints,
      networkQuality,
      realtimeSeries: this.realtimeSeries,
    };
  }

  private emitChange(): void {
    this.onResultsChange?.();
  }

  private setPhase(phase: SpeedTestPhase): void {
    this.currentPhase = phase;
    this.emitChange();
  }

  private clearPacketLossThrottle(): void {
    if (this.plThrottleTimer != null) {
      window.clearTimeout(this.plThrottleTimer);
      this.plThrottleTimer = null;
    }
  }

  private schedulePacketLossUiFlush(): void {
    if (this.plThrottleTimer != null) return;
    this.plThrottleTimer = window.setTimeout(() => {
      this.plThrottleTimer = null;
      this.flushPacketLossProgressSnapshot();
    }, 50) as unknown as number;
  }

  /** Pushes live WebRTC packet states to `packetLossProgress` and updates the packet-loss phase badge. */
  private flushPacketLossProgressSnapshot(): void {
    const packets = this.plLivePackets;
    if (packets == null) return;

    let sentOut = 0;
    let receivedCount = 0;
    let lostCount = 0;
    for (const p of packets) {
      if (p === "pending") continue;
      sentOut++;
      if (p === "received") receivedCount++;
      else if (p === "lost") lostCount++;
    }

    this.packetLossProgress = {
      total: packets.length,
      sent: sentOut,
      received: receivedCount,
      lost: lostCount,
      phase: this.plPhase,
      packets: [...packets],
    };

    this.currentPhase = {
      type: "packetLoss",
      sent: sentOut,
      total: packets.length,
      received: receivedCount,
    };
    this.emitChange();
  }

  private pushRealtime(downloadBps: number | null, uploadBps: number | null): void {
    this.realtimeSeries = [
      ...this.realtimeSeries,
      {
        t: performance.now(),
        downloadMbps: downloadBps != null ? downloadBps / 1e6 : null,
        uploadMbps: uploadBps != null ? uploadBps / 1e6 : null,
      },
    ];
    this.emitChange();
  }

  private async waitIfPaused(): Promise<void> {
    while (this.paused && !this.abort) {
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  private signal(): AbortSignal | undefined {
    return this.fetchController?.signal;
  }

  async measurePing(): Promise<number> {
    const t0 = performance.now();
    const res = await fetch("/api/ping", {
      cache: "no-store",
      method: "GET",
      signal: this.signal(),
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Ping failed: ${res.status}`);
    }
    return performance.now() - t0;
  }

  private async measureDownloadOnce(bytes: number): Promise<void> {
    await this.waitIfPaused();
    if (this.abort) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const intervalMs = bytes >= 1_000_000 ? 120 : 0;

    if (intervalMs > 0) {
      intervalId = setInterval(() => {
        void this.measurePing()
          .then((ms) => {
            this.downLoadedLatencyPoints = [
              ...this.downLoadedLatencyPoints,
              { ms, index: this.downLoadedLatencyPoints.length },
            ];
            this.emitChange();
          })
          .catch(() => {});
      }, intervalMs);
    }

    const t0 = performance.now();
    const res = await fetch(`/api/download?bytes=${bytes}`, {
      cache: "no-store",
      signal: this.signal(),
    });
    if (!res.ok) {
      if (intervalId) clearInterval(intervalId);
      throw new Error(`Download failed: ${res.status}`);
    }
    const buf = await res.arrayBuffer();
    if (intervalId) clearInterval(intervalId);

    const totalMs = performance.now() - t0;
    const serverMs = parseServerTimingDurMs(res.headers);
    const netMs = Math.max(1, totalMs - serverMs);
    const bps = (buf.byteLength * 8) / (netMs / 1000);

    this.downloadPoints = [
      ...this.downloadPoints,
      {
        bytes,
        bps,
        durationMs: totalMs,
        serverTimeMs: serverMs,
        index: this.downloadPoints.length,
      },
    ];
    this.pushRealtime(bps, null);
    this.emitChange();
  }

  private async measureUploadOnce(bytes: number): Promise<void> {
    await this.waitIfPaused();
    if (this.abort) return;

    const body = randomBuffer(bytes);
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const intervalMs = bytes >= 1_000_000 ? 120 : 0;

    if (intervalMs > 0) {
      intervalId = setInterval(() => {
        void this.measurePing()
          .then((ms) => {
            this.upLoadedLatencyPoints = [
              ...this.upLoadedLatencyPoints,
              { ms, index: this.upLoadedLatencyPoints.length },
            ];
            this.emitChange();
          })
          .catch(() => {});
      }, intervalMs);
    }

    const t0 = performance.now();
    const res = await fetch("/api/upload", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/octet-stream" },
      cache: "no-store",
      signal: this.signal(),
    });
    if (intervalId) clearInterval(intervalId);

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }

    const json = (await res.json()) as { serverTimeMs?: number };
    const totalMs = performance.now() - t0;
    const serverMs =
      typeof json.serverTimeMs === "number"
        ? json.serverTimeMs
        : parseServerTimingDurMs(res.headers);
    const netMs = Math.max(1, totalMs - serverMs);
    const bps = (bytes * 8) / (netMs / 1000);

    this.uploadPoints = [
      ...this.uploadPoints,
      {
        bytes,
        bps,
        durationMs: totalMs,
        serverTimeMs: serverMs,
        index: this.uploadPoints.length,
      },
    ];
    this.pushRealtime(null, bps);
    this.emitChange();
  }

  /**
   * Packet loss over WebRTC DataChannel (unordered, maxRetransmits: 0 when supported).
   * Media path uses UDP under ICE; browsers cannot send raw UDP from JS.
   */
  private async runPacketLoss(
    count: number,
    echoWaitMs: number,
    openTimeoutMs: number,
  ): Promise<void> {
    await this.waitIfPaused();
    if (this.abort) return;

    this.clearPacketLossThrottle();
    this.plLivePackets = Array.from({ length: count }, (): PacketStatus => "pending");
    this.plPhase = "sending";
    this.flushPacketLossProgressSnapshot();

    const packets = this.plLivePackets;
    const sessionId = randomUUID();
    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];

    const pc = new RTCPeerConnection({ iceServers });
    let dc: RTCDataChannel;

    try {
      try {
        dc = pc.createDataChannel("loss", {
          ordered: false,
          maxRetransmits: 0,
        });
      } catch {
        dc = pc.createDataChannel("loss", { ordered: false });
      }

      dc.binaryType = "arraybuffer";
      dc.onmessage = (ev: MessageEvent<ArrayBuffer>) => {
        try {
          const row = this.plLivePackets;
          if (row == null) return;
          const seq = new DataView(ev.data).getUint32(0, false);
          if (seq < 0 || seq >= row.length) return;
          if (row[seq] !== "sent") return;
          row[seq] = "received";
          this.schedulePacketLossUiFlush();
        } catch {
          /* ignore */
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await this.waitIceGatheringBrowser(pc);

      const res = await fetch("/api/webrtc/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          offer: {
            type: pc.localDescription?.type,
            sdp: pc.localDescription?.sdp,
          },
        }),
        cache: "no-store",
        signal: this.signal(),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`WebRTC setup failed (${res.status}): ${detail}`);
      }

      const body = (await res.json()) as { answer?: RTCSessionDescriptionInit };
      if (!body.answer?.sdp) {
        throw new Error("WebRTC: missing answer SDP");
      }

      await pc.setRemoteDescription(body.answer);
      await this.waitIceConnectionEstablished(pc, {
        timeoutMs: openTimeoutMs,
        signal: this.signal(),
      });
      await this.waitDataChannelOpen(dc, {
        timeoutMs: openTimeoutMs,
        signal: this.signal(),
      });

      const packetSize = 64;
      for (let i = 0; i < count; i++) {
        if (this.abort) break;
        await this.waitIfPaused();
        const buf = new ArrayBuffer(packetSize);
        new DataView(buf).setUint32(0, i, false);
        crypto.getRandomValues(new Uint8Array(buf, 4, packetSize - 4));
        packets[i] = "sent";
        dc.send(buf);
        this.schedulePacketLossUiFlush();
      }

      this.plPhase = "waiting";
      this.clearPacketLossThrottle();
      this.flushPacketLossProgressSnapshot();

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, echoWaitMs);
      });

      for (let i = 0; i < count; i++) {
        if (packets[i] !== "received") {
          packets[i] = "lost";
        }
      }
      this.plPhase = "done";
      this.clearPacketLossThrottle();
      this.flushPacketLossProgressSnapshot();

      const missing: number[] = [];
      for (let i = 0; i < count; i++) {
        if (packets[i] !== "received") {
          missing.push(i);
        }
      }

      const received = count - missing.length;
      const lost = missing.length;
      const ratio = count > 0 ? lost / count : 0;

      this.lastPacketLoss = {
        sent: count,
        received,
        lost,
        ratio,
        missingIndices: missing,
      };
      this.emitChange();
    } catch (e) {
      this.clearPacketLossThrottle();
      this.packetLossProgress = null;
      this.plLivePackets = null;
      throw e;
    } finally {
      void fetch("/api/webrtc/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => {});
      try {
        pc.close();
      } catch {
        /* ignore */
      }
    }
  }

  private waitIceGatheringBrowser(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === "complete") {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const done = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", done);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", done);
      setTimeout(() => {
        pc.removeEventListener("icegatheringstatechange", done);
        resolve();
      }, 12_000);
    });
  }

  /**
   * SCTP/data channel only opens after ICE reaches a working state; without this,
   * failures surface as a generic data-channel open timeout.
   */
  private waitIceConnectionEstablished(
    pc: RTCPeerConnection,
    options: { readonly timeoutMs: number; readonly signal?: AbortSignal },
  ): Promise<void> {
    const { timeoutMs, signal } = options;
    if (signal?.aborted) {
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    }
    const state = pc.iceConnectionState;
    if (state === "connected" || state === "completed") {
      return Promise.resolve();
    }
    if (state === "failed" || state === "closed") {
      return Promise.reject(new Error(`WebRTC ICE failed (state=${state})`));
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        settled = true;
        window.clearTimeout(t);
        signal?.removeEventListener("abort", onAbort);
        pc.removeEventListener("iceconnectionstatechange", onIce);
      };

      const finish = (action: () => void) => {
        if (settled) return;
        cleanup();
        action();
      };

      const t = window.setTimeout(() => {
        finish(() =>
          reject(
            new Error(
              `WebRTC ICE connection timeout (state=${pc.iceConnectionState})`,
            ),
          ),
        );
      }, timeoutMs);

      const onAbort = () => {
        finish(() => reject(new DOMException("Aborted", "AbortError")));
      };

      const onIce = () => {
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") {
          finish(() => resolve());
        } else if (s === "failed" || s === "closed") {
          finish(() => reject(new Error(`WebRTC ICE failed (state=${s})`)));
        }
      };

      signal?.addEventListener("abort", onAbort, { once: true });
      pc.addEventListener("iceconnectionstatechange", onIce);
      onIce();
    });
  }

  private waitDataChannelOpen(
    dc: RTCDataChannel,
    options: { readonly timeoutMs: number; readonly signal?: AbortSignal },
  ): Promise<void> {
    if (dc.readyState === "open") {
      return Promise.resolve();
    }
    if (dc.readyState === "closing" || dc.readyState === "closed") {
      return Promise.reject(new Error("Data channel closed before open"));
    }

    const { timeoutMs, signal } = options;
    if (signal?.aborted) {
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (action: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(t);
        signal?.removeEventListener("abort", onAbort);
        dc.removeEventListener("open", onOpen);
        dc.removeEventListener("error", onError);
        dc.removeEventListener("close", onClose);
        action();
      };

      const t = window.setTimeout(() => {
        finish(() => reject(new Error("Data channel open timeout")));
      }, timeoutMs);

      const onAbort = () => {
        finish(() => reject(new DOMException("Aborted", "AbortError")));
      };

      const onOpen = () => {
        finish(() => resolve());
      };

      const onError = () => {
        finish(() => reject(new Error("Data channel error")));
      };

      const onClose = () => {
        finish(() => reject(new Error("Data channel closed before open")));
      };

      signal?.addEventListener("abort", onAbort, { once: true });
      dc.addEventListener("open", onOpen, { once: true });
      dc.addEventListener("error", onError, { once: true });
      dc.addEventListener("close", onClose, { once: true });

      if (dc.readyState === "open") {
        finish(() => resolve());
      } else if (dc.readyState === "closing" || dc.readyState === "closed") {
        finish(() => reject(new Error("Data channel closed before open")));
      }
    });
  }

  pause(): void {
    if (!this.running) return;
    this.paused = true;
    this.emitChange();
  }

  resume(): void {
    if (!this.running) return;
    this.paused = false;
    this.emitChange();
  }

  restart(): void {
    this.fetchController?.abort();
    this.abort = true;
    this.running = false;
    this.paused = false;
    this.downloadPoints = [];
    this.uploadPoints = [];
    this.unloadedLatencyPoints = [];
    this.downLoadedLatencyPoints = [];
    this.upLoadedLatencyPoints = [];
    this.realtimeSeries = [];
    this.lastPacketLoss = null;
    this.packetLossProgress = null;
    this.plLivePackets = null;
    this.clearPacketLossThrottle();
    this.currentPhase = { type: "idle" };
    this.abort = false;
    this.emitChange();
    void this.play();
  }

  async play(): Promise<void> {
    if (this.running) return;
    this.fetchController = new AbortController();
    this.running = true;
    this.paused = false;
    this.abort = false;
    this.packetLossProgress = null;
    this.plLivePackets = null;
    this.clearPacketLossThrottle();
    this.onRunningChange?.(true);

    try {
      for (const step of this.steps) {
        if (this.abort) break;
        if (step.type === "latency") {
          for (let i = 0; i < step.count; i++) {
            if (this.abort) break;
            this.setPhase({ type: "latency", current: i + 1, total: step.count });
            await this.waitIfPaused();
            const ms = await this.measurePing();
            this.unloadedLatencyPoints = [
              ...this.unloadedLatencyPoints,
              { ms, index: this.unloadedLatencyPoints.length },
            ];
            this.emitChange();
          }
        } else if (step.type === "download") {
          for (let i = 0; i < step.count; i++) {
            if (this.abort) break;
            this.setPhase({
              type: "download",
              bytes: step.bytes,
              current: i + 1,
              total: step.count,
            });
            await this.measureDownloadOnce(step.bytes);
          }
        } else if (step.type === "upload") {
          for (let i = 0; i < step.count; i++) {
            if (this.abort) break;
            this.setPhase({
              type: "upload",
              bytes: step.bytes,
              current: i + 1,
              total: step.count,
            });
            await this.measureUploadOnce(step.bytes);
          }
        } else if (step.type === "packetLoss") {
          await this.runPacketLoss(
            step.count,
            step.timeoutMs,
            step.openTimeoutMs ?? 20_000,
          );
        }
      }

      this.setPhase({ type: "done" });
      const results = this.getResults();
      this.onFinish?.(results);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // cancelled by restart — not an error
      } else {
        const message = e instanceof Error ? e.message : "Speed test failed";
        this.setPhase({ type: "idle" });
        this.onError?.(message);
      }
    } finally {
      this.running = false;
      this.paused = false;
      this.onRunningChange?.(false);
      this.emitChange();
    }
  }
}
