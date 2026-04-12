import Link from "next/link";
import { Cloud } from "lucide-react";
import { ThemeToggle } from "@/components/speed-test/theme-toggle";

export function Header() {
  return (
    <header className="border-b border-border bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Cloud className="size-7 text-foreground" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">Speed Test</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="https://developers.cloudflare.com/"
            className="hidden text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:inline"
            target="_blank"
            rel="noreferrer"
          >
            Built with Cloudflare Developer Platform
          </Link>
        </div>
      </div>
    </header>
  );
}
