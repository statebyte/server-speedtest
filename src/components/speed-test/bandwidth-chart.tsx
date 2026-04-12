"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { BandwidthPoint } from "@/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface BandwidthChartProps {
  readonly points: readonly BandwidthPoint[];
  readonly colorVar: string;
  readonly label: string;
}

export function BandwidthChart({ points, colorVar, label }: BandwidthChartProps) {
  const chartConfig = {
    ms: { label, color: colorVar },
  } satisfies ChartConfig;

  const data = points.map((p, i) => ({
    run: `#${i + 1}`,
    ms: Math.round(p.durationMs),
    mbps: (p.bps / 1e6).toFixed(2),
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        No samples
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[160px] w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey="run" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey="ms" fill={colorVar} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
