"use client";

import type { PacketLossResult } from "@/types";
import { formatPercent } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PacketLossMeasurementsProps {
  readonly packetLoss: PacketLossResult | null;
}

export function PacketLossMeasurements({ packetLoss }: PacketLossMeasurementsProps) {
  const receivedPct = packetLoss
    ? (packetLoss.received / Math.max(1, packetLoss.sent)) * 100
    : 0;
  const lostPct = packetLoss ? (packetLoss.lost / Math.max(1, packetLoss.sent)) * 100 : 0;

  const preview = packetLoss?.missingIndices.slice(0, 40) ?? [];
  const more =
    packetLoss && packetLoss.missingIndices.length > preview.length
      ? packetLoss.missingIndices.length - preview.length
      : 0;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">Packet Loss Measurements</h2>
      {!packetLoss ? (
        <p className="text-sm text-muted-foreground">
          Packet loss uses 1000 unreliable WebRTC data channel messages (UDP under ICE) echoed
          by this server.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Received</span>
              <span>Lost</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-emerald-500/20">
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500 transition-all"
                style={{ width: `${receivedPct}%` }}
              />
              <div
                className="absolute inset-y-0 bg-red-500 transition-all"
                style={{
                  left: `${receivedPct}%`,
                  width: `${lostPct}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatPercent(receivedPct / 100)} received
              </span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatPercent(lostPct / 100)} lost
              </span>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Missing messages (sample indices)
            </div>
            {preview.length === 0 ? (
              <p className="text-sm text-muted-foreground">No missing packets.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{idx}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {more > 0 ? (
                  <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                    +{more} more…
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
