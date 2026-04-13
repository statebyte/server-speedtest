import type { NetworkQualityScores, QualityLabel } from "@/types";

function labelFromScore(score: number): QualityLabel {
  const s = Math.min(100, Math.max(0, score));
  if (s >= 85) return "excellent";
  if (s >= 70) return "good";
  if (s >= 50) return "average";
  if (s >= 30) return "low";
  return "poor";
}

/**
 * Heuristic AIM-style scores from measured Mbps and latency (ms).
 * Not identical to Cloudflare AIM; tuned for self-hosted UX.
 */
export function computeNetworkQuality(input: {
  readonly downloadMbps: number | null;
  readonly uploadMbps: number | null;
  readonly unloadedLatencyMs: number | null;
}): NetworkQualityScores {
  const down = input.downloadMbps ?? 0;
  const up = input.uploadMbps ?? 0;
  const lat = input.unloadedLatencyMs ?? 999;

  const streaming = Math.min(
    100,
    Math.min(down / 25, 1) * 40 +
      Math.min(up / 5, 1) * 30 +
      (lat < 80 ? 30 : lat < 150 ? 20 : lat < 250 ? 10 : 0),
  );

  const gaming = Math.min(
    100,
    (lat < 20 ? 50 : lat < 40 ? 40 : lat < 70 ? 25 : lat < 120 ? 15 : 5) +
      Math.min(down / 50, 1) * 25 +
      Math.min(up / 10, 1) * 25,
  );

  const videoChat = Math.min(
    100,
    Math.min(up / 3, 1) * 45 +
      (lat < 100 ? 30 : lat < 180 ? 18 : lat < 280 ? 8 : 0) +
      Math.min(down / 10, 1) * 25,
  );

  return {
    videoStreaming: labelFromScore(streaming),
    onlineGaming: labelFromScore(gaming),
    videoChatting: labelFromScore(videoChat),
  };
}
