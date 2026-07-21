"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { parseRestoreDefaults } from "@/features/settings/cleaning/actions/cleaning-schema";
import { restoreMissingDefaultSectors } from "@/features/settings/cleaning/lib/cleaning-settings";
import type { CleaningType } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function restoreCleaningDefaultsAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prev;

	const parsed = parseRestoreDefaults(formData);
	if (!parsed.success) {
		return { success: false, message: "Dados inválidos." };
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const settings = await db.organizationCleaningSettings.findUnique({
		where: { organizationId: authz.organization.id },
		select: { id: true },
	});
	if (!settings) {
		return { success: false, message: "Configurações não encontradas." };
	}

	const config = await db.cleaningTypeConfig.findUnique({
		where: {
			settingsId_type: {
				settingsId: settings.id,
				type: parsed.data.type as CleaningType,
			},
		},
		select: { id: true },
	});
	if (!config) {
		return { success: false, message: "Tipo de limpeza não encontrado." };
	}

	const created = await restoreMissingDefaultSectors(
		config.id,
		parsed.data.type as CleaningType,
	);

	revalidatePath(`/org/${authz.organization.slug}/settings`);
	return {
		success: true,
		message:
			created === 0
				? "Nenhum setor padrão faltando."
				: `${created} setor(es) padrão restaurado(s).`,
	};
}
