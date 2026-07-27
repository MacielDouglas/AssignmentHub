import type {
	MeetingAssignmentRole,
	MeetingProgramPartKind,
} from "@/generated/prisma/client";

import { db } from "@/lib/db";

import type { CandidateHistoryDto } from "../../domain/meeting-types";
import {
	startOfPreviousTwelveMonths,
	toIsoDateOnly,
} from "./meeting-week-dates";

type HistoryInput = {
	organizationId: string;
	meetingDate: Date;
	partKind: MeetingProgramPartKind;
	role: MeetingAssignmentRole;
	personIds: string[];
	subPersonIds: string[];
};

function emptyHistory(): CandidateHistoryDto {
	return {
		lastSameKindAt: null,
		lastAnyAssignmentAt: null,
		sameKindCount: 0,
		totalCount: 0,
	};
}

export async function loadCandidateHistories(input: HistoryInput): Promise<{
	byPersonId: Map<string, CandidateHistoryDto>;
	bySubPersonId: Map<string, CandidateHistoryDto>;
}> {
	const historyFrom = startOfPreviousTwelveMonths(input.meetingDate);

	const rows = await db.meetingProgramAssignment.findMany({
		where: {
			meetingProgramPart: {
				kind: {
					not: undefined,
				},
				meetingProgram: {
					organizationId: input.organizationId,
					OR: [
						{
							scheduledAt: {
								gte: historyFrom,
								lt: input.meetingDate,
							},
						},
						{
							scheduledAt: null,
							weekStart: {
								gte: historyFrom,
								lt: input.meetingDate,
							},
						},
					],
				},
			},
			OR: [
				{
					personId: {
						in: input.personIds.length > 0 ? input.personIds : ["__none__"],
					},
				},
				{
					subPersonId: {
						in:
							input.subPersonIds.length > 0 ? input.subPersonIds : ["__none__"],
					},
				},
			],
		},
		select: {
			personId: true,
			subPersonId: true,
			role: true,
			meetingProgramPart: {
				select: {
					kind: true,
					meetingProgram: {
						select: {
							scheduledAt: true,
							weekStart: true,
						},
					},
				},
			},
		},
	});

	const byPersonId = new Map<string, CandidateHistoryDto>();
	const bySubPersonId = new Map<string, CandidateHistoryDto>();

	for (const id of input.personIds) {
		byPersonId.set(id, emptyHistory());
	}

	for (const id of input.subPersonIds) {
		bySubPersonId.set(id, emptyHistory());
	}

	for (const row of rows) {
		const meetingDate =
			row.meetingProgramPart.meetingProgram.scheduledAt ??
			row.meetingProgramPart.meetingProgram.weekStart;

		const iso = toIsoDateOnly(meetingDate);
		const isSameKind =
			row.meetingProgramPart.kind === input.partKind && row.role === input.role;

		const target =
			(row.personId && byPersonId.get(row.personId)) ||
			(row.subPersonId && bySubPersonId.get(row.subPersonId)) ||
			null;

		if (!target) {
			continue;
		}

		target.totalCount += 1;

		if (!target.lastAnyAssignmentAt || iso > target.lastAnyAssignmentAt) {
			target.lastAnyAssignmentAt = iso;
		}

		if (isSameKind) {
			target.sameKindCount += 1;

			if (!target.lastSameKindAt || iso > target.lastSameKindAt) {
				target.lastSameKindAt = iso;
			}
		}
	}

	return {
		byPersonId,
		bySubPersonId,
	};
}

export function compareCandidatesByHistory(
	a: { name: string; history: CandidateHistoryDto },
	b: { name: string; history: CandidateHistoryDto },
) {
	const aNever = a.history.lastSameKindAt === null ? 0 : 1;
	const bNever = b.history.lastSameKindAt === null ? 0 : 1;

	if (aNever !== bNever) {
		return aNever - bNever;
	}

	if (a.history.lastSameKindAt && b.history.lastSameKindAt) {
		const sameKindDiff = a.history.lastSameKindAt.localeCompare(
			b.history.lastSameKindAt,
		);

		if (sameKindDiff !== 0) {
			return sameKindDiff;
		}
	}

	const aAny = a.history.lastAnyAssignmentAt ?? "0000-01-01";
	const bAny = b.history.lastAnyAssignmentAt ?? "0000-01-01";
	const anyDiff = aAny.localeCompare(bAny);

	if (anyDiff !== 0) {
		return anyDiff;
	}

	return a.name.localeCompare(b.name, "pt");
}
