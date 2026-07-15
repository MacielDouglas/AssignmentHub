import { db } from "@/lib/db";

type GetScheduleSettingsQueryParams = {
	slug: string;
	userId: string;
};

export async function getScheduleSettingsQuery({
	slug,
	userId,
}: GetScheduleSettingsQueryParams) {
	return db.organizationMembership.findFirst({
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
					people: {
						where: {
							isActive: true,
						},
						orderBy: {
							name: "asc",
						},
						select: {
							id: true,
							name: true,
						},
					},
					schedules: {
						where: {
							type: {
								not: "FIELD_SERVICE_MEETING",
							},
						},
						orderBy: [{ type: "asc" }, { createdAt: "asc" }],
						select: {
							id: true,
							type: true,
							mode: true,
							title: true,
							description: true,
							isActive: true,
							effectiveFrom: true,
							effectiveUntil: true,
							weeklyRules: {
								orderBy: {
									sortOrder: "asc",
								},
								select: {
									id: true,
									weekday: true,
									time: true,
									sortOrder: true,
								},
							},
							occurrences: {
								orderBy: [{ startDate: "asc" }, { sortOrder: "asc" }],
								select: {
									id: true,
									startDate: true,
									endDate: true,
									time: true,
									isAllDay: true,
									leaderPersonId: true,
									location: true,
									notes: true,
									sortOrder: true,
								},
							},
						},
					},
				},
			},
		},
	});
}
