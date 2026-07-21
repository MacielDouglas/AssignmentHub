"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { parseDeleteSector } from "@/features/settings/cleaning/actions/cleaning-schema";
import { db } from "@/lib/db";

export async function deleteCleaningSectorAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prev;

	const parsed = parseDeleteSector(formData);
	if (!parsed.success) {
		return { success: false, message: "Dados inválidos." };
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const sector = await db.cleaningSector.findFirst({
		where: {
			id: parsed.data.sectorId,
			cleaningTypeConfig: {
				settings: { organizationId: authz.organization.id },
			},
		},
		select: {
			id: true,
			_count: { select: { assignments: true } },
		},
	});

	if (!sector) {
		return { success: false, message: "Setor não encontrado." };
	}

	try {
		if (parsed.data.mode === "hard") {
			if (sector._count.assignments > 0) {
				return {
					success: false,
					message:
						"Não é possível excluir: há designações vinculadas. Desative o setor.",
				};
			}
			await db.cleaningSector.delete({ where: { id: sector.id } });
			revalidatePath(`/org/${authz.organization.slug}/settings`);
			return { success: true, message: "Setor excluído." };
		}

		await db.cleaningSector.update({
			where: { id: sector.id },
			data: { isActive: false },
		});
		revalidatePath(`/org/${authz.organization.slug}/settings`);
		return { success: true, message: "Setor desativado." };
	} catch {
		return { success: false, message: "Não foi possível remover o setor." };
	}
}
