"use client";

import { useCallback, useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IpRevealCopyRowProps {
  readonly ip: string | null;
  readonly revealLabel: string;
  readonly hideLabel: string;
  readonly copyLabel: string;
  readonly copiedLabel: string;
  /** When true, IP is blurred until the user toggles reveal. */
  readonly blur?: boolean;
}

export function IpRevealCopyRow({
  ip,
  revealLabel,
  hideLabel,
  copyLabel,
  copiedLabel,
  blur = false,
}: IpRevealCopyRowProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!ip) return;
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be denied */
    }
  }, [ip]);

  if (!ip) {
    return <span className="font-mono text-xs">—</span>;
  }

  return (
    <div className="flex min-w-0 max-w-[min(100%,22rem)] flex-1 flex-wrap items-center justify-end gap-1">
      <span
        className={cn(
          "min-w-0 truncate font-mono text-xs font-medium",
          blur && !revealed && "select-none blur-[6px]",
        )}
      >
        {ip}
      </span>
      {blur ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? hideLabel : revealLabel}
          aria-pressed={revealed}
        >
          {revealed ? <EyeOff /> : <Eye />}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => void copy()}
        aria-label={copyLabel}
      >
        <Copy />
      </Button>
      {copied ? (
        <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {copiedLabel}
        </span>
      ) : null}
    </div>
  );
}
