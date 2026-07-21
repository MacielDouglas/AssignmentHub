import { z } from "zod";

const cleaningType = z.enum(["MEETING", "WEEKLY", "GENERAL"]);
const assignmentMode = z.enum(["PERSON", "FAMILY", "GROUP"]);
const weekday = z.enum([
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
]);
const targetSex = z.enum(["MALE", "FEMALE", "ANY"]);

export const saveCleaningTypeSchema = z
	.object({
		organizationSlug: z.string().min(1),
		type: cleaningType,
		enabled: z.enum(["true", "false"]),
		assignmentMode: assignmentMode,
		followVisit: z.enum(["true", "false"]).optional(),
		// weekdays: repeated form fields
		weekdays: z.array(weekday).default([]),
		timesPerWeek: z.coerce.number().int().min(1).max(7).optional().nullable(),
		// dates: "yyyy-mm-dd|label" lines or parallel fields — usamos JSON string
		datesJson: z.string().optional().default("[]"),
	})
	.superRefine((data, ctx) => {
		if (data.type === "MEETING") {
			// ok
		}
		if (data.type === "WEEKLY" || data.type === "GENERAL") {
			if (data.assignmentMode === "PERSON") {
				ctx.addIssue({
					code: "custom",
					path: ["assignmentMode"],
					message: "Este tipo não permite designação por pessoa.",
				});
			}
		}
		if (
			data.type === "WEEKLY" &&
			data.enabled === "true" &&
			data.weekdays.length === 0
		) {
			ctx.addIssue({
				code: "custom",
				path: ["weekdays"],
				message: "Selecione ao menos um dia da semana.",
			});
		}
	});

export const restoreDefaultsSchema = z.object({
	organizationSlug: z.string().min(1),
	type: cleaningType,
});

export const upsertSectorSchema = z.object({
	organizationSlug: z.string().min(1),
	type: cleaningType,
	sectorId: z.string().uuid().optional().or(z.literal("")),
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(4000).optional().or(z.literal("")),
	peopleRequired: z.coerce.number().int().min(1).max(50).optional().nullable(),
	allowYoung: z.enum(["true", "false"]).default("true"),
	targetSex: targetSex.default("ANY"),
	isActive: z.enum(["true", "false"]).default("true"),
});

export const deleteSectorSchema = z.object({
	organizationSlug: z.string().min(1),
	sectorId: z.string().uuid(),
	mode: z.enum(["soft", "hard"]).default("soft"),
});

export function parseSaveCleaningType(formData: FormData) {
	const weekdays = formData.getAll("weekdays").map(String).filter(Boolean);

	return saveCleaningTypeSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		type: String(formData.get("type") ?? ""),
		enabled: String(formData.get("enabled") ?? "false"),
		assignmentMode: String(formData.get("assignmentMode") ?? ""),
		followVisit: String(formData.get("followVisit") ?? "true"),
		weekdays,
		timesPerWeek: formData.get("timesPerWeek")
			? Number(formData.get("timesPerWeek"))
			: null,
		datesJson: String(formData.get("datesJson") ?? "[]"),
	});
}

export function parseRestoreDefaults(formData: FormData) {
	return restoreDefaultsSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		type: String(formData.get("type") ?? ""),
	});
}

export function parseUpsertSector(formData: FormData) {
	return upsertSectorSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		type: String(formData.get("type") ?? ""),
		sectorId: String(formData.get("sectorId") ?? ""),
		name: String(formData.get("name") ?? ""),
		description: String(formData.get("description") ?? ""),
		peopleRequired: formData.get("peopleRequired")
			? Number(formData.get("peopleRequired"))
			: null,
		allowYoung: String(formData.get("allowYoung") ?? "true"),
		targetSex: String(formData.get("targetSex") ?? "ANY"),
		isActive: String(formData.get("isActive") ?? "true"),
	});
}

export function parseDeleteSector(formData: FormData) {
	return deleteSectorSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		sectorId: String(formData.get("sectorId") ?? ""),
		mode: String(formData.get("mode") ?? "soft"),
	});
}
