import { db } from "@/lib/db";

type GetCleaningSettingsQueryParams = {
	slug: string;
	userId: string;
};

export async function getCleaningSettingsQuery({
	slug,
	userId,
}: GetCleaningSettingsQueryParams) {
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
								select: {
									id: true,
									type: true,
									enabled: true,
									assignmentMode: true,
									notes: true,
									timesPerWeek: true,
									weekdays: {
										orderBy: {
											sortOrder: "asc",
										},
										select: {
											weekday: true,
											sortOrder: true,
										},
									},
									dates: {
										orderBy: {
											date: "asc",
										},
										select: {
											id: true,
											date: true,
											label: true,
										},
									},
									sectors: {
										orderBy: {
											sortOrder: "asc",
										},
										select: {
											id: true,
											name: true,
											description: true,
											peopleRequired: true,
											allowYoung: true,
											sortOrder: true,
											isActive: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});
}
