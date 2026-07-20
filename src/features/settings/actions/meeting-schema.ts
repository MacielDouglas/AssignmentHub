import { z } from "zod";
import { SPECIAL_EVENT_TYPES } from "@/features/settings/lib/special-event-meta";

const weekdays = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
] as const;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// const slotSchema = z.object({
// 	weekday: z.enum(weekdays),
// 	time: z.string().regex(timeRegex, "Hora inválida (use HH:mm)."),
// });

export const saveWeeklyMeetingsSchema = z
	.object({
		organizationSlug: z.string().trim().min(1),
		// ano atual — exatamente 2
		currentSlot1Weekday: z.enum(weekdays),
		currentSlot1Time: z.string().regex(timeRegex),
		currentSlot2Weekday: z.enum(weekdays),
		currentSlot2Time: z.string().regex(timeRegex),
		// próximo ano opcional — se um campo vier, todos obrigatórios
		nextEnabled: z.enum(["true", "false"]).default("false"),
		nextSlot1Weekday: z.enum(weekdays).optional().or(z.literal("")),
		nextSlot1Time: z.string().optional(),
		nextSlot2Weekday: z.enum(weekdays).optional().or(z.literal("")),
		nextSlot2Time: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.currentSlot1Weekday === data.currentSlot2Weekday) {
			ctx.addIssue({
				code: "custom",
				path: ["currentSlot2Weekday"],
				message: "Os dois dias da semana devem ser diferentes.",
			});
		}

		if (data.nextEnabled === "true") {
			const fields = [
				["nextSlot1Weekday", data.nextSlot1Weekday],
				["nextSlot1Time", data.nextSlot1Time],
				["nextSlot2Weekday", data.nextSlot2Weekday],
				["nextSlot2Time", data.nextSlot2Time],
			] as const;

			for (const [path, value] of fields) {
				if (!value) {
					ctx.addIssue({
						code: "custom",
						path: [path],
						message: "Preencha os dois horários do próximo ano.",
					});
				}
			}

			if (data.nextSlot1Time && !timeRegex.test(data.nextSlot1Time)) {
				ctx.addIssue({
					code: "custom",
					path: ["nextSlot1Time"],
					message: "Hora inválida (use HH:mm).",
				});
			}
			if (data.nextSlot2Time && !timeRegex.test(data.nextSlot2Time)) {
				ctx.addIssue({
					code: "custom",
					path: ["nextSlot2Time"],
					message: "Hora inválida (use HH:mm).",
				});
			}

			if (
				data.nextSlot1Weekday &&
				data.nextSlot2Weekday &&
				data.nextSlot1Weekday === data.nextSlot2Weekday
			) {
				ctx.addIssue({
					code: "custom",
					path: ["nextSlot2Weekday"],
					message: "Os dois dias da semana devem ser diferentes.",
				});
			}
		}
	});

export const clearNextYearSchema = z.object({
	organizationSlug: z.string().trim().min(1),
});

export const upsertSpecialEventSchema = z.object({
	organizationSlug: z.string().trim().min(1),
	type: z.enum(SPECIAL_EVENT_TYPES),
	occurrenceId: z.string().uuid().optional().or(z.literal("")),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional()
		.or(z.literal("")),
	time: z.string().regex(timeRegex).optional().or(z.literal("")),
	location: z.string().trim().max(200).optional().or(z.literal("")),
	title: z.string().trim().max(200).optional().or(z.literal("")),
	notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const deleteSpecialOccurrenceSchema = z.object({
	organizationSlug: z.string().trim().min(1),
	occurrenceId: z.string().uuid(),
});

export function parseSaveWeeklyMeetings(formData: FormData) {
	return saveWeeklyMeetingsSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		currentSlot1Weekday: String(formData.get("currentSlot1Weekday") ?? ""),
		currentSlot1Time: String(formData.get("currentSlot1Time") ?? ""),
		currentSlot2Weekday: String(formData.get("currentSlot2Weekday") ?? ""),
		currentSlot2Time: String(formData.get("currentSlot2Time") ?? ""),
		nextEnabled: String(formData.get("nextEnabled") ?? "false"),
		nextSlot1Weekday: String(formData.get("nextSlot1Weekday") ?? ""),
		nextSlot1Time: String(formData.get("nextSlot1Time") ?? ""),
		nextSlot2Weekday: String(formData.get("nextSlot2Weekday") ?? ""),
		nextSlot2Time: String(formData.get("nextSlot2Time") ?? ""),
	});
}

export function parseClearNextYear(formData: FormData) {
	return clearNextYearSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
	});
}

export function parseUpsertSpecialEvent(formData: FormData) {
	return upsertSpecialEventSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		type: String(formData.get("type") ?? ""),
		occurrenceId: String(formData.get("occurrenceId") ?? ""),
		startDate: String(formData.get("startDate") ?? ""),
		endDate: String(formData.get("endDate") ?? ""),
		time: String(formData.get("time") ?? ""),
		location: String(formData.get("location") ?? ""),
		title: String(formData.get("title") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
}

export function parseDeleteSpecialOccurrence(formData: FormData) {
	return deleteSpecialOccurrenceSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		occurrenceId: String(formData.get("occurrenceId") ?? ""),
	});
}
