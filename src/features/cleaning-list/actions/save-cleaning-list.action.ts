// src/features/cleaning-list/actions/save-cleaning-list.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	initialSaveCleaningListState,
	type SaveCleaningListState,
} from "../domain/cleaning-list.types";
import { parseSaveCleaningListFormData } from "../lib/parse-save-cleaning-list-form-data";
import { saveCleaningListSchema } from "../schemas/save-cleaning-list.schema";

export async function saveCleaningListAction(
	_prev: SaveCleaningListState,
	formData: FormData,
): Promise<SaveCleaningListState> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return { ...initialSaveCleaningListState, message: "Sessão inválida." };
	}

	const payload = parseSaveCleaningListFormData(formData);
	const parsed = saveCleaningListSchema.safeParse(payload);

	if (!parsed.success) {
		return {
			success: false,
			message: "Verifique os dados da lista.",
			errors: parsed.error.flatten().fieldErrors,
		};
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organizationId: parsed.data.organizationId,
		},
		select: {
			role: true,
			organization: { select: { id: true, slug: true } },
		},
	});

	if (!membership) {
		return {
			...initialSaveCleaningListState,
			message: "Organização não encontrada.",
		};
	}

	if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
		return {
			...initialSaveCleaningListState,
			message: "Você não tem permissão para salvar listas.",
		};
	}

	// Valida setores e pessoas no servidor (anti-tamper)
	const sectorIds = [
		...new Set(
			parsed.data.rows.flatMap((row) => row.cells.map((c) => c.sectorId)),
		),
	];
	const personIds = [
		...new Set(
			parsed.data.rows.flatMap((row) =>
				row.cells.flatMap((c) => c.assigned.map((p) => p.personId)),
			),
		),
	];

	const [sectors, people] = await Promise.all([
		db.cleaningSector.findMany({
			where: {
				id: { in: sectorIds },
				isActive: true,
				cleaningTypeConfig: {
					type: parsed.data.cleaningType,
					enabled: true,
					settings: { organizationId: membership.organization.id },
				},
			},
			select: { id: true },
		}),
		db.person.findMany({
			where: {
				id: { in: personIds },
				organizationId: membership.organization.id,
				isActive: true,
				cleaning: true,
			},
			select: {
				id: true,
				familyId: true,
				groupId: true,
			},
		}),
	]);

	if (sectors.length !== sectorIds.length) {
		return {
			...initialSaveCleaningListState,
			message: "Um ou mais setores são inválidos para este tipo.",
		};
	}

	if (people.length !== personIds.length) {
		return {
			...initialSaveCleaningListState,
			message: "Uma ou mais pessoas são inválidas para designação.",
		};
	}

	const peopleById = new Map(people.map((p) => [p.id, p]));

	try {
		await db.$transaction(async (tx) => {
			const list = await tx.cleaningAssignmentList.create({
				data: {
					organizationId: parsed.data.organizationId,
					cleaningType: parsed.data.cleaningType,
					periodFrom: parsed.data.periodFrom,
					periodTo: parsed.data.periodTo,
					status: "SAVED",
				},
			});

			for (const row of parsed.data.rows) {
				const assignmentDate = await tx.cleaningAssignmentDate.create({
					data: {
						listId: list.id,
						date: row.date,
					},
				});

				for (const cell of row.cells) {
					for (const person of cell.assigned) {
						const dbPerson = peopleById.get(person.personId);
						if (!dbPerson) continue;

						await tx.cleaningAssignmentSectorAssignment.create({
							data: {
								assignmentDateId: assignmentDate.id,
								sectorId: cell.sectorId,
								personId: person.personId,
								// FKs reais do banco — nunca confiar só no client
								familyId: dbPerson.familyId,
								groupId: dbPerson.groupId,
								position: person.position,
							},
						});
					}
				}
			}
		});

		revalidatePath(`/org/${membership.organization.slug}/cleaning`);
		return {
			success: true,
			message: "Lista de limpeza salva com sucesso.",
			errors: {},
		};
	} catch (error) {
		console.error(error);
		return {
			...initialSaveCleaningListState,
			message: "Ocorreu um erro ao salvar a lista.",
		};
	}
}
