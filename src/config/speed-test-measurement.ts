import type { MeasurementStep } from "@/types";

/**
 * Repeat counts for each fixed-size segment of the speed test sequence.
 * Edit these values to tune duration vs. accuracy; the engine consumes the
 * built {@link MeasurementStep} list produced by {@link buildMeasurementSteps}.
 */
export interface SpeedTestMeasurementConfig {
  /** Single ping before the first small download. */
  readonly initialLatencyPings: number;
  readonly download100kWarmup: number;
  /** Unloaded latency sample size (between small and larger transfers). */
  readonly unloadedLatencyPings: number;
  readonly download100kBursts: number;
  readonly download1m: number;
  readonly upload100k: number;
  readonly upload1m: number;
  readonly download10m: number;
  readonly upload10m: number;
  readonly download25m: number;
  readonly upload25m: number;
  /** WebRTC UDP-style probe count; set `probes` to 0 to skip packet loss. */
  readonly packetLoss: {
    readonly probes: number;
    readonly echoWaitMs: number;
    readonly openTimeoutMs?: number;
  };
}

export const DEFAULT_SPEED_TEST_MEASUREMENT_CONFIG: SpeedTestMeasurementConfig = {
  initialLatencyPings: 1,
  download100kWarmup: 1,
  unloadedLatencyPings: 20,
  download100kBursts: 9,
  download1m: 8,
  upload100k: 8,
  upload1m: 6,
  download10m: 6,
  upload10m: 4,
  download25m: 4,
  upload25m: 4,
  packetLoss: {
    probes: 1000,
    echoWaitMs: 6000,
    openTimeoutMs: 20_000,
  },
};

export function buildMeasurementSteps(
  config: SpeedTestMeasurementConfig = DEFAULT_SPEED_TEST_MEASUREMENT_CONFIG,
): readonly MeasurementStep[] {
  const steps: MeasurementStep[] = [
    { type: "latency", count: config.initialLatencyPings },
    { type: "download", bytes: 100_000, count: config.download100kWarmup },
    { type: "latency", count: config.unloadedLatencyPings },
    { type: "download", bytes: 100_000, count: config.download100kBursts },
    { type: "download", bytes: 1_000_000, count: config.download1m },
    { type: "upload", bytes: 100_000, count: config.upload100k },
  ];

  const { probes, echoWaitMs, openTimeoutMs } = config.packetLoss;
  if (probes > 0) {
    steps.push({
      type: "packetLoss",
      count: probes,
      timeoutMs: echoWaitMs,
      ...(openTimeoutMs != null ? { openTimeoutMs } : {}),
    });
  }

  steps.push(
    { type: "upload", bytes: 1_000_000, count: config.upload1m },
    { type: "download", bytes: 10_000_000, count: config.download10m },
    { type: "upload", bytes: 10_000_000, count: config.upload10m },
    { type: "download", bytes: 25_000_000, count: config.download25m },
    { type: "upload", bytes: 25_000_000, count: config.upload25m },
  );

  return steps;
}

export const DEFAULT_MEASUREMENT_STEPS: readonly MeasurementStep[] =
  buildMeasurementSteps(DEFAULT_SPEED_TEST_MEASUREMENT_CONFIG);
