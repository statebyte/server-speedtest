"use client";

import { useTranslation } from "react-i18next";

const GITHUB_URL = "https://github.com/StateByte/server-speedtest";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-border bg-card/30 py-4 text-center">
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        {t("footer.copyright")}
      </a>
    </footer>
  );
}
