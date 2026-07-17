import { db } from "@/lib/db";
import {
	cleaningConfigSelect,
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
			organization: {
				slug,
			},
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
								orderBy: {
									type: "asc",
								},
								select: cleaningConfigSelect,
							},
						},
					},
					people: {
						where: {
							isActive: true,
							cleaning: true,
						},
						orderBy: {
							name: "asc",
						},
						select: cleaningPersonSelect,
					},
					cleaningLists: {
						where: {
							status: "SAVED",
						},
						orderBy: {
							createdAt: "desc",
						},
						take: 1,
						select: cleaningSavedListSelect,
					},
				},
			},
		},
	});

	if (!membership) {
		return null;
	}

	const bookedDates = await db.cleaningAssignmentDate.findMany({
		where: {
			list: {
				organizationId: membership.organization.id,
				status: "SAVED",
			},
		},
		select: {
			date: true,
			listId: true,
		},
		orderBy: {
			date: "asc",
		},
	});

	return {
		role: membership.role,
		canManageOrganization:
			membership.role === "OWNER" || membership.role === "ADMIN",
		organization: membership.organization,
		bookedDates,
	};
}

export type CleaningPageData = NonNullable<
	Awaited<ReturnType<typeof getCleaningPageDataQuery>>
>;
