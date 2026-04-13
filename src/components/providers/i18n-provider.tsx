"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export function I18nProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    const setLang = (lng: string) => {
      document.documentElement.lang = lng.startsWith("ru") ? "ru" : "en";
    };
    setLang(i18n.resolvedLanguage ?? i18n.language);
    const handler = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
