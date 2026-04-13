"use client";

import type { PacketLossProgress, PacketStatus } from "@/types";
import { cn } from "@/lib/utils";

function cellClass(status: PacketStatus): string {
  switch (status) {
    case "pending":
      return "bg-muted";
    case "sent":
      return "bg-amber-500/85 dark:bg-amber-400/70";
    case "received":
      return "bg-emerald-500/85 dark:bg-emerald-400/70";
    case "lost":
      return "bg-red-500/85 dark:bg-red-400/70";
  }
}

interface PacketLossGridProps {
  readonly progress: PacketLossProgress;
}

/**
 * Compact grid of per-packet WebRTC echo statuses (pending → sent → received | lost).
 */
export function PacketLossGrid({ progress }: PacketLossGridProps) {
  return (
    <div
      className="grid max-h-52 w-full gap-px overflow-auto rounded-md border border-border bg-border p-1"
      style={{ gridTemplateColumns: "repeat(40, minmax(0, 1fr))" }}
      role="img"
      aria-label="Packet loss live grid"
    >
      {progress.packets.map((st, idx) => (
        <div
          key={idx}
          className={cn("aspect-square w-full min-h-[5px] min-w-[5px] max-h-2 max-w-2", cellClass(st))}
          title={`#${idx}: ${st}`}
        />
      ))}
    </div>
  );
}
