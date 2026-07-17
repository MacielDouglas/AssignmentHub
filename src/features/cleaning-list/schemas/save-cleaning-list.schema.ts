import { z } from "zod";

const assignmentPersonSchema = z.object({
	personId: z.string().min(1),
	familyId: z.string().nullable(),
	groupId: z.string().nullable(),
	position: z.coerce.number().int().min(0),
});

const assignmentCellSchema = z.object({
	sectorId: z.string().min(1),
	sectorName: z.string().min(1),
	required: z.coerce.number().int().min(1),
	assigned: z.array(assignmentPersonSchema),
});

const assignmentRowSchema = z.object({
	date: z.coerce.date(),
	cells: z.array(assignmentCellSchema).min(1),
});

export const saveCleaningListSchema = z
	.object({
		organizationId: z.string().min(1),
		cleaningType: z.enum(["MEETING", "WEEKLY", "GENERAL"]),
		periodFrom: z.coerce.date(),
		periodTo: z.coerce.date(),
		rows: z.array(assignmentRowSchema).min(1),
	})
	.refine((data) => data.periodFrom <= data.periodTo, {
		message: "O período inicial não pode ser maior que o final.",
		path: ["periodTo"],
	});

export type SaveCleaningListInput = z.infer<typeof saveCleaningListSchema>;
