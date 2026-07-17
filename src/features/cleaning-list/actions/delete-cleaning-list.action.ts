"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	initialSaveCleaningListState,
	type SaveCleaningListState,
} from "../domain/cleaning-list.types";

type Input = {
	listId: string;
	organizationId: string;
};

export async function deleteCleaningListAction(
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

	const listId = String(formData.get("listId") ?? "").trim();
	const organizationId = String(formData.get("organizationId") ?? "").trim();

	if (!listId || !organizationId) {
		return {
			...initialSaveCleaningListState,
			message: "Lista inválida.",
		};
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organizationId,
		},
		select: {
			role: true,
			organization: { select: { slug: true } },
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
			message: "Você não tem permissão para apagar listas.",
		};
	}

	const list = await db.cleaningAssignmentList.findFirst({
		where: {
			id: listId,
			organizationId,
		},
		select: { id: true },
	});

	if (!list) {
		return {
			...initialSaveCleaningListState,
			message: "Lista não encontrada.",
		};
	}

	await db.cleaningAssignmentList.delete({
		where: { id: listId },
	});

	revalidatePath(`/org/${membership.organization.slug}/cleaning`);

	return {
		success: true,
		message: "Lista apagada com sucesso.",
		errors: {},
	};
}
