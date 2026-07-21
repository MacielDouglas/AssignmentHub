"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { parseUpsertSector } from "@/features/settings/cleaning/actions/cleaning-schema";
import type { CleaningType } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function upsertCleaningSectorAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prev;

	const parsed = parseUpsertSector(formData);
	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}
	// revalidatePath
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const type = parsed.data.type as CleaningType;
	const isMeeting = type === "MEETING";

	const settings = await db.organizationCleaningSettings.findUnique({
		where: { organizationId: authz.organization.id },
		select: { id: true },
	});
	if (!settings) {
		return { success: false, message: "Configurações não encontradas." };
	}

	const config = await db.cleaningTypeConfig.findUnique({
		where: {
			settingsId_type: { settingsId: settings.id, type },
		},
		select: { id: true, assignmentMode: true },
	});
	if (!config) {
		return { success: false, message: "Tipo não encontrado." };
	}

	const targetSex =
		parsed.data.targetSex === "ANY" ? null : parsed.data.targetSex;
	const peopleRequired =
		isMeeting && config.assignmentMode === "PERSON"
			? (parsed.data.peopleRequired ?? 1)
			: null;
	const allowYoung =
		isMeeting && config.assignmentMode === "PERSON"
			? parsed.data.allowYoung === "true"
			: true;

	try {
		if (parsed.data.sectorId) {
			const sector = await db.cleaningSector.findFirst({
				where: {
					id: parsed.data.sectorId,
					cleaningTypeConfigId: config.id,
				},
				select: { id: true },
			});
			if (!sector) {
				return { success: false, message: "Setor não encontrado." };
			}

			await db.cleaningSector.update({
				where: { id: sector.id },
				data: {
					name: parsed.data.name,
					description: parsed.data.description || null,
					peopleRequired,
					allowYoung,
					targetSex: isMeeting ? targetSex : null,
					isActive: parsed.data.isActive === "true",
				},
			});
		} else {
			const maxSort = await db.cleaningSector.aggregate({
				where: { cleaningTypeConfigId: config.id },
				_max: { sortOrder: true },
			});

			await db.cleaningSector.create({
				data: {
					cleaningTypeConfigId: config.id,
					name: parsed.data.name,
					description: parsed.data.description || null,
					peopleRequired,
					allowYoung,
					targetSex: isMeeting ? targetSex : null,
					isActive: parsed.data.isActive === "true",
					sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
				},
			});
		}

		revalidatePath(`/org/${authz.organization.slug}/settings`, "page");
		return { success: true, message: "Setor salvo." };
	} catch {
		return { success: false, message: "Não foi possível salvar o setor." };
	}
}
