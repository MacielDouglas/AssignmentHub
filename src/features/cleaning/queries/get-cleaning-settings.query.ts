// src/features/cleaning/queries/get-cleaning-settings.query.ts
import { db } from "@/lib/db";

type Params = { slug: string; userId: string };

export async function getCleaningSettingsQuery({ slug, userId }: Params) {
	const membership = await db.organizationMembership.findFirst({
		where: { userId, organization: { slug } },
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
								select: {
									id: true,
									type: true,
									enabled: true,
									assignmentMode: true,
									notes: true,
									weekdays: {
										orderBy: { sortOrder: "asc" },
										select: { id: true, weekday: true, sortOrder: true },
									},
									dates: {
										orderBy: { date: "asc" },
										select: { id: true, date: true, label: true },
									},
									sectors: {
										orderBy: { sortOrder: "asc" },
										select: {
											id: true,
											name: true,
											description: true,
											peopleRequired: true,
											allowYoung: true,
											targetSex: true,
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

	if (!membership) return null;

	const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	const lockedSectors = await db.cleaningAssignmentSectorAssignment.findMany({
		where: {
			sector: {
				cleaningTypeConfig: {
					settings: { organizationId: membership.organization.id },
				},
			},
			assignmentDate: { date: { lt: startOfToday } },
		},
		select: { sectorId: true },
		distinct: ["sectorId"],
	});

	return {
		role: membership.role,
		canManage,
		organization: membership.organization,
		lockedSectorIds: new Set(lockedSectors.map((s) => s.sectorId)),
	};
}
