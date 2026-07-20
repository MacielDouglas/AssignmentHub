// src/features/cleaning-list/schemas/generate-cleaning-list.schema.ts
import { z } from "zod";

export const CLEANING_TYPES = ["MEETING", "WEEKLY", "GENERAL"] as const;

export const generateCleaningListSchema = z
	.object({
		organizationId: z.string().trim().min(1).max(191),
		cleaningType: z.enum(CLEANING_TYPES),
		periodFrom: z.coerce.date(),
		periodTo: z.coerce.date(),
	})
	.superRefine((data, ctx) => {
		if (data.periodTo.getTime() < data.periodFrom.getTime()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["periodTo"],
				message: "A data final deve ser maior ou igual à inicial.",
			});
		}

		const maxMs = 1000 * 60 * 60 * 24 * 366;
		if (data.periodTo.getTime() - data.periodFrom.getTime() > maxMs) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["periodTo"],
				message: "O período máximo é de 366 dias.",
			});
		}
	});

export type GenerateCleaningListInput = z.infer<
	typeof generateCleaningListSchema
>;
