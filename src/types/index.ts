export type QualityLabel = "Poor" | "Low" | "Average" | "Good" | "Excellent";

export interface BandwidthPoint {
  readonly bytes: number;
  readonly bps: number;
  readonly durationMs: number;
  readonly serverTimeMs: number;
  readonly index: number;
}

export interface LatencyPoint {
  readonly ms: number;
  readonly index: number;
}

export interface PacketLossResult {
  readonly sent: number;
  readonly received: number;
  readonly lost: number;
  readonly ratio: number;
  readonly missingIndices: readonly number[];
}

export interface NetworkQualityScores {
  readonly videoStreaming: QualityLabel;
  readonly onlineGaming: QualityLabel;
  readonly videoChatting: QualityLabel;
}

export interface SpeedTestResults {
  readonly downloadBps: number | null;
  readonly uploadBps: number | null;
  readonly unloadedLatencyMs: number | null;
  readonly unloadedJitterMs: number | null;
  readonly downLoadedLatencyMs: number | null;
  readonly downLoadedJitterMs: number | null;
  readonly upLoadedLatencyMs: number | null;
  readonly upLoadedJitterMs: number | null;
  readonly packetLoss: PacketLossResult | null;
  readonly downloadPoints: readonly BandwidthPoint[];
  readonly uploadPoints: readonly BandwidthPoint[];
  readonly unloadedLatencyPoints: readonly LatencyPoint[];
  readonly downLoadedLatencyPoints: readonly LatencyPoint[];
  readonly upLoadedLatencyPoints: readonly LatencyPoint[];
  readonly networkQuality: NetworkQualityScores | null;
  readonly realtimeSeries: readonly { readonly t: number; readonly downloadMbps: number | null; readonly uploadMbps: number | null }[];
}

export interface ServerInfo {
  readonly serverHostname: string;
  readonly serverIp: string | null;
  readonly serverCity: string | null;
  readonly serverCountry: string | null;
  readonly serverLat: number | null;
  readonly serverLon: number | null;
  readonly clientIp: string | null;
  readonly protocol: string;
}

export type MeasurementStep =
  | { readonly type: "latency"; readonly count: number }
  | { readonly type: "download"; readonly bytes: number; readonly count: number }
  | { readonly type: "upload"; readonly bytes: number; readonly count: number }
  | { readonly type: "packetLoss"; readonly count: number; readonly timeoutMs: number };
