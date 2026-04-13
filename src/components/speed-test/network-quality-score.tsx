"use client";

import { useTranslation } from "react-i18next";
import type { NetworkQualityScores, QualityLabel } from "@/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function qualityClass(label: QualityLabel): string {
  if (label === "poor" || label === "low") {
    return "text-[color:oklch(0.65_0.19_45)]";
  }
  if (label === "average") {
    return "text-[color:oklch(0.7_0.14_75)]";
  }
  return "text-emerald-600 dark:text-emerald-400";
}

interface NetworkQualityScoreProps {
  readonly scores: NetworkQualityScores | null;
}

export function NetworkQualityScore({ scores }: NetworkQualityScoreProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">
        {t("networkQuality.title")}
      </h2>
      {!scores ? (
        <p className="text-sm text-muted-foreground">{t("networkQuality.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-1 px-2 py-3 sm:py-1">
            <span className="text-xs text-muted-foreground">{t("networkQuality.streaming")}</span>
            <span className={cn("text-lg font-semibold", qualityClass(scores.videoStreaming))}>
              {t(`quality.${scores.videoStreaming}`)}
            </span>
          </div>
          <Separator className="sm:hidden" />
          <div className="flex flex-col gap-1 px-2 py-3 sm:py-1">
            <span className="text-xs text-muted-foreground">{t("networkQuality.gaming")}</span>
            <span className={cn("text-lg font-semibold", qualityClass(scores.onlineGaming))}>
              {t(`quality.${scores.onlineGaming}`)}
            </span>
          </div>
          <Separator className="sm:hidden" />
          <div className="flex flex-col gap-1 px-2 py-3 sm:py-1">
            <span className="text-xs text-muted-foreground">{t("networkQuality.chatting")}</span>
            <span className={cn("text-lg font-semibold", qualityClass(scores.videoChatting))}>
              {t(`quality.${scores.videoChatting}`)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
