import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";

export type VisualSection = {
	label: string | null;
	displayLabel?: string;
	color?: string;
	parts: MeetingPartDto[];
};

export type MidweekSectionDef = {
	label: string;
	displayLabel?: string;
	color?: string;
	partKinds: string[];
};

export const MIDWEEK_SECTION_DEFINITIONS: MidweekSectionDef[] = [
	{
		label: "Introdução",
		partKinds: [
			"MIDWEEK_CHAIRMAN",
			"MIDWEEK_OPENING_SONG",
			"MIDWEEK_INTRODUCTION",
		],
	},
	{
		label: "Tesouros Espirituais",
		displayLabel: "TESOUROS DA PALAVRA DE DEUS",
		partKinds: [
			"MIDWEEK_TREASURES_TALK",
			"MIDWEEK_SPIRITUAL_GEMS",
			"MIDWEEK_BIBLE_READING",
		],
	},
	{
		label: "Ministério",
		displayLabel: "FAÇA SEU MELHOR NO MINISTÉRIO",
		color: "#d68f00",
		partKinds: [
			"MIDWEEK_MINISTRY_INITIATING_CONVERSATION",
			"MIDWEEK_MINISTRY_CULTIVATING_INTEREST",
			"MIDWEEK_MINISTRY_MAKING_DISCIPLES",
			"MIDWEEK_MINISTRY_EXPLAINING_BELIEFS",
			"MIDWEEK_MINISTRY_TALK",
		],
	},
	{
		label: "Vida Cristã",
		displayLabel: "NOSSA VIDA CRISTÃ",
		color: "#bf2f13",
		partKinds: [
			"MIDWEEK_MIDDLE_SONG",
			"MIDWEEK_LIVING_PART",
			"MIDWEEK_ORGANIZATION_ACCOMPLISHMENTS",
			"MIDWEEK_BIBLE_STUDY",
			"MIDWEEK_SERVICE_TALK",
		],
	},
	{
		label: "Conclusão",
		partKinds: ["MIDWEEK_CONCLUSION", "MIDWEEK_CLOSING_SONG_AND_PRAYER"],
	},
];
