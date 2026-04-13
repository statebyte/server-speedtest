"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { SpeedTestResults } from "@/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface RealtimeGraphProps {
  readonly results: SpeedTestResults;
}

export function RealtimeGraph({ results }: RealtimeGraphProps) {
  const { t } = useTranslation();

  const chartConfig = useMemo(
    () =>
      ({
        download: {
          label: t("realtime.download"),
          color: "var(--speed-download)",
        },
        upload: {
          label: t("realtime.upload"),
          color: "var(--speed-upload)",
        },
      }) satisfies ChartConfig,
    [t],
  );

  const data = results.realtimeSeries.map((p, i) => ({
    step: i + 1,
    download: p.downloadMbps ?? undefined,
    upload: p.uploadMbps ?? undefined,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        {t("realtime.empty")}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--speed-download)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--speed-download)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillUp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--speed-upload)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--speed-upload)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey="step" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => `${v}`}
          label={{
            value: t("realtime.mbpsAxis"),
            angle: -90,
            position: "insideLeft",
            offset: 10,
          }}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="download"
          stroke="var(--speed-download)"
          fill="url(#fillDown)"
          strokeWidth={2}
          connectNulls
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="upload"
          stroke="var(--speed-upload)"
          fill="url(#fillUp)"
          strokeWidth={2}
          connectNulls
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
