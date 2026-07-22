import type { CleaningType, Sex } from "@/generated/prisma/client";

export type EligiblePerson = {
	id: string;
	name: string;
	sex: Sex;
	young: boolean;
	familyId: string | null;
	groupId: string | null;
	spouseId: string | null;
};

export type RosterSector = {
	id: string;
	name: string;
	description: string | null;
	peopleRequired: number;
	allowYoung: boolean;
	targetSex: "MALE" | "FEMALE" | null;
	sortOrder: number;
};

export type RosterSlot = {
	key: string;
	sectorId: string;
	personId: string;
	familyId: string | null;
	groupId: string | null;
	position: number;
	isManual: boolean;
};

export type RosterDay = {
	date: string;
	label?: string | null;
	slots: RosterSlot[];
	hiddenSectorIds: string[];
};

export type RosterDraft = {
	cleaningType: CleaningType;
	periodFrom: string;
	periodTo: string;
	keepFamilyTogether: boolean;
	days: RosterDay[];
	sectors: RosterSector[];
	people: EligiblePerson[];
	listId?: string | null;
};

export type GenerateRosterInput = {
	cleaningType: CleaningType;
	periodFrom: string;
	periodTo: string;
	keepFamilyTogether: boolean;
	selectedGeneralDates?: string[];
	sectors: RosterSector[];
	people: EligiblePerson[];
	sessionDates: Array<{ date: string; label?: string | null }>;
	history: FairnessHistory;
};

export type FairnessHistory = {
	totalByPerson: Record<string, number>;
	sectorByPerson: Record<string, Record<string, number>>;
	datesByPerson: Record<string, string[]>;
};
