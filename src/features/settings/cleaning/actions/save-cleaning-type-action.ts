"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { parseSaveCleaningType } from "@/features/settings/cleaning/actions/cleaning-schema";
import { withFollowVisitMeta } from "@/features/settings/cleaning/lib/cleaning-defaults";
import { parseDateInput } from "@/features/settings/lib/year-bounds";
import type { CleaningType, Weekday } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type DateRow = { date: string; label?: string | null };

export async function saveCleaningTypeAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prev;

	const parsed = parseSaveCleaningType(formData);
	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const data = parsed.data;
	const enabled = data.enabled === "true";
	const type = data.type as CleaningType;

	let dates: DateRow[] = [];
	try {
		dates = JSON.parse(data.datesJson || "[]") as DateRow[];
	} catch {
		return { success: false, message: "Lista de datas inválida." };
	}

	try {
		await db.$transaction(async (tx) => {
			const settings = await tx.organizationCleaningSettings.upsert({
				where: { organizationId: authz.organization.id },
				create: {
					organizationId: authz.organization.id,
					cleaningPerMeeting: type === "MEETING" ? enabled : false,
					weeklyCleaning: type === "WEEKLY" ? enabled : false,
					generalCleaning: type === "GENERAL" ? enabled : false,
				},
				update: {
					...(type === "MEETING" ? { cleaningPerMeeting: enabled } : {}),
					...(type === "WEEKLY" ? { weeklyCleaning: enabled } : {}),
					...(type === "GENERAL" ? { generalCleaning: enabled } : {}),
				},
			});

			const existing = await tx.cleaningTypeConfig.findUnique({
				where: {
					settingsId_type: { settingsId: settings.id, type },
				},
			});

			const followVisit = (data.followVisit ?? "true") === "true";
			const notes =
				type === "MEETING"
					? withFollowVisitMeta(existing?.notes, followVisit)
					: (existing?.notes ?? null);

			const config = existing
				? await tx.cleaningTypeConfig.update({
						where: { id: existing.id },
						data: {
							enabled,
							assignmentMode: data.assignmentMode,
							timesPerWeek:
								type === "WEEKLY"
									? (data.timesPerWeek ?? (data.weekdays.length || 1))
									: null,
							notes,
							// não mexe em groupId/familyId/personId — designação na outra tela
						},
					})
				: await tx.cleaningTypeConfig.create({
						data: {
							settingsId: settings.id,
							type,
							enabled,
							assignmentMode: data.assignmentMode,
							timesPerWeek: type === "WEEKLY" ? (data.timesPerWeek ?? 1) : null,
							notes:
								type === "MEETING"
									? withFollowVisitMeta(null, followVisit)
									: null,
						},
					});

			if (type === "WEEKLY") {
				await tx.cleaningWeekday.deleteMany({
					where: { cleaningTypeConfigId: config.id },
				});
				if (data.weekdays.length > 0) {
					await tx.cleaningWeekday.createMany({
						data: data.weekdays.map((w, i) => ({
							cleaningTypeConfigId: config.id,
							weekday: w as Weekday,
							sortOrder: i,
						})),
					});
				}
			}

			if (type === "GENERAL") {
				await tx.cleaningDate.deleteMany({
					where: { cleaningTypeConfigId: config.id },
				});
				const rows = dates
					.map((d) => {
						const dt = parseDateInput(d.date);
						if (!dt) return null;
						return {
							cleaningTypeConfigId: config.id,
							date: dt,
							label: d.label?.trim() || null,
						};
					})
					.filter(Boolean) as Array<{
					cleaningTypeConfigId: string;
					date: Date;
					label: string | null;
				}>;

				if (rows.length) {
					await tx.cleaningDate.createMany({ data: rows });
				}
			}
		});

		revalidatePath(`/org/${authz.organization.slug}/settings`);
		return { success: true, message: "Configuração de limpeza salva." };
	} catch {
		return {
			success: false,
			message: "Não foi possível salvar a configuração de limpeza.",
		};
	}
}
