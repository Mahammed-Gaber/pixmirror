import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

/** Syncs `<html lang/dir>` with the active i18next language. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const apply = (lng: string) => {
      const base = lng.split("-")[0] ?? lng;
      document.documentElement.lang = base;
      document.documentElement.dir = base === "ar" ? "rtl" : "ltr";
    };

    apply(i18n.language);
    i18n.on("languageChanged", apply);
    return () => {
      i18n.off("languageChanged", apply);
    };
  }, [i18n]);

  return children;
}
