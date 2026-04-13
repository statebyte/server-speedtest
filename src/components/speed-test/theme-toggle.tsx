"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for next-themes (client-only theme value).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount gate after SSR
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-7 w-[5.5rem]" aria-hidden />;
  }

  return (
    <div className="flex rounded-lg border border-border bg-background p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(theme === "light" && "bg-muted")}
        aria-label={t("theme.light")}
        onClick={() => setTheme("light")}
      >
        <Sun className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(theme === "dark" && "bg-muted")}
        aria-label={t("theme.dark")}
        onClick={() => setTheme("dark")}
      >
        <Moon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(theme === "system" && "bg-muted")}
        aria-label={t("theme.system")}
        onClick={() => setTheme("system")}
      >
        <Monitor className="size-4" />
      </Button>
    </div>
  );
}
