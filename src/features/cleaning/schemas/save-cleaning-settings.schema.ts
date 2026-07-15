import { z } from "zod";

export const CLEANING_TYPES = ["MEETING", "WEEKLY", "GENERAL"] as const;
export const CLEANING_ASSIGNMENT_MODES = ["GROUP", "FAMILY", "PERSON"] as const;
export const WEEKDAYS = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const;

const cleaningTypeSchema = z.enum(CLEANING_TYPES);
const cleaningAssignmentModeSchema = z.enum(CLEANING_ASSIGNMENT_MODES);
const weekdaySchema = z.enum(WEEKDAYS);

const sectorSchema = z.object({
	id: z.string().min(1).optional(),
	name: z.string().trim().min(1, "Informe o nome do setor."),
	description: z
		.string()
		.trim()
		.max(300, "A descrição deve ter no máximo 300 caracteres.")
		.optional()
		.or(z.literal("")),
	peopleRequired: z
		.number()
		.int("Informe um número inteiro.")
		.min(1, "Informe pelo menos 1 pessoa.")
		.max(50, "Informe no máximo 50 pessoas.")
		.nullable(),
	allowYoung: z.boolean(),
	sortOrder: z.number().int().min(0),
	isActive: z.boolean(),
});

const cleaningTypeConfigSchema = z.object({
	id: z.string().min(1).optional(),
	type: cleaningTypeSchema,
	enabled: z.boolean(),
	assignmentMode: cleaningAssignmentModeSchema.nullable(),
	notes: z
		.string()
		.trim()
		.max(500, "As observações devem ter no máximo 500 caracteres.")
		.optional()
		.or(z.literal("")),
	timesPerWeek: z
		.number()
		.int("Informe um número inteiro.")
		.min(1, "Informe no mínimo 1 vez por semana.")
		.max(7, "Informe no máximo 7 vezes por semana.")
		.nullable(),
	weekdays: z.array(weekdaySchema),
	dates: z.array(z.coerce.date()),
	sectors: z.array(sectorSchema),
});

export const saveCleaningSettingsSchema = z.object({
	organizationId: z.string().min(1, "Organização inválida."),
	settingsId: z.string().min(1).optional(),
	cleaningPerMeeting: z.boolean(),
	weeklyCleaning: z.boolean(),
	generalCleaning: z.boolean(),
	configs: z
		.array(cleaningTypeConfigSchema)
		.length(3)
		.refine((configs) => {
			const types = configs.map((item) => item.type).sort();
			return (
				JSON.stringify(types) ===
				JSON.stringify(["GENERAL", "MEETING", "WEEKLY"])
			);
		}, "Os três tipos de configuração são obrigatórios."),
});

export type SaveCleaningSettingsInput = z.infer<
	typeof saveCleaningSettingsSchema
>;
export type SaveCleaningSettingsConfigInput =
	SaveCleaningSettingsInput["configs"][number];
export type SaveCleaningSettingsSectorInput =
	SaveCleaningSettingsConfigInput["sectors"][number];
export type CleaningWeekday = z.infer<typeof weekdaySchema>;
export type CleaningType = z.infer<typeof cleaningTypeSchema>;
export type CleaningAssignmentMode = z.infer<
	typeof cleaningAssignmentModeSchema
>;
