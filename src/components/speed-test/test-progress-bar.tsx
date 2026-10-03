"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { buildProgressSegments, DEFAULT_MEASUREMENT_STEPS } from "@/config/speed-test-measurement";
import { formatBytesLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ProgressSegment, SpeedTestResults } from "@/types";

const KIND_COLOR: Record<ProgressSegment["kind"], string> = {
  latency: "bg-blue-500",
  download: "bg-orange-500",
  upload: "bg-purple-400",
  packetLoss: "bg-red-500",
};

const CHEVRON = "polygon(0 0, 55% 0, 100% 50%, 55% 100%, 0 100%, 45% 50%)";

interface TestProgressBarProps {
  readonly results: SpeedTestResults;
}

/** Segmented chevron bar: one segment per ping / transfer, coloured by phase. */
export function TestProgressBar({ results }: TestProgressBarProps) {
  const { t } = useTranslation();
  const segments = useMemo(() => buildProgressSegments(DEFAULT_MEASUREMENT_STEPS), []);
  const { completed } = results.progress;
  const done = results.currentPhase.type === "done";

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={segments.length}
      aria-valuenow={completed}
      className="flex w-full items-center"
    >
      {segments.map((seg, i) => {
        const state = i < completed ? "done" : i === completed && !done ? "active" : "pending";
        const label =
          seg.kind === "latency"
            ? t("progress.latency")
            : seg.kind === "packetLoss"
              ? t("progress.packetLoss")
              : t(seg.kind === "download" ? "progress.download" : "progress.upload", {
                  size: formatBytesLabel(seg.size ?? 0),
                });
        return (
          <Tooltip key={i}>
            <TooltipTrigger
              render={<span />}
              className={cn(
                "-mr-[3px] h-4 min-w-0 flex-1 transition-colors",
                state === "pending" ? "bg-muted-foreground/25" : KIND_COLOR[seg.kind],
                state === "active" && "animate-pulse",
              )}
              style={{ clipPath: CHEVRON }}
            />
            <TooltipContent>
              <div className="space-y-0.5">
                <div className="font-medium">{label}</div>
                <div>{t("progress.step", { current: i + 1, total: segments.length })}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
