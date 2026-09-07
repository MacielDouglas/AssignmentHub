import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const uuid = z.string().uuid();

const orgSlug = z.string().trim().min(1);
const notes = z.string().trim().max(2000).optional().or(z.literal(""));
const locationOptional = z
	.string()
	.trim()
	.max(200)
	.optional()
	.or(z.literal(""));
const locationRequired = z.string().trim().min(1).max(200);

/** Comemoração: 1x/ano. Dia + hora obrigatórios. Local + obs opcionais. */
export const celebrationSchema = z.object({
	organizationSlug: orgSlug,
	id: uuid.optional().or(z.literal("")),
	date: z.string().regex(dateRegex, "Data inválida."),
	time: z.string().regex(timeRegex, "Hora inválida (use HH:mm)."),
	location: locationOptional,
	notes,
});

/** Visita do Superintendente de Circuito: nome + início/fim obrigatórios. */
export const circuitOverseerVisitSchema = z.object({
	organizationSlug: orgSlug,
	id: uuid.optional().or(z.literal("")),
	travelerName: z.string().trim().min(1).max(200),
	startDate: z.string().regex(dateRegex, "Data inicial inválida."),
	endDate: z.string().regex(dateRegex, "Data final inválida."),
	notes,
});

/** Reunião especial: data obrigatória. Hora e obs opcionais (sem "dia inteiro"). */
export const specialMeetingSchema = z.object({
	organizationSlug: orgSlug,
	id: uuid.optional().or(z.literal("")),
	date: z.string().regex(dateRegex, "Data inválida."),
	time: z.string().regex(timeRegex).optional().or(z.literal("")),
	notes,
});

/** Discurso especial: data obrigatória. Tema + orador opcionais (FK + texto livre). */
export const specialTalkSchema = z.object({
	organizationSlug: orgSlug,
	id: uuid.optional().or(z.literal("")),
	date: z.string().regex(dateRegex, "Data inválida."),
	theme: z.string().trim().max(200).optional().or(z.literal("")),
	speakerPersonId: uuid.optional().or(z.literal("")),
	speakerName: z.string().trim().max(200).optional().or(z.literal("")),
	notes,
});

/** Congresso: 1x/ano. Início/fim + local obrigatórios. Obs opcional. */
export const conventionSchema = z.object({
	organizationSlug: orgSlug,
	id: uuid.optional().or(z.literal("")),
	startDate: z.string().regex(dateRegex, "Data inicial inválida."),
	endDate: z.string().regex(dateRegex, "Data final inválida."),
	location: locationRequired,
	notes,
});

/** Assembleia com Viajante (label mantido): data + local obrigatórios. */
export const circuitAssemblyOverseerSchema = z.object({
	organizationSlug: orgSlug,
	id: uuid.optional().or(z.literal("")),
	date: z.string().regex(dateRegex, "Data inválida."),
	location: locationRequired,
	notes,
});

/** Assembleia com Representante: data + local obrigatórios. */
export const circuitAssemblyBranchRepSchema = z.object({
	organizationSlug: orgSlug,
	id: uuid.optional().or(z.literal("")),
	date: z.string().regex(dateRegex, "Data inválida."),
	location: locationRequired,
	notes,
});

/** Reunião semanal explícita meio x fim (substitui slot1/slot2 genéricos). */
export const weeklyMeetingsExplicitSchema = z
	.object({
		organizationSlug: orgSlug,
		midweekWeekday: z.enum([
			"MONDAY",
			"TUESDAY",
			"WEDNESDAY",
			"THURSDAY",
			"FRIDAY",
			"SATURDAY",
			"SUNDAY",
		]),
		midweekTime: z.string().regex(timeRegex),
		weekendWeekday: z.enum([
			"MONDAY",
			"TUESDAY",
			"WEDNESDAY",
			"THURSDAY",
			"FRIDAY",
			"SATURDAY",
			"SUNDAY",
		]),
		weekendTime: z.string().regex(timeRegex),
	})
	.superRefine((data, ctx) => {
		if (data.midweekWeekday === data.weekendWeekday) {
			ctx.addIssue({
				code: "custom",
				path: ["weekendWeekday"],
				message: "O dia do meio e do fim de semana devem ser diferentes.",
			});
		}
	});
