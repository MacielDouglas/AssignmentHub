// src/features/cleaning/domain/cleaning-settings.types.ts
import type {
	CleaningAssignmentMode,
	CleaningSectorTargetSex,
	CleaningType,
	Weekday,
} from "@/generated/prisma/enums";

export type CleaningSectorFormState = {
	id?: string;
	clientKey: string;
	name: string;
	description: string;
	peopleRequired: number;
	allowYoung: boolean;
	targetSex: CleaningSectorTargetSex | "";
	sortOrder: number;
	isActive: boolean;
	locked: boolean; // true = tem designação em data passada
};

export type CleaningTypeConfigFormState = {
	id?: string;
	type: CleaningType;
	enabled: boolean;
	assignmentMode: CleaningAssignmentMode | "";
	notes: string;
	weekday: Weekday | ""; // WEEKLY: 0 ou 1
	dates: string[]; // GENERAL: yyyy-mm-dd
	sectors: CleaningSectorFormState[];
};

export type CleaningSettingsFormState = {
	organizationId: string;
	settingsId: string | null;
	canManage: boolean;
	organizationName: string;
	organizationSlug: string;
	meeting: CleaningTypeConfigFormState;
	weekly: CleaningTypeConfigFormState;
	general: CleaningTypeConfigFormState;
};

export type SaveCleaningSettingsState = {
	success: boolean;
	message: string;
	errors: Record<string, string[] | undefined>;
};

export const initialSaveCleaningSettingsState: SaveCleaningSettingsState = {
	success: false,
	message: "",
	errors: {},
};
