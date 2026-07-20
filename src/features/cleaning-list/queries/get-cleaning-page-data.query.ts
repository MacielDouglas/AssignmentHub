// src/features/cleaning-list/queries/get-cleaning-page-data.query.ts
import { db } from "@/lib/db";
import type {
	CleaningBookedDate,
	CleaningSavedListSummary,
} from "../domain/cleaning-list.types";
import {
	cleaningConfigSelect,
	cleaningMeetingScheduleSelect,
	cleaningPersonSelect,
	cleaningSavedListSelect,
} from "../lib/cleaning-list.selects";

type Input = {
	slug: string;
	userId: string;
};

export async function getCleaningPageDataQuery({ slug, userId }: Input) {
	const membership = await db.organizationMembership.findFirst({
		where: {
			userId,
			organization: { slug },
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					cleaningSettings: {
						select: {
							id: true,
							cleaningPerMeeting: true,
							weeklyCleaning: true,
							generalCleaning: true,
							configs: {
								orderBy: { type: "asc" },
								select: cleaningConfigSelect,
							},
						},
					},
					people: {
						where: { isActive: true, cleaning: true },
						orderBy: { name: "asc" },
						select: cleaningPersonSelect,
					},
					schedules: {
						where: {
							type: "MEETINGS",
							isActive: true,
						},
						select: cleaningMeetingScheduleSelect,
					},
					cleaningLists: {
						where: { status: "SAVED" },
						orderBy: { createdAt: "desc" },
						take: 30,
						select: cleaningSavedListSelect,
					},
				},
			},
		},
	});

	if (!membership) return null;

	const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	const bookedDates: CleaningBookedDate[] =
		membership.organization.cleaningLists.flatMap((list) =>
			list.dates.map((item) => ({
				date: item.date,
				listId: list.id,
			})),
		);

	const lists: CleaningSavedListSummary[] =
		membership.organization.cleaningLists.map((list) => {
			const hasPastDate = list.dates.some(
				(item) => item.date.getTime() < startOfToday.getTime(),
			);

			return {
				id: list.id,
				cleaningType: list.cleaningType,
				periodFrom: list.periodFrom,
				periodTo: list.periodTo,
				status: list.status,
				createdAt: list.createdAt,
				canDelete: canManage && !hasPastDate,
				datesCount: list.dates.length,
			};
		});

	return {
		role: membership.role,
		canManage,
		organization: membership.organization,
		bookedDates,
		lists,
	};
}

export type CleaningPageData = NonNullable<
	Awaited<ReturnType<typeof getCleaningPageDataQuery>>
>;
