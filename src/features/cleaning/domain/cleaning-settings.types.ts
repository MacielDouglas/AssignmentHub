import type {
	CleaningAssignmentMode,
	CleaningType,
	CleaningWeekday,
} from "../schemas/save-cleaning-settings.schema";

export type SectorItem = {
	id?: string;
	clientKey: string;
	name: string;
	description: string;
	peopleRequired: string;
	allowYoung: boolean;
	sortOrder: number;
	isActive: boolean;
	targetSex?: string;
};

export type TypeFormState = {
	id?: string;
	type: CleaningType;
	enabled: boolean;
	assignmentMode: CleaningAssignmentMode | null;
	notes: string;
	timesPerWeek: string;
	weekdays: CleaningWeekday[];
	dates: string[];
	sectors: SectorItem[];
};

export type CleaningSettingsFormConfigMap = Record<CleaningType, TypeFormState>;

export type CleaningSettingsStateErrors = Record<string, string[]>;

export type SaveCleaningSettingsState = {
	success: boolean;
	message: string;
	errors: CleaningSettingsStateErrors;
};

export const initialSaveCleaningSettingsState: SaveCleaningSettingsState = {
	success: false,
	message: "",
	errors: {},
};
