"use client";

import { Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/speed-test/language-switcher";
import { ThemeToggle } from "@/components/speed-test/theme-toggle";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-border bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Cloud className="size-7 text-foreground" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">{t("header.brand")}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
