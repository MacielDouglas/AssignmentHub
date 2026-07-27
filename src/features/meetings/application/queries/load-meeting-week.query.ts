import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getMeetingContentAccess } from "@/features/meeting-content/application/services/meeting-content-auth";
import { db } from "@/lib/db";
import type {
	AssignmentDto,
	MeetingPartDto,
	MeetingProgramDto,
	MeetingWeekDto,
} from "../../domain/meeting-types";
import { generateMeetingProgramsForWeek } from "../services/meeting-program-generator.service";
import {
	endOfWeekSunday,
	resolveWeekStart,
	toIsoDateOnly,
} from "../services/meeting-week-dates";

type Input = {
	slug: string;
	week?: string;
};

function mapAssignment(row: {
	id: string;
	role: AssignmentDto["role"];
	sortOrder: number;
	personId: string | null;
	subPersonId: string | null;
	externalName: string | null;
	assigneeNameSnapshot: string;
}): AssignmentDto {
	const source = row.personId
		? "PERSON"
		: row.subPersonId
			? "SUB_PERSON"
			: "EXTERNAL";

	return {
		id: row.id,
		role: row.role,
		sortOrder: row.sortOrder,
		assigneeName: row.assigneeNameSnapshot,
		source,
		personId: row.personId,
		subPersonId: row.subPersonId,
		externalName: row.externalName,
	};
}

function mapProgram(row: {
	id: string;
	kind: MeetingProgramDto["kind"];
	status: MeetingProgramDto["status"];
	scheduledAt: Date | null;
	scheduledTime: string | null;
	isCancelled: boolean;
	cancellationReason: string | null;
	specialEventTitle: string | null;
	specialEventDate: Date | null;
	specialEventTime: string | null;
	specialEventLocation: string | null;
	specialEventNotes: string | null;
	parts: Array<{
		id: string;
		kind: MeetingPartDto["kind"];
		sectionCode: MeetingPartDto["sectionCode"];
		sortOrder: number;
		title: string;
		theme: string | null;
		durationMin: number | null;
		modality: string | null;
		source: string | null;
		songNumber: number | null;
		songTitle: string | null;
		customTitle: string | null;
		isDisabled: boolean;
		assignments: Array<{
			id: string;
			role: AssignmentDto["role"];
			sortOrder: number;
			personId: string | null;
			subPersonId: string | null;
			externalName: string | null;
			assigneeNameSnapshot: string;
		}>;
	}>;
}): MeetingProgramDto {
	return {
		id: row.id,
		kind: row.kind,
		status: row.status,
		scheduledAt: row.scheduledAt ? toIsoDateOnly(row.scheduledAt) : null,
		scheduledTime: row.scheduledTime,
		isCancelled: row.isCancelled,
		cancellationReason: row.cancellationReason,
		specialEventTitle: row.specialEventTitle,
		specialEventDate: row.specialEventDate
			? toIsoDateOnly(row.specialEventDate)
			: null,
		specialEventTime: row.specialEventTime,
		specialEventLocation: row.specialEventLocation,
		specialEventNotes: row.specialEventNotes,
		parts: row.parts
			.slice()
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((part) => ({
				id: part.id,
				kind: part.kind,
				sectionCode: part.sectionCode,
				sortOrder: part.sortOrder,
				title: part.title,
				theme: part.theme,
				durationMin: part.durationMin,
				modality: part.modality,
				source: part.source,
				songNumber: part.songNumber,
				songTitle: part.songTitle,
				customTitle: part.customTitle,
				isDisabled: part.isDisabled,
				assignments: part.assignments
					.slice()
					.sort((a, b) => a.sortOrder - b.sortOrder)
					.map(mapAssignment),
			})),
	};
}

export async function loadMeetingWeekQuery(
	input: Input,
): Promise<MeetingWeekDto> {
	const access = await getMeetingContentAccess(input.slug);

	if (!access) {
		notFound();
	}

	const organization = await db.organization.findUnique({
		where: {
			slug: input.slug,
		},
		select: {
			id: true,
			name: true,
			slug: true,
		},
	});

	if (!organization) {
		notFound();
	}

	const localeRaw = await getLocale();
	const locale = localeRaw === "es" ? "es" : "pt";
	const weekStart = resolveWeekStart(input.week);
	const weekEnd = endOfWeekSunday(weekStart);

	const existingCount = await db.meetingProgram.count({
		where: {
			organizationId: organization.id,
			weekStart,
			kind: { in: ["MIDWEEK", "WEEKEND"] },
		},
	});

	if (existingCount < 2) {
		await generateMeetingProgramsForWeek({
			organizationId: organization.id,
			weekStart,
			locale,
		});
	}

	const programs = await db.meetingProgram.findMany({
		where: {
			organizationId: organization.id,
			weekStart,
			kind: {
				in: ["MIDWEEK", "WEEKEND"],
			},
		},
		include: {
			parts: {
				orderBy: {
					sortOrder: "asc",
				},
				include: {
					assignments: {
						orderBy: {
							sortOrder: "asc",
						},
					},
				},
			},
		},
	});

	const midweek = programs.find((program) => program.kind === "MIDWEEK");
	const weekend = programs.find((program) => program.kind === "WEEKEND");

	if (!midweek || !weekend) {
		throw new Error("Não foi possível gerar os programas da semana.");
	}

	return {
		organizationName: organization.name,
		organizationSlug: organization.slug,
		weekStart: toIsoDateOnly(weekStart),
		weekEnd: toIsoDateOnly(weekEnd),
		locale,
		canManage: access.canManage,
		midweek: mapProgram(midweek),
		weekend: mapProgram(weekend),
	};
}
