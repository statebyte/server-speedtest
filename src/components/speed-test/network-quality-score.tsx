"use client";

import type { NetworkQualityScores, QualityLabel } from "@/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function qualityClass(label: QualityLabel): string {
  if (label === "Poor" || label === "Low") {
    return "text-[color:oklch(0.65_0.19_45)]";
  }
  if (label === "Average") {
    return "text-[color:oklch(0.7_0.14_75)]";
  }
  return "text-emerald-600 dark:text-emerald-400";
}

interface NetworkQualityScoreProps {
  readonly scores: NetworkQualityScores | null;
}

export function NetworkQualityScore({ scores }: NetworkQualityScoreProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">
        Network Quality Score
      </h2>
      {!scores ? (
        <p className="text-sm text-muted-foreground">
          Complete the test to see quality scores.
        </p>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-1 px-2 py-3 sm:py-1">
            <span className="text-xs text-muted-foreground">Video streaming</span>
            <span className={cn("text-lg font-semibold", qualityClass(scores.videoStreaming))}>
              {scores.videoStreaming}
            </span>
          </div>
          <Separator className="sm:hidden" />
          <div className="flex flex-col gap-1 px-2 py-3 sm:py-1">
            <span className="text-xs text-muted-foreground">Online gaming</span>
            <span className={cn("text-lg font-semibold", qualityClass(scores.onlineGaming))}>
              {scores.onlineGaming}
            </span>
          </div>
          <Separator className="sm:hidden" />
          <div className="flex flex-col gap-1 px-2 py-3 sm:py-1">
            <span className="text-xs text-muted-foreground">Video chatting</span>
            <span className={cn("text-lg font-semibold", qualityClass(scores.videoChatting))}>
              {scores.videoChatting}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
