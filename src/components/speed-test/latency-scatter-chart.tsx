"use client";

import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import type { LatencyPoint } from "@/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface LatencyScatterChartProps {
  readonly points: readonly LatencyPoint[];
  readonly colorVar: string;
  readonly label: string;
}

export function LatencyScatterChart({
  points,
  colorVar,
  label,
}: LatencyScatterChartProps) {
  const chartConfig = {
    y: { label, color: colorVar },
  } satisfies ChartConfig;

  const data = points.map((p) => ({
    x: p.index,
    y: p.ms,
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
      <ScatterChart margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis type="number" dataKey="x" name="Sample" tickLine={false} axisLine={false} />
        <YAxis
          type="number"
          dataKey="y"
          name="ms"
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent />} />
        <Scatter name={label} data={data} fill={colorVar} isAnimationActive={false} />
      </ScatterChart>
    </ChartContainer>
  );
}
