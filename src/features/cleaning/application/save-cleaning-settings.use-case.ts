"use server";

import { db } from "@/lib/db";
import type { SaveCleaningSettingsInput } from "../schemas/save-cleaning-settings.schema";

export async function saveCleaningSettingsUseCase(
	input: SaveCleaningSettingsInput,
): Promise<void> {
	await db.$transaction(async (tx) => {
		const settings = await tx.organizationCleaningSettings.upsert({
			where: {
				organizationId: input.organizationId,
			},
			create: {
				organizationId: input.organizationId,
				cleaningPerMeeting: input.cleaningPerMeeting,
				weeklyCleaning: input.weeklyCleaning,
				generalCleaning: input.generalCleaning,
			},
			update: {
				cleaningPerMeeting: input.cleaningPerMeeting,
				weeklyCleaning: input.weeklyCleaning,
				generalCleaning: input.generalCleaning,
			},
			select: {
				id: true,
			},
		});

		const existingConfigs = await tx.cleaningTypeConfig.findMany({
			where: {
				settingsId: settings.id,
			},
			select: {
				id: true,
				type: true,
			},
		});

		for (const configInput of input.configs) {
			const existingConfig = existingConfigs.find(
				(item) => item.type === configInput.type,
			);

			const config = existingConfig
				? await tx.cleaningTypeConfig.update({
						where: {
							id: existingConfig.id,
						},
						data: {
							enabled: configInput.enabled,
							assignmentMode: configInput.assignmentMode,
							notes: configInput.notes || null,
							timesPerWeek:
								configInput.type === "GENERAL"
									? null
									: configInput.timesPerWeek,
							groupId: null,
							familyId: null,
							personId: null,
						},
						select: {
							id: true,
						},
					})
				: await tx.cleaningTypeConfig.create({
						data: {
							settingsId: settings.id,
							type: configInput.type,
							enabled: configInput.enabled,
							assignmentMode: configInput.assignmentMode,
							notes: configInput.notes || null,
							timesPerWeek:
								configInput.type === "GENERAL"
									? null
									: configInput.timesPerWeek,
							groupId: null,
							familyId: null,
							personId: null,
						},
						select: {
							id: true,
						},
					});

			await tx.cleaningWeekday.deleteMany({
				where: {
					cleaningTypeConfigId: config.id,
				},
			});

			if (configInput.weekdays.length > 0) {
				await tx.cleaningWeekday.createMany({
					data: configInput.weekdays.map((weekday, index) => ({
						cleaningTypeConfigId: config.id,
						weekday,
						sortOrder: index,
					})),
				});
			}

			await tx.cleaningDate.deleteMany({
				where: {
					cleaningTypeConfigId: config.id,
				},
			});

			if (configInput.dates.length > 0) {
				await tx.cleaningDate.createMany({
					data: configInput.dates.map((date) => ({
						cleaningTypeConfigId: config.id,
						date,
					})),
				});
			}

			await tx.cleaningSector.deleteMany({
				where: {
					cleaningTypeConfigId: config.id,
				},
			});

			if (configInput.sectors.length > 0) {
				await tx.cleaningSector.createMany({
					data: configInput.sectors.map((sector, index) => ({
						cleaningTypeConfigId: config.id,
						name: sector.name.trim(),
						description: sector.description?.trim() || null,
						peopleRequired: sector.peopleRequired,
						allowYoung: sector.allowYoung,
						sortOrder: index,
						isActive: sector.isActive,
					})),
				});
			}
		}
	});
}
