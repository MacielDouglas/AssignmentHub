import { db } from "@/lib/db";

type GetOrganizationSettingsDataQueryParams = {
	slug: string;
	userId: string;
};

export async function getOrganizationSettingsDataQuery({
	slug,
	userId,
}: GetOrganizationSettingsDataQueryParams) {
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
					createdAt: true,
					updatedAt: true,
					cleaningSettings: {
						select: {
							id: true,
							cleaningPerMeeting: true,
							weeklyCleaning: true,
							generalCleaning: true,
						},
					},
					schedules: {
						where: {
							type: {
								not: "FIELD_SERVICE_MEETING",
							},
						},
						select: {
							id: true,
							type: true,
							isActive: true,
							occurrences: {
								select: {
									id: true,
								},
							},
							weeklyRules: {
								select: {
									id: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!membership) {
		return null;
	}

	const canManageOrganization =
		membership.role === "OWNER" || membership.role === "ADMIN";

	return {
		role: membership.role,
		canManageOrganization,
		organization: membership.organization,
	};
}
