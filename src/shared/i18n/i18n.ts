import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./messages/ar.json";
import en from "./messages/en.json";

export type AppLocale = "ar" | "en";
/** Follow OS, or force a locale. */
export type LocalePreference = "system" | AppLocale;

const PREFERENCE_KEY = "app.localePreference";

function detectSystemLocale(): AppLocale {
  const tags = [navigator.language, ...(navigator.languages ?? [])];
  return tags.some((t) => t.toLowerCase().startsWith("ar")) ? "ar" : "en";
}

export function getLocalePreference(): LocalePreference {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    if (raw === "ar" || raw === "en" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

export function resolveLocale(pref: LocalePreference = getLocalePreference()): AppLocale {
  return pref === "system" ? detectSystemLocale() : pref;
}

/** Persist preference and apply language (used from Settings). */
export function setLocalePreference(pref: LocalePreference) {
  try {
    localStorage.setItem(PREFERENCE_KEY, pref);
  } catch {
    /* ignore */
  }
  void i18n.changeLanguage(resolveLocale(pref));
}

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: resolveLocale(),
  fallbackLng: "en",
  supportedLngs: ["ar", "en"],
  // Match existing JSON placeholders `{name}` (default i18next is `{{name}}`).
  interpolation: {
    escapeValue: false,
    prefix: "{",
    suffix: "}",
  },
  returnNull: false,
  parseMissingKeyHandler: (key) => key,
});

export default i18n;
