export const MEETING_CONTENT_SECTIONS = [
	{
		id: "apostila",
		href: "apostila",
		label: "Apostila",
		shortLabel: "Apostila",
		description: "Guia de atividades · reunião do meio de semana",
		title: "Apostila",
	},
	{
		id: "sentinela",
		href: "sentinela",
		label: "Sentinela",
		shortLabel: "Sentinela",
		description: "Estudos de A Sentinela · reunião de fim de semana",
		title: "A Sentinela",
	},
	{
		id: "canticos",
		href: "canticos",
		label: "Cânticos",
		shortLabel: "Cânticos",
		description: "Livro de cânticos · catálogo por idioma",
		title: "Cânticos",
	},
	{
		id: "discursos",
		href: "discursos",
		label: "Discursos",
		shortLabel: "Discursos",
		description: "Esboços de discursos públicos (S-34)",
		title: "Discursos públicos",
	},
] as const;

export type MeetingContentSectionId =
	(typeof MEETING_CONTENT_SECTIONS)[number]["id"];

export function meetingContentBasePath(slug: string): string {
	return `/org/${slug}/meeting-content`;
}

export function meetingContentSectionPath(
	slug: string,
	sectionHref: string,
): string {
	return `${meetingContentBasePath(slug)}/${sectionHref}`;
}

export function isMeetingContentSectionId(
	value: string,
): value is MeetingContentSectionId {
	return MEETING_CONTENT_SECTIONS.some((section) => section.id === value);
}
