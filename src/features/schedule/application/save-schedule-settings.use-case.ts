"use server";

import { db } from "@/lib/db";
import type { SaveScheduleSettingsInput } from "../schemas/save-schedule-settings.schema";

export async function saveScheduleSettingsUseCase(
	input: SaveScheduleSettingsInput,
): Promise<void> {
	await db.$transaction(async (tx) => {
		const existing = await tx.organizationSchedule.findMany({
			where: {
				organizationId: input.organizationId,
				type: {
					not: "FIELD_SERVICE_MEETING",
				},
			},
			select: {
				id: true,
			},
		});

		const incomingIds = new Set(
			input.items.map((item) => item.id).filter(Boolean) as string[],
		);

		const idsToDelete = existing
			.map((item) => item.id)
			.filter((id) => !incomingIds.has(id));

		if (idsToDelete.length > 0) {
			await tx.organizationSchedule.deleteMany({
				where: {
					id: {
						in: idsToDelete,
					},
				},
			});
		}

		for (const item of input.items) {
			const schedule = item.id
				? await tx.organizationSchedule.update({
						where: { id: item.id },
						data: {
							type: item.type,
							mode: item.mode,
							title: item.title,
							description: item.description,
							isActive: item.isActive,
							effectiveFrom: null,
							effectiveUntil: null,
						},
						select: { id: true },
					})
				: await tx.organizationSchedule.create({
						data: {
							organizationId: input.organizationId,
							type: item.type,
							mode: item.mode,
							title: item.title,
							description: item.description,
							isActive: item.isActive,
							effectiveFrom: null,
							effectiveUntil: null,
						},
						select: { id: true },
					});

			await tx.organizationScheduleWeeklyRule.deleteMany({
				where: {
					organizationScheduleId: schedule.id,
				},
			});

			if (item.weeklyRules.length > 0) {
				await tx.organizationScheduleWeeklyRule.createMany({
					data: item.weeklyRules.map((rule, index) => ({
						organizationScheduleId: schedule.id,
						weekday: rule.weekday,
						time: rule.time,
						sortOrder: index,
					})),
				});
			}

			await tx.organizationScheduleOccurrence.deleteMany({
				where: {
					organizationScheduleId: schedule.id,
				},
			});

			if (item.occurrences.length > 0) {
				await tx.organizationScheduleOccurrence.createMany({
					data: item.occurrences.map((occurrence, index) => ({
						organizationScheduleId: schedule.id,
						startDate: occurrence.startDate,
						endDate: occurrence.endDate,
						time: occurrence.time,
						isAllDay: occurrence.isAllDay,
						leaderPersonId: occurrence.leaderPersonId,
						location: occurrence.location,
						notes: occurrence.notes,
						sortOrder: index,
					})),
				});
			}
		}
	});
}
