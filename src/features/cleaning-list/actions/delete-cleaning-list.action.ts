// src/features/cleaning-list/actions/delete-cleaning-list.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	type DeleteCleaningListState,
	initialDeleteCleaningListState,
} from "../domain/cleaning-list.types";

export async function deleteCleaningListAction(
	_prev: DeleteCleaningListState,
	formData: FormData,
): Promise<DeleteCleaningListState> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return { ...initialDeleteCleaningListState, message: "Sessão inválida." };
	}

	const listId = String(formData.get("listId") ?? "").trim();
	const organizationId = String(formData.get("organizationId") ?? "").trim();

	if (!listId || !organizationId) {
		return { ...initialDeleteCleaningListState, message: "Lista inválida." };
	}

	const membership = await db.organizationMembership.findFirst({
		where: { userId: session.user.id, organizationId },
		select: {
			role: true,
			organization: { select: { slug: true } },
		},
	});

	if (!membership) {
		return {
			...initialDeleteCleaningListState,
			message: "Organização não encontrada.",
		};
	}

	if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
		return {
			...initialDeleteCleaningListState,
			message: "Você não tem permissão para apagar listas.",
		};
	}

	const list = await db.cleaningAssignmentList.findFirst({
		where: { id: listId, organizationId },
		select: {
			id: true,
			dates: { select: { date: true }, orderBy: { date: "asc" } },
		},
	});

	if (!list) {
		return {
			...initialDeleteCleaningListState,
			message: "Lista não encontrada.",
		};
	}

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	const hasPastDate = list.dates.some(
		(item) => item.date.getTime() < startOfToday.getTime(),
	);

	if (hasPastDate) {
		return {
			...initialDeleteCleaningListState,
			message:
				"Listas com datas passadas não podem ser apagadas (histórico protegido).",
		};
	}

	// Cascade: dates + assignments (se onDelete Cascade no schema)
	await db.cleaningAssignmentList.delete({ where: { id: list.id } });

	revalidatePath(`/org/${membership.organization.slug}/cleaning`);

	return {
		success: true,
		message: "Lista apagada com sucesso.",
	};
}
