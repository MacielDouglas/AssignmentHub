// src/features/cleaning-list/lib/get-cleaning-rotation-map.ts
import type { CleaningType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

type Input = {
	organizationId: string;
	cleaningType: CleaningType;
};

export type RotationEntry = {
	personId: string;
	lastAssignedAtByType: Date | null;
	lastAssignedAtOverall: Date | null;
};

export async function getCleaningRotationMap({
	organizationId,
	cleaningType,
}: Input) {
	const [byType, overall] = await Promise.all([
		db.cleaningAssignmentSectorAssignment.findMany({
			where: {
				assignmentDate: {
					list: { organizationId, cleaningType, status: "SAVED" },
				},
			},
			orderBy: { assignmentDate: { date: "desc" } },
			select: {
				personId: true,
				assignmentDate: { select: { date: true } },
			},
		}),
		db.cleaningAssignmentSectorAssignment.findMany({
			where: {
				assignmentDate: {
					list: { organizationId, status: "SAVED" },
				},
			},
			orderBy: { assignmentDate: { date: "desc" } },
			select: {
				personId: true,
				assignmentDate: { select: { date: true } },
			},
		}),
	]);

	const map = new Map<string, RotationEntry>();

	for (const item of overall) {
		if (!map.has(item.personId)) {
			map.set(item.personId, {
				personId: item.personId,
				lastAssignedAtByType: null,
				lastAssignedAtOverall: item.assignmentDate.date,
			});
		}
	}

	for (const item of byType) {
		const current = map.get(item.personId);
		if (!current) {
			map.set(item.personId, {
				personId: item.personId,
				lastAssignedAtByType: item.assignmentDate.date,
				lastAssignedAtOverall: null,
			});
			continue;
		}
		if (!current.lastAssignedAtByType) {
			current.lastAssignedAtByType = item.assignmentDate.date;
		}
	}

	return map;
}
