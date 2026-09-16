export const supportedLocales = ["en", "ru", "kk"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export type ProductCategoryTranslationInput = {
  locale: string;
  name: string;
  description: string | null;
};

export function parseProductCategoryTranslations(value: unknown) {
  if (!Array.isArray(value)) return null;

  const translations = value.map((item) => {
    if (!item || typeof item !== "object") return null;

    const translation = item as Record<string, unknown>;
    const locale = typeof translation.locale === "string" ? translation.locale : "";
    const name = typeof translation.name === "string" ? translation.name.trim() : "";
    const description =
      translation.description == null ? null : String(translation.description).trim();

    if (!supportedLocales.includes(locale as SupportedLocale) || !name) {
      return null;
    }

    return { locale, name, description };
  });

  if (
    translations.some((translation) => translation === null) ||
    new Set(translations.map((translation) => translation?.locale)).size !==
      translations.length ||
    !translations.some((translation) => translation?.locale === "en")
  ) {
    return null;
  }

  return translations as ProductCategoryTranslationInput[];
}

export function getLocalizedName(
  translations: Array<{ locale: string; name: string }>,
  locale: SupportedLocale,
) {
  return (
    translations.find((translation) => translation.locale === locale)?.name ??
    translations.find((translation) => translation.locale === "en")?.name ??
    translations[0]?.name ??
    null
  );
}
