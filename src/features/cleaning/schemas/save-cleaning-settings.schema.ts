// src/features/cleaning/schemas/save-cleaning-settings.schema.ts
import { z } from "zod";

export const CLEANING_TYPES = ["MEETING", "WEEKLY", "GENERAL"] as const;
export const WEEKDAYS = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const;

export const MEETING_MODES = ["PERSON", "FAMILY", "GROUP"] as const;
export const WEEKLY_MODES = ["FAMILY", "GROUP"] as const;
export const GENERAL_MODES = ["GROUP"] as const;
export const TARGET_SEX = ["MALE", "FEMALE"] as const;

const uuidLike = z.string().trim().min(1).max(191);
const optionalUuid = z
	.string()
	.trim()
	.max(191)
	.optional()
	.transform((v) => (v && v.length > 0 ? v : undefined));

const text = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform((v) => v.replace(/[<>]/g, ""));

const optionalText = (max: number) =>
	text(max).transform((v) => (v.length ? v : null));

const dateOnly = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
	.refine((v) => !Number.isNaN(new Date(`${v}T00:00:00.000Z`).getTime()), {
		message: "Data inválida.",
	});

export const cleaningSectorSchema = z.object({
	id: optionalUuid,
	name: text(80).pipe(z.string().min(1, "Nome do setor é obrigatório.")),
	description: optionalText(500),
	peopleRequired: z.number().int().min(1).max(50).nullable(),
	allowYoung: z.boolean(),
	targetSex: z.enum(TARGET_SEX).nullable(),
	sortOrder: z.number().int().min(0).max(200),
	isActive: z.boolean(),
});

const baseConfig = z.object({
	id: optionalUuid,
	enabled: z.boolean(),
	notes: optionalText(1000),
	sectors: z.array(cleaningSectorSchema).max(40),
});

export const meetingConfigSchema = baseConfig.extend({
	type: z.literal("MEETING"),
	assignmentMode: z.enum(MEETING_MODES).nullable(),
	weekday: z.null(),
	dates: z.array(z.never()).max(0),
});

export const weeklyConfigSchema = baseConfig.extend({
	type: z.literal("WEEKLY"),
	assignmentMode: z.enum(WEEKLY_MODES).nullable(),
	weekday: z.enum(WEEKDAYS).nullable(),
	dates: z.array(z.never()).max(0),
});

export const generalConfigSchema = baseConfig.extend({
	type: z.literal("GENERAL"),
	assignmentMode: z.enum(GENERAL_MODES).nullable(),
	weekday: z.null(),
	dates: z.array(dateOnly).max(60),
});

export const saveCleaningSettingsSchema = z
	.object({
		organizationId: uuidLike,
		meeting: meetingConfigSchema,
		weekly: weeklyConfigSchema,
		general: generalConfigSchema,
	})
	.superRefine((data, ctx) => {
		validateConfig(data.meeting, ctx, "meeting");
		validateConfig(data.weekly, ctx, "weekly");
		validateConfig(data.general, ctx, "general");
	});

function validateConfig(
	config:
		| z.infer<typeof meetingConfigSchema>
		| z.infer<typeof weeklyConfigSchema>
		| z.infer<typeof generalConfigSchema>,
	ctx: z.RefinementCtx,
	path: "meeting" | "weekly" | "general",
) {
	if (!config.enabled) return;

	if (!config.assignmentMode) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: [path, "assignmentMode"],
			message: "Selecione o modo de designação.",
		});
	}

	if (config.sectors.filter((s) => s.isActive).length === 0) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: [path, "sectors"],
			message: "Adicione ao menos um setor ativo.",
		});
	}

	const names = new Set<string>();
	for (const [index, sector] of config.sectors.entries()) {
		const key = sector.name.trim().toLocaleLowerCase("pt-BR");
		if (names.has(key)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: [path, "sectors", index, "name"],
				message: "Nome de setor duplicado neste tipo.",
			});
		}
		names.add(key);

		const isBathroom = isBathroomSectorName(sector.name);
		if (!isBathroom && sector.targetSex) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: [path, "sectors", index, "targetSex"],
				message: "Sexo alvo só é permitido no setor Banheiro.",
			});
		}

		if (config.type === "MEETING") {
			if (config.assignmentMode === "PERSON") {
				if (!sector.peopleRequired || sector.peopleRequired < 1) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: [path, "sectors", index, "peopleRequired"],
						message: "Informe pessoas necessárias (mín. 1).",
					});
				}
			} else {
				// FAMILY / GROUP: sem peopleRequired no form
				if (sector.peopleRequired != null) {
					// normalizamos no parse; se vier algo, ok ignorar
				}
			}
		}

		if (config.type === "WEEKLY" || config.type === "GENERAL") {
			if (!sector.peopleRequired || sector.peopleRequired < 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: [path, "sectors", index, "peopleRequired"],
					message: "Informe pessoas necessárias (mín. 1).",
				});
			}
		}
	}

	if (
		config.type === "GENERAL" &&
		config.enabled &&
		config.dates.length === 0
	) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: [path, "dates"],
			message: "Informe ao menos uma data para limpeza geral.",
		});
	}

	if (config.type === "GENERAL") {
		const unique = new Set(config.dates);
		if (unique.size !== config.dates.length) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: [path, "dates"],
				message: "Existem datas duplicadas.",
			});
		}
	}
}

export function isBathroomSectorName(name: string) {
	const n = name
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLocaleLowerCase("pt-BR")
		.trim();
	return n === "banheiro" || n.startsWith("banheiro ");
}

export type SaveCleaningSettingsInput = z.infer<
	typeof saveCleaningSettingsSchema
>;
