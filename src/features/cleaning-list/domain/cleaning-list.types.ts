// src/features/cleaning-list/domain/cleaning-list.types.ts
import type {
	CleaningAssignmentListStatus,
	CleaningSectorTargetSex,
	CleaningType,
	Sex,
} from "@/generated/prisma/enums";

export type CleaningCandidatePerson = {
	id: string;
	name: string;
	sex: Sex;
	young: boolean;
	cleaning: boolean;
	isActive: boolean;
	isMarried: boolean;
	familyId: string | null;
	groupId: string | null;
	familyName: string | null;
	groupName: string | null;
};

export type CleaningSectorRule = {
	id: string;
	name: string;
	description: string | null;
	peopleRequired: number;
	allowYoung: boolean;
	targetSex: CleaningSectorTargetSex | null;
	sortOrder: number;
	isActive: boolean;
};

export type CleaningTypeConfigView = {
	id: string;
	type: CleaningType;
	enabled: boolean;
	assignmentMode: "GROUP" | "FAMILY" | "PERSON" | null;
	notes: string | null;
	weekdays: Array<{ id: string; weekday: string; sortOrder: number }>;
	dates: Array<{ id: string; date: Date; label: string | null }>;
	sectors: CleaningSectorRule[];
};

export type CleaningBookedDate = {
	date: Date;
	listId: string;
};

export type CleaningGeneratedAssignmentPerson = {
	personId: string;
	personName: string;
	familyId: string | null;
	familyName: string | null;
	groupId: string | null;
	groupName: string | null;
	position: number;
};

export type CleaningGeneratedAssignmentCell = {
	sectorId: string;
	sectorName: string;
	required: number;
	assigned: CleaningGeneratedAssignmentPerson[];
};

export type CleaningGeneratedAssignmentRow = {
	date: Date;
	cells: CleaningGeneratedAssignmentCell[];
};

export type CleaningGenerationResult = {
	cleaningType: CleaningType;
	periodFrom: Date;
	periodTo: Date;
	rows: CleaningGeneratedAssignmentRow[];
	warnings: string[];
};

export type CleaningSavedListSummary = {
	id: string;
	cleaningType: CleaningType;
	periodFrom: Date;
	periodTo: Date;
	status: CleaningAssignmentListStatus;
	createdAt: Date;
	canDelete: boolean;
	datesCount: number;
};

export type SaveCleaningListState = {
	success: boolean;
	message: string;
	errors: Record<string, string[] | undefined>;
};

export const initialSaveCleaningListState: SaveCleaningListState = {
	success: false,
	message: "",
	errors: {},
};

export type DeleteCleaningListState = {
	success: boolean;
	message: string;
};

export const initialDeleteCleaningListState: DeleteCleaningListState = {
	success: false,
	message: "",
};
