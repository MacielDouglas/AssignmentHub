"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const initialState: GroupActionState = {
	success: false,
	message: "",
};

export async function deleteGroupAction(
	_prevState: GroupActionState = initialState,
	formData: FormData,
): Promise<GroupActionState> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			success: false,
			message: "Sessão inválida.",
		};
	}

	const groupId = String(formData.get("groupId") ?? "").trim();
	const organizationId = String(formData.get("organizationId") ?? "").trim();
	const organizationSlug = String(
		formData.get("organizationSlug") ?? "",
	).trim();

	if (!groupId || !organizationId || !organizationSlug) {
		return {
			success: false,
			message: "Dados inválidos para exclusão.",
		};
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organizationId,
		},
		select: {
			role: true,
		},
	});

	if (!membership) {
		return {
			success: false,
			message: "Você não pertence a esta organização.",
		};
	}

	const canManageGroups =
		membership.role === "OWNER" || membership.role === "ADMIN";

	if (!canManageGroups) {
		return {
			success: false,
			message: "Você não tem permissão para excluir grupos.",
		};
	}

	const group = await db.group.findFirst({
		where: {
			id: groupId,
			organizationId,
		},
		select: {
			id: true,
		},
	});

	if (!group) {
		return {
			success: false,
			message: "Grupo não encontrado.",
		};
	}

	try {
		await db.$transaction(async (tx) => {
			await tx.person.updateMany({
				where: {
					organizationId,
					groupId,
				},
				data: {
					groupId: null,
				},
			});

			await tx.group.delete({
				where: {
					id: groupId,
				},
			});
		});

		revalidatePath(`/org/${organizationSlug}/groups`);

		return {
			success: true,
			message: "Grupo excluído com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Não foi possível excluir o grupo.",
		};
	}
}
