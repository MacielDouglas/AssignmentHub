"use server";

import { revalidatePath } from "next/cache";
import { parseDeleteSpecialOccurrence } from "@/features/settings/actions/meeting-schema";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";

export async function deleteSpecialEventOccurrenceAction(
	_prevState: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prevState;

	const parsed = parseDeleteSpecialOccurrence(formData);
	if (!parsed.success) {
		return { success: false, message: "Dados inválidos." };
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const occ = await db.organizationScheduleOccurrence.findFirst({
		where: {
			id: parsed.data.occurrenceId,
			organizationSchedule: {
				organizationId: authz.organization.id,
			},
		},
		select: {
			id: true,
			organizationScheduleId: true,
		},
	});

	if (!occ) {
		return { success: false, message: "Evento não encontrado." };
	}

	try {
		await db.$transaction(async (tx) => {
			await tx.organizationScheduleOccurrence.delete({
				where: { id: occ.id },
			});

			const remaining = await tx.organizationScheduleOccurrence.count({
				where: { organizationScheduleId: occ.organizationScheduleId },
			});

			if (remaining === 0) {
				await tx.organizationSchedule.delete({
					where: { id: occ.organizationScheduleId },
				});
			}
		});

		revalidatePath(`/org/${authz.organization.slug}/settings`);
		return { success: true, message: "Evento excluído." };
	} catch {
		return { success: false, message: "Não foi possível excluir o evento." };
	}
}
