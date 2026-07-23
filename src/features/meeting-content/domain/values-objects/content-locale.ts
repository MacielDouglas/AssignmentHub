export const CONTENT_LOCALES = ["pt", "es"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export function isContentLocale(value: unknown): value is ContentLocale {
	return value === "pt" || value === "es";
}

export function parseContentLocale(value: unknown): ContentLocale {
	if (isContentLocale(value)) return value;
	throw new Error("Idioma inválido. Use pt ou es.");
}

export function contentLocaleLabel(locale: ContentLocale): string {
	return locale === "pt" ? "Português" : "Español";
}
