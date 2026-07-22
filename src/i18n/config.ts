export const locales = ["pt", "es"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "pt";

/** Cookie lido/escrito pela app (sem prefixo na URL). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<AppLocale, string> = {
	pt: "Português",
	es: "Español",
};

export function isAppLocale(value: unknown): value is AppLocale {
	return value === "pt" || value === "es";
}
