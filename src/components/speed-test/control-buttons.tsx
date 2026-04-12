"use client";

import { Link2, RotateCcw, Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ControlButtonsProps {
  readonly running: boolean;
  readonly paused: boolean;
  readonly started: boolean;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onRestart: () => void;
}

export function ControlButtons({
  running,
  paused,
  started,
  onPause,
  onResume,
  onRestart,
}: ControlButtonsProps) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }));

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {started && running && !paused ? (
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      ) : null}
      {started && running && paused ? (
        <Button variant="outline" size="sm" onClick={onResume}>
          Resume
        </Button>
      ) : null}
      {started ? (
        <Button variant="outline" size="sm" onClick={onRestart}>
          <RotateCcw className="size-3.5" />
          Retest
        </Button>
      ) : null}
      <a
        href="https://radar.cloudflare.com/"
        target="_blank"
        rel="noreferrer"
        className={linkClass}
      >
        Compare your results on Radar
      </a>
      <div className="ml-auto flex items-center gap-1">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on X"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          title="Share on X"
        >
          <span className="text-xs font-semibold">𝕏</span>
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on Facebook"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          title="Share on Facebook"
        >
          <Share2 className="size-4" />
        </a>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          title="Copy link"
          aria-label="Copy link"
          onClick={() => void navigator.clipboard.writeText(shareUrl)}
        >
          <Link2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
