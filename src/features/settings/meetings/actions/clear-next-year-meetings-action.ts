"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import {
	startOfCivilYear,
	todayUtcDateOnly,
} from "@/features/settings/lib/year-bounds";
import { parseClearNextYear } from "@/features/settings/meetings/actions/meeting-schema";
import { db } from "@/lib/db";

export async function clearNextYearMeetingsAction(
	_prevState: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prevState;

	const parsed = parseClearNextYear(formData);
	if (!parsed.success) {
		return { success: false, message: "Dados inválidos." };
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const nextYear = todayUtcDateOnly().getUTCFullYear() + 1;
	const nextStart = startOfCivilYear(nextYear);

	try {
		await db.$transaction(async (tx) => {
			const next = await tx.organizationSchedule.findMany({
				where: {
					organizationId: authz.organization.id,
					type: "MEETINGS",
					mode: "WEEKLY_RECURRING",
					effectiveFrom: { gte: nextStart },
				},
				select: { id: true },
			});

			for (const s of next) {
				await tx.organizationSchedule.delete({ where: { id: s.id } });
			}

			// remove teto do atual
			await tx.organizationSchedule.updateMany({
				where: {
					organizationId: authz.organization.id,
					type: "MEETINGS",
					mode: "WEEKLY_RECURRING",
					OR: [{ effectiveFrom: null }, { effectiveFrom: { lt: nextStart } }],
				},
				data: { effectiveUntil: null },
			});
		});

		revalidatePath(`/org/${authz.organization.slug}/settings`);
		return {
			success: true,
			message:
				"Horário do próximo ano removido. O atual vale por tempo indeterminado.",
		};
	} catch {
		return {
			success: false,
			message: "Não foi possível remover o horário do próximo ano.",
		};
	}
}
