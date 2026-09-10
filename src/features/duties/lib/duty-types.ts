import type {
	MeetingDutySector,
	MeetingDutySide,
} from "@/generated/prisma/client";

export const DUTY_SECTORS = [
	"indicator",
	"mic",
	"sound",
	"video",
	"stage",
] as const;

export type DutySectorKey = (typeof DUTY_SECTORS)[number];

export type DutyMeetingKind = "MIDWEEK" | "WEEKEND";

export type DutyKeyRole =
	| "chairman"
	| "bibleConductor"
	| "bibleReader"
	| "watchtowerConductor"
	| "watchtowerReader";

export type DutyConflictRole = DutyKeyRole | "spiritualGems";

export type DutyKeyPerson = {
	role: DutyKeyRole;
	name: string;
};

export type DutyPersonConflict = {
	personId: string;
	role: DutyConflictRole;
};

export type DutySideKey = "externo" | "interno";

export type DutySlotDraft = {
	key: string;
	sector: DutySectorKey;
	postLabel: string;
	side: DutySideKey | null;
	position: number;
	personId: string | null;
	personName: string;
	isManual: boolean;
};

export type DutyMeetingDraft = {
	date: string;
	kind: DutyMeetingKind;
	excludedAll: string[];
	excludedMic: string[];
	keyPeople: DutyKeyPerson[];
	conflictRoles: DutyPersonConflict[];
	slots: DutySlotDraft[];
};

export type DutyPerson = {
	id: string;
	name: string;
	indicator: boolean;
	mic: boolean;
	sound: boolean;
	video: boolean;
	stage: boolean;
};

export type DutyRosterDraft = {
	periodFrom: string;
	periodTo: string;
	listId?: string;
	meetings: DutyMeetingDraft[];
	people: DutyPerson[];
};

const SECTOR_TO_DB: Record<DutySectorKey, MeetingDutySector> = {
	indicator: "INDICATOR",
	mic: "MIC",
	sound: "SOUND",
	video: "VIDEO",
	stage: "STAGE",
};

const SECTOR_FROM_DB: Record<string, DutySectorKey> = {
	INDICATOR: "indicator",
	MIC: "mic",
	SOUND: "sound",
	VIDEO: "video",
	STAGE: "stage",
};

export function toDbSector(sector: DutySectorKey): MeetingDutySector {
	return SECTOR_TO_DB[sector];
}

export function fromDbSector(sector: string): DutySectorKey {
	return SECTOR_FROM_DB[sector] ?? "indicator";
}

const SIDE_TO_DB: Record<DutySideKey, MeetingDutySide> = {
	externo: "EXTERNO",
	interno: "INTERNO",
};

export function toDbSide(side: DutySideKey | null): MeetingDutySide | null {
	return side ? SIDE_TO_DB[side] : null;
}

export function fromDbSide(side: string | null): DutySideKey | null {
	if (side === "EXTERNO") {
		return "externo";
	}

	if (side === "INTERNO") {
		return "interno";
	}

	return null;
}
