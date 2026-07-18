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

export const SCHEDULE_VARIANTS = ["DEFAULT", "NEXT_YEAR"] as const;

export const weekdaySchema = z.enum(WEEKDAYS);
export const organizationScheduleTypeSchema = z.enum(
	ORGANIZATION_SCHEDULE_TYPES,
);
export const organizationScheduleModeSchema = z.enum(
	ORGANIZATION_SCHEDULE_MODES,
);
export const scheduleVariantSchema = z.enum(SCHEDULE_VARIANTS);

const timeSchema = z
	.string()
	.trim()
	.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido.");

const optionalText = (max: number) =>
	z
		.union([z.string().trim().max(max), z.null()])
		.transform((value) => {
			if (value === null) return null;
			const trimmed = value.trim();
			return trimmed.length > 0 ? trimmed : null;
		});

export const weeklyRuleSchema = z.object({
	id: z.string().trim().min(1).optional().nullable(),
	weekday: weekdaySchema,
	time: timeSchema,
	sortOrder: z.number().int().min(0),
});

export const occurrenceSchema = z.object({
	id: z.string().trim().min(1).optional().nullable(),
	startDate: z
		.union([z.literal(""), z.coerce.date(), z.null()])
		.transform((value) => {
			if (value === "" || value === null) return null;
			return value;
		}),
	endDate: z
		.union([z.literal(""), z.coerce.date(), z.null()])
		.transform((value) => {
			if (value === "" || value === null) return null;
			return value;
		}),
	time: z.union([timeSchema, z.literal(""), z.null()]).transform((value) => {
		if (!value) return null;
		return value;
	}),
	isAllDay: z.boolean(),
	leaderPersonId: z
		.union([z.string().trim().max(191), z.literal(""), z.null()])
		.transform((value) => {
			if (value === null || value === "") return null;
			return value;
		}),
	location: optionalText(200),
	notes: optionalText(1000),
	sortOrder: z.number().int().min(0),
});

export const scheduleItemSchema = z.object({
	id: z.string().trim().min(1).optional().nullable(),
	type: organizationScheduleTypeSchema,
	variant: scheduleVariantSchema.default("DEFAULT"),
	effectiveFromYear: z
		.number()
		.int()
		.min(2000)
		.max(2100)
		.nullable()
		.default(null),
	mode: organizationScheduleModeSchema,
	title: z.string().trim().min(1).max(120),
	description: z.string().trim().max(500).nullable(),
	isActive: z.boolean(),
	weeklyRules: z.array(weeklyRuleSchema),
	occurrences: z.array(occurrenceSchema),
});

export const saveScheduleSettingsSchema = z.object({
	organizationId: z.string().trim().min(1).max(191),
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
export type ScheduleVariant = z.infer<typeof scheduleVariantSchema>;
