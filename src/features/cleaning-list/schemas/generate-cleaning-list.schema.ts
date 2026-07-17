import { z } from "zod";

export const generateCleaningListSchema = z
	.object({
		organizationId: z.string().min(1),
		cleaningType: z.enum(["MEETING", "WEEKLY", "GENERAL"]),
		periodFrom: z.coerce.date(),
		periodTo: z.coerce.date(),
	})
	.refine((data) => data.periodFrom <= data.periodTo, {
		message: "O período inicial não pode ser maior que o final.",
		path: ["periodTo"],
	});

export type GenerateCleaningListInput = z.infer<
	typeof generateCleaningListSchema
>;
