// src/features/cleaning-list/schemas/save-cleaning-list.schema.ts
import { z } from "zod";
import { CLEANING_TYPES } from "./generate-cleaning-list.schema";

const personSchema = z.object({
	personId: z.string().trim().min(1).max(191),
	personName: z
		.string()
		.trim()
		.min(1)
		.max(120)
		.transform((v) => v.replace(/[<>]/g, "")),
	familyId: z.string().trim().max(191).nullable(),
	familyName: z.string().trim().max(120).nullable(),
	groupId: z.string().trim().max(191).nullable(),
	groupName: z.string().trim().max(120).nullable(),
	position: z.number().int().min(0).max(100),
});

const cellSchema = z.object({
	sectorId: z.string().trim().min(1).max(191),
	sectorName: z
		.string()
		.trim()
		.min(1)
		.max(80)
		.transform((v) => v.replace(/[<>]/g, "")),
	required: z.number().int().min(1).max(50),
	assigned: z.array(personSchema).max(50),
});

const rowSchema = z.object({
	date: z.coerce.date(),
	cells: z.array(cellSchema).min(1).max(40),
});

export const saveCleaningListSchema = z
	.object({
		organizationId: z.string().trim().min(1).max(191),
		cleaningType: z.enum(CLEANING_TYPES),
		periodFrom: z.coerce.date(),
		periodTo: z.coerce.date(),
		rows: z.array(rowSchema).min(1).max(400),
	})
	.superRefine((data, ctx) => {
		if (data.periodTo.getTime() < data.periodFrom.getTime()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["periodTo"],
				message: "Período inválido.",
			});
		}

		const seenPeopleByDate = new Map<string, Set<string>>();

		for (const [rowIndex, row] of data.rows.entries()) {
			const dayKey = row.date.toISOString().slice(0, 10);
			const used = seenPeopleByDate.get(dayKey) ?? new Set<string>();

			for (const [cellIndex, cell] of row.cells.entries()) {
				if (cell.assigned.length > cell.required) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["rows", rowIndex, "cells", cellIndex, "assigned"],
						message: `Setor ${cell.sectorName} excede vagas.`,
					});
				}

				for (const person of cell.assigned) {
					if (used.has(person.personId)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							path: ["rows", rowIndex, "cells", cellIndex, "assigned"],
							message: "Pessoa repetida no mesmo dia.",
						});
					}
					used.add(person.personId);
				}
			}

			seenPeopleByDate.set(dayKey, used);
		}
	});

export type SaveCleaningListInput = z.infer<typeof saveCleaningListSchema>;
