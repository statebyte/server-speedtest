"use client";

import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com/statebyte/server-speedtest";

const DOWNLOAD_PRESETS = [
  { bytes: 100 * 1024 * 1024, labelKey: "footer.download100" as const },
  { bytes: 200 * 1024 * 1024, labelKey: "footer.download200" as const },
  { bytes: 500 * 1024 * 1024, labelKey: "footer.download500" as const },
  { bytes: 1024 * 1024 * 1024, labelKey: "footer.download1gb" as const },
] as const;

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-border bg-card/30 py-4 text-center">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {DOWNLOAD_PRESETS.map(({ bytes, labelKey }) => (
            <a
              key={bytes}
              href={`/api/download?bytes=${bytes}`}
              className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
            >
              {t(labelKey)}
            </a>
          ))}
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t("footer.copyright")}
        </a>
      </div>
    </footer>
  );
}
