import { EN_MESSAGES, RU_MESSAGES, type TranslationKey } from "./translations.js";

export type AppLanguage = "en" | "ru";
export type TranslationValues = Record<string, string | number>;
export type Translator = (key: TranslationKey, values?: TranslationValues) => string;

export const DEFAULT_LANGUAGE: AppLanguage = "en";
export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ["en", "ru"];

const TRANSLATIONS: Record<AppLanguage, Partial<Record<TranslationKey, string>>> = {
  en: EN_MESSAGES,
  ru: RU_MESSAGES
};

export function normalizeLanguage(value: unknown): AppLanguage | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "ru" || normalized.startsWith("ru-")) {
    return "ru";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return null;
}

export function detectSystemLanguage(locales?: readonly string[]): AppLanguage {
  const detectedLocales = locales || getNavigatorLocales();
  for (const locale of detectedLocales) {
    const language = normalizeLanguage(locale);
    if (language) {
      return language;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function resolveLanguage(value: unknown, systemLocales?: readonly string[]): AppLanguage {
  return normalizeLanguage(value) || detectSystemLanguage(systemLocales);
}

export function translate(language: AppLanguage, key: TranslationKey, values: TranslationValues = {}): string {
  const template = TRANSLATIONS[language][key] || EN_MESSAGES[key];
  return interpolate(template, values);
}

export function createTranslator(language: AppLanguage): Translator {
  return (key, values) => translate(language, key, values);
}

function getNavigatorLocales(): readonly string[] {
  const nav = globalThis.navigator;
  if (!nav) {
    return [];
  }

  if (Array.isArray(nav.languages) && nav.languages.length > 0) {
    return nav.languages;
  }

  return nav.language ? [nav.language] : [];
}

function interpolate(template: string, values: TranslationValues): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export type { TranslationKey };
