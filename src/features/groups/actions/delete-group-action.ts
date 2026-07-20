"use server";

import { revalidatePath } from "next/cache";
import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import { requireGroupManager } from "@/features/groups/actions/group-auth";
import { parseDeleteGroupFormData } from "@/features/groups/actions/group-schema";
import { db } from "@/lib/db";

export async function deleteGroupAction(
	_prevState: GroupActionState,
	formData: FormData,
): Promise<GroupActionState> {
	void _prevState;

	const parsed = parseDeleteGroupFormData(formData);

	if (!parsed.success) {
		return { success: false, message: "Dados inválidos para exclusão." };
	}

	const authz = await requireGroupManager(parsed.data.organizationSlug);
	if (!authz.ok) {
		return { success: false, message: authz.message };
	}

	const { organization } = authz;
	const { groupId } = parsed.data;

	const group = await db.group.findFirst({
		where: {
			id: groupId,
			organizationId: organization.id,
		},
		select: {
			id: true,
			name: true,
			_count: {
				select: {
					cleaningTypeConfigs: true,
					cleaningAssignments: true,
				},
			},
		},
	});

	if (!group) {
		return { success: false, message: "Grupo não encontrado." };
	}

	const dependencies: NonNullable<GroupActionState["dependencies"]> = [];

	if (group._count.cleaningTypeConfigs > 0) {
		dependencies.push({
			kind: "cleaning_config",
			label: "Configurações de limpeza vinculadas a este grupo",
			count: group._count.cleaningTypeConfigs,
		});
	}

	if (group._count.cleaningAssignments > 0) {
		dependencies.push({
			kind: "cleaning_assignment",
			label: "Designações de limpeza que referenciam este grupo",
			count: group._count.cleaningAssignments,
		});
	}

	if (dependencies.length > 0) {
		return {
			success: false,
			message:
				"Não é possível excluir este grupo enquanto houver dependências. Remova ou altere os vínculos listados e tente novamente.",
			dependencies,
		};
	}

	try {
		await db.$transaction(async (tx) => {
			await tx.person.updateMany({
				where: {
					organizationId: organization.id,
					groupId,
				},
				data: { groupId: null },
			});

			await tx.group.delete({
				where: { id: groupId },
			});
		});

		revalidatePath(`/org/${organization.slug}/groups`);
		revalidatePath(`/org/${organization.slug}/people`);

		return { success: true, message: "Grupo excluído com sucesso." };
	} catch {
		return { success: false, message: "Não foi possível excluir o grupo." };
	}
}
