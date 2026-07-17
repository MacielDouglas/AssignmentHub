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
	_prevState: SaveCleaningListState,
	formData: FormData,
): Promise<SaveCleaningListState> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			...initialSaveCleaningListState,
			message: "Sessão inválida.",
		};
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
			organization: {
				select: {
					slug: true,
				},
			},
		},
	});

	if (!membership) {
		return {
			...initialSaveCleaningListState,
			message: "Organização não encontrada.",
		};
	}

	const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

	if (!canManage) {
		return {
			...initialSaveCleaningListState,
			message: "Você não tem permissão para salvar listas.",
		};
	}

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
						await tx.cleaningAssignmentSectorAssignment.create({
							data: {
								assignmentDateId: assignmentDate.id,
								sectorId: cell.sectorId,
								personId: person.personId,
								familyId: person.familyId,
								groupId: person.groupId,
								position: person.position,
							},
						});
					}
				}
			}
		});

		revalidatePath(`/org/${membership.organization.slug}/cleaning`);
		revalidatePath(`/org/${membership.organization.slug}/settings/cleaning`);

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
