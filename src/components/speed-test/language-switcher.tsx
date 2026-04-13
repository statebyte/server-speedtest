"use client";

import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "inline-flex gap-1.5 px-2",
        )}
      >
        <Languages className="size-4" aria-hidden />
        <span className="hidden text-xs sm:inline">{t("language.label")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void i18n.changeLanguage("en")}>
          {t("language.en")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void i18n.changeLanguage("ru")}>
          {t("language.ru")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
