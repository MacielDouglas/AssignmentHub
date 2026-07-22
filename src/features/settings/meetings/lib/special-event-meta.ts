import type { OrganizationScheduleMode } from "@/generated/prisma/client";

export const SPECIAL_EVENT_TYPES = [
	"CELEBRATION",
	"TRAVELING_OVERSEER_VISIT",
	"SPECIAL_MEETING",
	"SPECIAL_TALK",
	"CONVENTION",
	"CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
	"CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
] as const;

export type SpecialEventType = (typeof SPECIAL_EVENT_TYPES)[number];

export type SpecialEventField =
	| "startDate"
	| "endDate"
	| "time"
	| "location"
	| "title"
	| "notes";

type Meta = {
	type: SpecialEventType;
	mode: OrganizationScheduleMode;
	/** no máx. 1 occurrence por ano civil */
	oncePerYear: boolean;
	allDay: boolean;
	fields: SpecialEventField[];
	titleLabel?: string;
};

export const SPECIAL_EVENT_META: Record<SpecialEventType, Meta> = {
	CELEBRATION: {
		type: "CELEBRATION",
		// label: "Comemoração",
		mode: "SINGLE_DATETIME",
		oncePerYear: true,
		allDay: false,
		fields: ["startDate", "time", "location", "notes"],
	},
	TRAVELING_OVERSEER_VISIT: {
		type: "TRAVELING_OVERSEER_VISIT",
		// label: "Visita do viajante",
		mode: "DATE_RANGE",
		oncePerYear: false,
		allDay: true,
		fields: ["startDate", "endDate", "title", "notes"],
		titleLabel: "Nome do viajante",
	},
	SPECIAL_MEETING: {
		type: "SPECIAL_MEETING",
		// label: "Reunião especial",
		mode: "SINGLE_DATETIME",
		oncePerYear: false,
		allDay: false,
		fields: ["startDate", "time", "notes"],
	},
	SPECIAL_TALK: {
		type: "SPECIAL_TALK",
		// label: "Discurso especial",
		mode: "SINGLE_DATETIME",
		oncePerYear: false,
		allDay: false,
		fields: ["startDate", "time", "notes"],
	},
	CONVENTION: {
		type: "CONVENTION",
		// label: "Congresso",
		mode: "DATE_RANGE",
		oncePerYear: true,
		allDay: true,
		fields: ["startDate", "endDate", "location", "notes"],
	},
	CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER: {
		type: "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
		// label: "Assembleia com viajante",
		mode: "SINGLE_DATETIME",
		oncePerYear: false,
		allDay: true,
		fields: ["startDate", "location", "notes"],
	},
	CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE: {
		type: "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
		// label: "Assembleia com representante",
		mode: "SINGLE_DATETIME",
		oncePerYear: false,
		allDay: true,
		fields: ["startDate", "location", "notes"],
	},
};

export function isSpecialEventType(value: string): value is SpecialEventType {
	return (SPECIAL_EVENT_TYPES as readonly string[]).includes(value);
}

export function defaultTitleForType(type: SpecialEventType): string {
	return type; // ou mantenha PT só como fallback de DB
}
