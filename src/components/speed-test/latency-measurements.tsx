"use client";

import type { LatencyPoint, SpeedTestResults } from "@/types";
import { LatencyScatterChart } from "@/components/speed-test/latency-scatter-chart";

interface LatencyMeasurementsProps {
  readonly results: SpeedTestResults;
}

export function LatencyMeasurements({ results }: LatencyMeasurementsProps) {
  const blocks: { key: string; title: string; points: readonly LatencyPoint[]; color: string }[] =
    [
      {
        key: "unloaded",
        title: "Unloaded latency",
        points: results.unloadedLatencyPoints,
        color: "var(--chart-2)",
      },
      {
        key: "down",
        title: "Latency during download",
        points: results.downLoadedLatencyPoints,
        color: "var(--speed-download)",
      },
      {
        key: "up",
        title: "Latency during upload",
        points: results.upLoadedLatencyPoints,
        color: "var(--speed-upload)",
      },
    ];

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">Latency Measurements</h2>
      <div className="space-y-6">
        {blocks.map((b) => (
          <div key={b.key} className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">{b.title}</div>
            <LatencyScatterChart points={b.points} colorVar={b.color} label="ms" />
          </div>
        ))}
      </div>
    </section>
  );
}
