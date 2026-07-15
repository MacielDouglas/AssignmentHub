import type {
	ScheduleMode,
	ScheduleType,
	ScheduleWeekday,
} from "../schemas/save-schedule-settings.schema";

export type WeeklyRuleFormState = {
	id?: string;
	weekday: ScheduleWeekday;
	time: string;
	sortOrder: number;
};

export type OccurrenceFormState = {
	id?: string;
	clientKey: string;
	type: ScheduleType;
	startDate: string;
	endDate: string;
	time: string;
	isAllDay: boolean;
	leaderPersonId: string;
	location: string;
	notes: string;
	sortOrder: number;
};

export type ScheduleItemFormState = {
	id?: string;
	clientKey: string;
	type: ScheduleType;
	mode: ScheduleMode;
	title: string;
	description: string;
	isActive: boolean;
	weeklyRules: WeeklyRuleFormState[];
	occurrences: OccurrenceFormState[];
};

export type ScheduleSettingsStateErrors = Record<string, string[]>;

export type SaveScheduleSettingsState = {
	success: boolean;
	message: string;
	errors: ScheduleSettingsStateErrors;
};

export const initialSaveScheduleSettingsState: SaveScheduleSettingsState = {
	success: false,
	message: "",
	errors: {},
};

export type ScheduleLeaderOption = {
	id: string;
	name: string;
};

export type ScheduleSettingsFormState = {
	organizationId: string;
	leaders: ScheduleLeaderOption[];
	items: ScheduleItemFormState[];
	defaults: ScheduleItemFormState[];
};
