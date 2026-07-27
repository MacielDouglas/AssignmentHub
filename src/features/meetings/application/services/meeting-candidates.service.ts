import type {
	MeetingAssignmentRole,
	MeetingProgramPartKind,
	Sex,
} from "@/generated/prisma/client";

import { db } from "@/lib/db";

import { getMeetingPartMeta } from "../../domain/meeting-part-meta";
import type { MeetingCandidateDto } from "../../domain/meeting-types";
import {
	compareCandidatesByHistory,
	loadCandidateHistories,
} from "./meeting-history.service";
import { toIsoDateOnly } from "./meeting-week-dates";

type LoadCandidatesInput = {
	organizationId: string;
	meetingDate: Date;
	partKind: MeetingProgramPartKind;
	role: MeetingAssignmentRole;
};

function personPassesRoleRules(input: {
	role: MeetingAssignmentRole;
	partKind: MeetingProgramPartKind;
	person: {
		sex: Sex;
		isActive: boolean;
		baptized: boolean;
		bibleReading: boolean;
		initiatingConversations: boolean;
		cultivatingInterest: boolean;
		makingDisciples: boolean;
		explainingBeliefs: boolean;
		bibleStudyReader: boolean;
		watchtowerReader: boolean;
		privilegePrayer: boolean;
		servicePrivilege: {
			lifeAndMinistryChairman: boolean;
			weekendChairman: boolean;
			treasuresFromGodsWordTalk: boolean;
			spiritualGems: boolean;
			ourChristianLifeAssignment: boolean;
			localNeeds: boolean;
			bibleStudyConductor: boolean;
			watchtowerConductor: boolean;
			publicTalk: boolean;
		} | null;
	};
}) {
	const meta = getMeetingPartMeta(input.partKind);

	if (!meta || !input.person.isActive) {
		return false;
	}

	if (meta.sex && input.person.sex !== meta.sex) {
		return false;
	}

	if (meta.requiresBaptized && !input.person.baptized) {
		return false;
	}

	if (input.role === "READER") {
		if (input.partKind === "MIDWEEK_BIBLE_STUDY") {
			return input.person.bibleStudyReader;
		}

		if (input.partKind === "WEEKEND_WATCHTOWER_STUDY") {
			return input.person.watchtowerReader;
		}

		if (input.partKind === "MIDWEEK_BIBLE_READING") {
			return input.person.bibleReading;
		}
	}

	if (meta.personFlag) {
		return Boolean(input.person[meta.personFlag]);
	}

	if (meta.privilegeFlag) {
		return Boolean(input.person.servicePrivilege?.[meta.privilegeFlag]);
	}

	return true;
}

export async function loadMeetingCandidates(
	input: LoadCandidatesInput,
): Promise<MeetingCandidateDto[]> {
	const meta = getMeetingPartMeta(input.partKind);

	if (!meta?.roles.includes(input.role)) {
		return [];
	}

	const people = await db.person.findMany({
		where: {
			organizationId: input.organizationId,
			isActive: true,
		},
		select: {
			id: true,
			name: true,
			sex: true,
			isActive: true,
			baptized: true,
			familyId: true,
			bibleReading: true,
			initiatingConversations: true,
			cultivatingInterest: true,
			makingDisciples: true,
			explainingBeliefs: true,
			bibleStudyReader: true,
			watchtowerReader: true,
			privilegePrayer: true,
			group: {
				select: {
					name: true,
				},
			},
			servicePrivilege: {
				select: {
					lifeAndMinistryChairman: true,
					weekendChairman: true,
					treasuresFromGodsWordTalk: true,
					spiritualGems: true,
					ourChristianLifeAssignment: true,
					localNeeds: true,
					bibleStudyConductor: true,
					watchtowerConductor: true,
					publicTalk: true,
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});

	const eligiblePeople = people.filter((person) =>
		personPassesRoleRules({
			role: input.role,
			partKind: input.partKind,
			person,
		}),
	);

	let subPeople: Array<{
		id: string;
		name: string;
		sex: Sex;
		subOrganization: {
			name: string;
		};
	}> = [];

	if (meta.allowSubPerson) {
		subPeople = await db.subPerson.findMany({
			where: {
				isActive: true,
				publicTalk: true,
				subOrganization: {
					organizationId: input.organizationId,
				},
			},
			select: {
				id: true,
				name: true,
				sex: true,
				subOrganization: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});
	}

	const histories = await loadCandidateHistories({
		organizationId: input.organizationId,
		meetingDate: input.meetingDate,
		partKind: input.partKind,
		role: input.role,
		personIds: eligiblePeople.map((person) => person.id),
		subPersonIds: subPeople.map((person) => person.id),
	});

	// Busca designações no mesmo dia para alerta visual
	const meetingDateStr = toIsoDateOnly(input.meetingDate);
	const sameDayAssignmentPersonIds = new Set<string>();
	const sameDayAssignmentSubPersonIds = new Set<string>();

	const meetingDate = new Date(`${meetingDateStr}T00:00:00.000Z`);
	const meetingDateEnd = new Date(`${meetingDateStr}T23:59:59.999Z`);

	const sameDayRows = await db.meetingProgramAssignment.findMany({
		where: {
			meetingProgramPart: {
				meetingProgram: {
					organizationId: input.organizationId,
					OR: [
						{ scheduledAt: { gte: meetingDate, lte: meetingDateEnd } },
						{ weekStart: meetingDate },
					],
				},
			},
			OR: [
				{
					personId: {
						in:
							eligiblePeople.length > 0
								? eligiblePeople.map((p) => p.id)
								: ["__none__"],
					},
				},
				{
					subPersonId: {
						in:
							subPeople.length > 0 ? subPeople.map((p) => p.id) : ["__none__"],
					},
				},
			],
		},
		select: {
			personId: true,
			subPersonId: true,
		},
	});

	for (const row of sameDayRows) {
		if (row.personId) sameDayAssignmentPersonIds.add(row.personId);
		if (row.subPersonId) sameDayAssignmentSubPersonIds.add(row.subPersonId);
	}

	const candidates: MeetingCandidateDto[] = [
		...eligiblePeople.map((person) => ({
			id: person.id,
			kind: "PERSON" as const,
			name: person.name,
			subtitle: person.group?.name ?? null,
			sex: person.sex,
			familyId: person.familyId,
			hasSameDayAssignment: sameDayAssignmentPersonIds.has(person.id),
			history: histories.byPersonId.get(person.id) ?? {
				lastSameKindAt: null,
				lastAnyAssignmentAt: null,
				sameKindCount: 0,
				totalCount: 0,
			},
		})),
		...subPeople.map((person) => ({
			id: person.id,
			kind: "SUB_PERSON" as const,
			name: person.name,
			subtitle: person.subOrganization.name,
			sex: person.sex,
			familyId: null,
			hasSameDayAssignment: sameDayAssignmentSubPersonIds.has(person.id),
			history: histories.bySubPersonId.get(person.id) ?? {
				lastSameKindAt: null,
				lastAnyAssignmentAt: null,
				sameKindCount: 0,
				totalCount: 0,
			},
		})),
	];

	return candidates.sort(compareCandidatesByHistory);
}
