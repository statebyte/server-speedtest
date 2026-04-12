"use client";

import type { BandwidthPoint } from "@/types";
import { formatBytesLabel } from "@/lib/formatters";
import { BandwidthChart } from "@/components/speed-test/bandwidth-chart";

function groupByBytes(points: readonly BandwidthPoint[]): Map<number, BandwidthPoint[]> {
  const m = new Map<number, BandwidthPoint[]>();
  for (const p of points) {
    const arr = m.get(p.bytes) ?? [];
    arr.push(p);
    m.set(p.bytes, arr);
  }
  return m;
}

interface DownloadMeasurementsProps {
  readonly points: readonly BandwidthPoint[];
}

export function DownloadMeasurements({ points }: DownloadMeasurementsProps) {
  const groups = groupByBytes(points);
  const keys = [...groups.keys()].sort((a, b) => a - b);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">Download Measurements</h2>
      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">Run the test to see per-size timings.</p>
      ) : (
        <div className="space-y-6">
          {keys.map((bytes) => (
            <div key={bytes} className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                {formatBytesLabel(bytes)} download — request duration (ms)
              </div>
              <BandwidthChart
                points={groups.get(bytes) ?? []}
                colorVar="var(--speed-download)"
                label="Duration (ms)"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
