import { z } from "zod";

export const WEEKDAYS = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const;

export const ORGANIZATION_SCHEDULE_TYPES = [
	"MEETINGS",
	"SPECIAL_MEETING",
	"TRAVELING_OVERSEER_VISIT",
	"CELEBRATION",
	"SPECIAL_TALK",
	"CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
	"CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
	"FIELD_SERVICE_MEETING",
	"CONVENTION",
	"WEEKLY_CLEANING",
	"GENERAL_CLEANING",
] as const;

export const ORGANIZATION_SCHEDULE_MODES = [
	"WEEKLY_RECURRING",
	"SINGLE_DATETIME",
	"MULTIPLE_DATES",
	"DATE_RANGE",
	"MULTIPLE_DATETIME",
] as const;

export const weekdaySchema = z.enum(WEEKDAYS);
export const organizationScheduleTypeSchema = z.enum(
	ORGANIZATION_SCHEDULE_TYPES,
);
export const organizationScheduleModeSchema = z.enum(
	ORGANIZATION_SCHEDULE_MODES,
);

export const weeklyRuleSchema = z.object({
	id: z.string().optional(),
	weekday: weekdaySchema,
	time: z.string().trim().min(1).max(10),
	sortOrder: z.number().int().min(0),
});

export const occurrenceSchema = z.object({
	id: z.string().optional(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date().nullable(),
	time: z.string().trim().max(10).nullable(),
	isAllDay: z.boolean(),
	leaderPersonId: z.string().trim().min(1).nullable(),
	location: z.string().trim().max(200).nullable(),
	notes: z.string().trim().max(1000).nullable(),
	sortOrder: z.number().int().min(0),
});

export const scheduleItemSchema = z.object({
	id: z.string().optional(),
	type: organizationScheduleTypeSchema,
	mode: organizationScheduleModeSchema,
	title: z.string().trim().min(1).max(120),
	description: z.string().trim().max(500).nullable(),
	isActive: z.boolean(),
	weeklyRules: z.array(weeklyRuleSchema),
	occurrences: z.array(occurrenceSchema),
});

export const saveScheduleSettingsSchema = z.object({
	organizationId: z.string().min(1),
	items: z.array(scheduleItemSchema),
});

export type SaveScheduleSettingsInput = z.infer<
	typeof saveScheduleSettingsSchema
>;
export type ScheduleItemInput = SaveScheduleSettingsInput["items"][number];
export type ScheduleOccurrenceInput = ScheduleItemInput["occurrences"][number];
export type ScheduleWeeklyRuleInput = ScheduleItemInput["weeklyRules"][number];
export type ScheduleType = z.infer<typeof organizationScheduleTypeSchema>;
export type ScheduleMode = z.infer<typeof organizationScheduleModeSchema>;
export type ScheduleWeekday = z.infer<typeof weekdaySchema>;
