"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { SpeedTestPhase } from "@/types";
import { formatBytesLabel } from "@/lib/formatters";

interface LivePhaseBadgeProps {
  readonly phase: SpeedTestPhase;
}

/**
 * Short human-readable label for the active speed-test step (next to Live results).
 */
export function LivePhaseBadge({ phase }: LivePhaseBadgeProps) {
  const { t } = useTranslation();

  let label: string;
  switch (phase.type) {
    case "idle":
      return null;
    case "latency":
      label = t("phases.latency", { current: phase.current, total: phase.total });
      break;
    case "download":
      label = t("phases.download", {
        size: formatBytesLabel(phase.bytes),
        current: phase.current,
        total: phase.total,
      });
      break;
    case "upload":
      label = t("phases.upload", {
        size: formatBytesLabel(phase.bytes),
        current: phase.current,
        total: phase.total,
      });
      break;
    case "packetLoss":
      label = t("phases.packetLoss", {
        sent: phase.sent,
        total: phase.total,
        received: phase.received,
      });
      break;
    case "done":
      label = t("phases.done");
      break;
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }

  return (
    <Badge variant="secondary" className="max-w-[min(100%,28rem)] shrink truncate font-normal">
      {label}
    </Badge>
  );
}
