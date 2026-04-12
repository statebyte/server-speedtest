"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
        aria-label="Light theme"
        onClick={() => setTheme("light")}
      >
        <Sun className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(theme === "dark" && "bg-muted")}
        aria-label="Dark theme"
        onClick={() => setTheme("dark")}
      >
        <Moon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(theme === "system" && "bg-muted")}
        aria-label="System theme"
        onClick={() => setTheme("system")}
      >
        <Monitor className="size-4" />
      </Button>
    </div>
  );
}
