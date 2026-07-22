import { type AppLocale, defaultLocale, isAppLocale } from "@/i18n/config";

/**
 * Ordem: cookie → Accept-Language → default (pt).
 * en e qualquer outro idioma caem em pt.
 */
export function resolveLocaleFromHeaders(
	cookieValue: string | undefined,
	acceptLanguage: string | null,
): AppLocale {
	if (isAppLocale(cookieValue)) {
		return cookieValue;
	}

	if (!acceptLanguage) {
		return defaultLocale;
	}

	// Ex.: "es-ES,es;q=0.9,en;q=0.8"
	const candidates = acceptLanguage
		.split(",")
		.map((part) => {
			const [tag, qPart] = part.trim().split(";");
			const q = qPart?.startsWith("q=") ? Number.parseFloat(qPart.slice(2)) : 1;
			return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 1 };
		})
		.sort((a, b) => b.q - a.q);

	for (const { tag } of candidates) {
		if (tag === "pt" || tag.startsWith("pt-")) return "pt";
		if (tag === "es" || tag.startsWith("es-")) return "es";
	}

	return defaultLocale;
}
