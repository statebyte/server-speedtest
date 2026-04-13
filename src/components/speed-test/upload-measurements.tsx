"use client";

import { useTranslation } from "react-i18next";
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

interface UploadMeasurementsProps {
  readonly points: readonly BandwidthPoint[];
}

export function UploadMeasurements({ points }: UploadMeasurementsProps) {
  const { t } = useTranslation();
  const groups = groupByBytes(points);
  const keys = [...groups.keys()].sort((a, b) => a - b);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">{t("uploadMeasurements.title")}</h2>
      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("uploadMeasurements.empty")}</p>
      ) : (
        <div className="space-y-6">
          {keys.map((bytes) => (
            <div key={bytes} className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                {t("uploadMeasurements.perSize", { size: formatBytesLabel(bytes) })}
              </div>
              <BandwidthChart
                points={groups.get(bytes) ?? []}
                colorVar="var(--speed-upload)"
                label={t("uploadMeasurements.durationAxis")}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
