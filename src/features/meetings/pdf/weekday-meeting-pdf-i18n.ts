import type {
	PdfLocale,
	WeekdayMeetingPdfAssigneeRole,
	WeekdayMeetingPdfSectionKey,
} from "./weekday-meeting-pdf-types";

export type WeekdayMeetingPdfLabels = {
	documentTitle: string;
	bibleTreasures: string;
	applyYourself: string;
	christianLife: string;
	song: string;
	prayer: string;
	openingComments: string;
	concludingComments: string;
	congregationBibleStudy: string;
	conductor: string;
	reader: string;
	chairman: string;
	assistant: string;
};

const TRANSLATIONS: Record<PdfLocale, WeekdayMeetingPdfLabels> = {
	"pt-BR": {
		documentTitle: "REUNIÃO DE MEIO DE SEMANA",
		bibleTreasures: "TESOUROS DA BÍBLIA",
		applyYourself: "SEJA MELHOR INSTRUTOR",
		christianLife: "NOSSA VIDA CRISTÃ",
		song: "Cântico",
		prayer: "Oração",
		openingComments: "Palavras de introdução",
		concludingComments: "Palavras de conclusão",
		congregationBibleStudy: "Estudo bíblico de congregação",
		conductor: "Condutor",
		reader: "Leitor",
		chairman: "Presidente",
		assistant: "Ajudante",
	},
	es: {
		documentTitle: "REUNIÓN DE ENTRE SEMANA",
		bibleTreasures: "TESOROS DE LA BIBLIA",
		applyYourself: "SEAMOS MEJORES MAESTROS",
		christianLife: "NUESTRA VIDA CRISTIANA",
		song: "Canción",
		prayer: "Oración",
		openingComments: "Palabras de introducción",
		concludingComments: "Palabras de conclusión",
		congregationBibleStudy: "Estudio bíblico de la congregación",
		conductor: "Conductor",
		reader: "Lector",
		chairman: "Presidente",
		assistant: "Ayudante",
	},
	en: {
		documentTitle: "MIDWEEK MEETING",
		bibleTreasures: "TREASURES FROM GOD'S WORD",
		applyYourself: "APPLY YOURSELF TO THE FIELD MINISTRY",
		christianLife: "LIVING AS CHRISTIANS",
		song: "Song",
		prayer: "Prayer",
		openingComments: "Opening comments",
		concludingComments: "Concluding comments",
		congregationBibleStudy: "Congregation Bible Study",
		conductor: "Conductor",
		reader: "Reader",
		chairman: "Chairman",
		assistant: "Assistant",
	},
};

const FILE_PREFIXES: Record<
	PdfLocale,
	{
		single: string;
		plural: string;
	}
> = {
	"pt-BR": {
		single: "reuniao-meio-de-semana",
		plural: "reunioes-meio-de-semana",
	},
	es: {
		single: "reunion-entre-semana",
		plural: "reuniones-entre-semana",
	},
	en: {
		single: "midweek-meeting",
		plural: "midweek-meetings",
	},
};

export type WeekdayMeetingPdfI18n = {
	labels: WeekdayMeetingPdfLabels;
	filePrefixSingle: string;
	filePrefixPlural: string;
	locale: PdfLocale;
};

export function getPdfI18n(locale: PdfLocale): WeekdayMeetingPdfI18n {
	const safeLocale = TRANSLATIONS[locale] ? locale : "pt-BR";

	return {
		locale: safeLocale,
		labels: TRANSLATIONS[safeLocale],
		filePrefixSingle: FILE_PREFIXES[safeLocale].single,
		filePrefixPlural: FILE_PREFIXES[safeLocale].plural,
	};
}

export function mapAppLocaleToPdfLocale(appLocale: string): PdfLocale {
	if (appLocale === "es" || appLocale.startsWith("es-")) {
		return "es";
	}

	if (appLocale === "en" || appLocale.startsWith("en-")) {
		return "en";
	}

	return "pt-BR";
}

export const PDF_LOCALE_OPTIONS = [
	{ value: "pt-BR" as const, label: "Português (Brasil)" },
	{ value: "es" as const, label: "Español" },
	{ value: "en" as const, label: "English" },
] as const;

export function formatMeetingDate(
	dateString: string,
	locale: PdfLocale,
): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);

	if (!match) {
		return dateString;
	}

	const [, yearString, monthString, dayString] = match;
	const year = Number(yearString);
	const month = Number(monthString);
	const day = Number(dayString);
	const yearShort = String(year).slice(-2);

	switch (locale) {
		case "es":
			return `${day}/${month}/${yearShort}`;
		case "en":
			return `${month}/${day}/${yearShort}`;
		default:
			return `${String(day).padStart(2, "0")}/${String(month).padStart(
				2,
				"0",
			)}/${year}`;
	}
}

export function getSectionLabel(
	labels: WeekdayMeetingPdfLabels,
	section: WeekdayMeetingPdfSectionKey,
): string {
	switch (section) {
		case "bibleTreasures":
			return labels.bibleTreasures;
		case "applyYourself":
			return labels.applyYourself;
		case "christianLife":
			return labels.christianLife;
	}
}

export function getRoleLabel(
	labels: WeekdayMeetingPdfLabels,
	role: WeekdayMeetingPdfAssigneeRole | undefined,
): string | undefined {
	switch (role) {
		case "chairman":
			return labels.chairman;
		case "conductor":
			return labels.conductor;
		case "reader":
			return labels.reader;
		case "assistant":
			return labels.assistant;
		case "prayer":
			return labels.prayer;
		default:
			return undefined;
	}
}
