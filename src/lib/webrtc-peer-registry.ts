/**
 * Keeps Node RTCPeerConnection instances alive after the HTTP handler returns,
 * until the browser finishes the packet-loss test and calls /api/webrtc/close.
 */

type PeerEntry = {
  readonly pc: { close: () => void };
  readonly closeTimer: ReturnType<typeof setTimeout>;
};

const registry = new Map<string, PeerEntry>();

const TTL_MS = 120_000;

export function registerWebRtcPeer(sessionId: string, pc: PeerEntry["pc"]): void {
  const existing = registry.get(sessionId);
  if (existing) {
    clearTimeout(existing.closeTimer);
    try {
      existing.pc.close();
    } catch {
      /* ignore */
    }
  }
  const closeTimer = setTimeout(() => {
    closeWebRtcPeer(sessionId);
  }, TTL_MS);
  registry.set(sessionId, { pc, closeTimer });
}

export function closeWebRtcPeer(sessionId: string): void {
  const entry = registry.get(sessionId);
  if (!entry) return;
  clearTimeout(entry.closeTimer);
  try {
    entry.pc.close();
  } catch {
    /* ignore */
  }
  registry.delete(sessionId);
}
