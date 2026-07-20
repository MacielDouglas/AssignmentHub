// src/features/cleaning/application/save-cleaning-settings.use-case.ts
"use server";

import { db } from "@/lib/db";
import type { SaveCleaningSettingsInput } from "../schemas/save-cleaning-settings.schema";

export async function saveCleaningSettingsUseCase(
	input: SaveCleaningSettingsInput,
) {
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	await db.$transaction(async (tx) => {
		const settings = await tx.organizationCleaningSettings.upsert({
			where: { organizationId: input.organizationId },
			create: {
				organizationId: input.organizationId,
				cleaningPerMeeting: input.meeting.enabled,
				weeklyCleaning: input.weekly.enabled,
				generalCleaning: input.general.enabled,
			},
			update: {
				cleaningPerMeeting: input.meeting.enabled,
				weeklyCleaning: input.weekly.enabled,
				generalCleaning: input.general.enabled,
			},
			select: { id: true },
		});

		for (const config of [input.meeting, input.weekly, input.general]) {
			const saved = config.id
				? await tx.cleaningTypeConfig.update({
						where: { id: config.id },
						data: {
							enabled: config.enabled,
							assignmentMode: config.enabled ? config.assignmentMode : null,
							notes: config.notes,
						},
						select: { id: true },
					})
				: await tx.cleaningTypeConfig.upsert({
						where: {
							settingsId_type: {
								settingsId: settings.id,
								type: config.type,
							},
						},
						create: {
							settingsId: settings.id,
							type: config.type,
							enabled: config.enabled,
							assignmentMode: config.enabled ? config.assignmentMode : null,
							notes: config.notes,
						},
						update: {
							enabled: config.enabled,
							assignmentMode: config.enabled ? config.assignmentMode : null,
							notes: config.notes,
						},
						select: { id: true },
					});

			// weekdays (WEEKLY: 0 ou 1)
			await tx.cleaningWeekday.deleteMany({
				where: { cleaningTypeConfigId: saved.id },
			});
			if (config.type === "WEEKLY" && config.weekday) {
				await tx.cleaningWeekday.create({
					data: {
						cleaningTypeConfigId: saved.id,
						weekday: config.weekday,
						sortOrder: 0,
					},
				});
			}

			// dates (GENERAL)
			await tx.cleaningDate.deleteMany({
				where: { cleaningTypeConfigId: saved.id },
			});
			if (config.type === "GENERAL" && config.dates.length > 0) {
				await tx.cleaningDate.createMany({
					data: config.dates.map((date) => ({
						cleaningTypeConfigId: saved.id,
						date: new Date(`${date}T00:00:00.000Z`),
					})),
				});
			}

			const existingSectors = await tx.cleaningSector.findMany({
				where: { cleaningTypeConfigId: saved.id },
				select: { id: true },
			});

			const incomingIds = new Set(
				config.sectors.map((s) => s.id).filter(Boolean) as string[],
			);

			const toMaybeDelete = existingSectors
				.map((s) => s.id)
				.filter((id) => !incomingIds.has(id));

			if (toMaybeDelete.length > 0) {
				const locked = await tx.cleaningAssignmentSectorAssignment.findMany({
					where: {
						sectorId: { in: toMaybeDelete },
						assignmentDate: { date: { lt: startOfToday } },
					},
					select: { sectorId: true },
					distinct: ["sectorId"],
				});
				const lockedIds = new Set(locked.map((l) => l.sectorId));

				const soft = toMaybeDelete.filter((id) => lockedIds.has(id));
				const hard = toMaybeDelete.filter((id) => !lockedIds.has(id));

				if (soft.length > 0) {
					await tx.cleaningSector.updateMany({
						where: { id: { in: soft } },
						data: { isActive: false },
					});
				}

				if (hard.length > 0) {
					// remove só designações futuras desses setores, depois o setor
					const futureAssignmentIds =
						await tx.cleaningAssignmentSectorAssignment.findMany({
							where: {
								sectorId: { in: hard },
								assignmentDate: { date: { gte: startOfToday } },
							},
							select: { id: true },
						});

					if (futureAssignmentIds.length > 0) {
						await tx.cleaningAssignmentSectorAssignment.deleteMany({
							where: { id: { in: futureAssignmentIds.map((a) => a.id) } },
						});
					}

					await tx.cleaningSector.deleteMany({
						where: { id: { in: hard } },
					});
				}
			}

			for (const [index, sector] of config.sectors.entries()) {
				const data = {
					name: sector.name,
					description: sector.description,
					peopleRequired: sector.peopleRequired,
					allowYoung: sector.allowYoung,
					targetSex: sector.targetSex,
					sortOrder: index,
					isActive: sector.isActive,
				};

				if (sector.id) {
					await tx.cleaningSector.update({
						where: { id: sector.id },
						data,
					});
				} else {
					await tx.cleaningSector.create({
						data: {
							cleaningTypeConfigId: saved.id,
							...data,
						},
					});
				}
			}
		}
	});
}
