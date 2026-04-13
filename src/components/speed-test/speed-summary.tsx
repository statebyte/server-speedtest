"use client";

import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SpeedTestResults } from "@/types";
import { formatMbpsNumber, formatMs, formatPercent } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SpeedSummaryProps {
  readonly results: SpeedTestResults;
}

export function SpeedSummary({ results }: SpeedSummaryProps) {
  const { t } = useTranslation();
  const down = results.downloadBps;
  const up = results.uploadBps;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr_minmax(220px,280px)]">
      <div>
        <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowDown className="size-4" style={{ color: "var(--speed-download)" }} />
          <span>{t("speedSummary.download")}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="h-6 w-6 text-muted-foreground"
            title={t("speedSummary.downloadTitle")}
          >
            <Info className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className="text-5xl font-semibold tracking-tight sm:text-6xl"
            style={{ color: "var(--speed-download)" }}
          >
            {formatMbpsNumber(down)}
          </span>
          <span className="text-lg text-muted-foreground">{t("speedSummary.mbps")}</span>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowUp className="size-4" style={{ color: "var(--speed-upload)" }} />
          <span>{t("speedSummary.upload")}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="h-6 w-6 text-muted-foreground"
            title={t("speedSummary.uploadTitle")}
          >
            <Info className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className="text-5xl font-semibold tracking-tight sm:text-6xl"
            style={{ color: "var(--speed-upload)" }}
          >
            {formatMbpsNumber(up)}
          </span>
          <span className="text-lg text-muted-foreground">{t("speedSummary.mbps")}</span>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <div className="text-muted-foreground">{t("speedSummary.latency")}</div>
          <div className="text-3xl font-semibold">
            {formatMs(results.unloadedLatencyMs, 0)}
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {t("speedSummary.badgeUnloaded", { value: formatMs(results.unloadedLatencyMs, 0) })}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {t("speedSummary.badgeLoadedDown", { value: formatMs(results.downLoadedLatencyMs, 0) })}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {t("speedSummary.badgeLoadedUp", { value: formatMs(results.upLoadedLatencyMs, 0) })}
            </Badge>
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">{t("speedSummary.jitter")}</div>
          <div className="text-2xl font-semibold">
            {formatMs(results.unloadedJitterMs)}
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {t("speedSummary.jitterDown", { value: formatMs(results.downLoadedJitterMs) })}
            </span>
            <span>·</span>
            <span>{t("speedSummary.jitterUp", { value: formatMs(results.upLoadedJitterMs) })}</span>
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">{t("speedSummary.packetLoss")}</div>
          <div className="text-2xl font-semibold">
            {formatPercent(results.packetLoss?.ratio)}
          </div>
          <div className="text-xs text-muted-foreground">
            {results.packetLoss
              ? t("speedSummary.packetsReceived", {
                  received: results.packetLoss.received,
                  sent: results.packetLoss.sent,
                })
              : t("speedSummary.packetsPending")}
          </div>
        </div>
      </div>
    </div>
  );
}
