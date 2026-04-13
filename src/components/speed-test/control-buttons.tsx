"use client";

import { Link2, RotateCcw, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }));

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {started && running && !paused ? (
        <Button variant="outline" size="sm" onClick={onPause}>
          {t("controls.pause")}
        </Button>
      ) : null}
      {started && running && paused ? (
        <Button variant="outline" size="sm" onClick={onResume}>
          {t("controls.resume")}
        </Button>
      ) : null}
      {started ? (
        <Button variant="outline" size="sm" onClick={onRestart}>
          <RotateCcw className="size-3.5" />
          {t("controls.retest")}
        </Button>
      ) : null}
      <a
        href="https://radar.cloudflare.com/"
        target="_blank"
        rel="noreferrer"
        className={linkClass}
      >
        {t("controls.radar")}
      </a>
      <div className="ml-auto flex items-center gap-1">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t("controls.shareX")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          title={t("controls.shareX")}
        >
          <span className="text-xs font-semibold">𝕏</span>
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noreferrer"
          aria-label={t("controls.shareFb")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          title={t("controls.shareFb")}
        >
          <Share2 className="size-4" />
        </a>
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          title={t("controls.copyLink")}
          aria-label={t("controls.copyLink")}
          onClick={() => void navigator.clipboard.writeText(shareUrl)}
        >
          <Link2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
