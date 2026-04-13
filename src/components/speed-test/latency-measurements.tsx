"use client";

import { useTranslation } from "react-i18next";
import type { LatencyPoint, SpeedTestResults } from "@/types";
import { LatencyScatterChart } from "@/components/speed-test/latency-scatter-chart";

interface LatencyMeasurementsProps {
  readonly results: SpeedTestResults;
}

export function LatencyMeasurements({ results }: LatencyMeasurementsProps) {
  const { t } = useTranslation();

  const blocks: { key: string; title: string; points: readonly LatencyPoint[]; color: string }[] =
    [
      {
        key: "unloaded",
        title: t("latencyMeasurements.unloaded"),
        points: results.unloadedLatencyPoints,
        color: "var(--chart-2)",
      },
      {
        key: "down",
        title: t("latencyMeasurements.duringDownload"),
        points: results.downLoadedLatencyPoints,
        color: "var(--speed-download)",
      },
      {
        key: "up",
        title: t("latencyMeasurements.duringUpload"),
        points: results.upLoadedLatencyPoints,
        color: "var(--speed-upload)",
      },
    ];

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">{t("latencyMeasurements.title")}</h2>
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
