"use server";

import { formatDateInput } from "@/features/settings/lib/year-bounds";
import { db } from "@/lib/db";

export async function getSavedListDetail(
	listId: string,
	organizationId: string,
) {
	const list = await db.cleaningAssignmentList.findFirst({
		where: { id: listId, organizationId, status: "SAVED" },
		include: {
			dates: {
				orderBy: { date: "asc" },
				include: {
					assignments: {
						orderBy: [{ sectorId: "asc" }, { position: "asc" }],
						include: {
							person: { select: { id: true, name: true } },
							sector: {
								select: {
									id: true,
									name: true,
									description: true,
									sortOrder: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!list) return null;

	return {
		id: list.id,
		cleaningType: list.cleaningType,
		periodFrom: formatDateInput(list.periodFrom),
		periodTo: formatDateInput(list.periodTo),
		days: list.dates.map((d) => ({
			date: formatDateInput(d.date),
			assignments: d.assignments.map((a) => ({
				id: a.id,
				sectorId: a.sector.id,
				sectorName: a.sector.name,
				sectorDescription: a.sector.description,
				sortOrder: a.sector.sortOrder,
				personId: a.person.id,
				personName: a.person.name,
				position: a.position,
				isManual: a.isManual,
				familyId: a.familyId,
				groupId: a.groupId,
			})),
		})),
	};
}
