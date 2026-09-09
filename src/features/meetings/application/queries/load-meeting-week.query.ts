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
import { resolveOrganizationWeekSchedule } from "../services/meeting-schedule.service";
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
	sourceWatchtowerStudy: {
		id: string;
		highlightColor: string | null;
	} | null;
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
	const watchtowerColor = row.sourceWatchtowerStudy?.highlightColor ?? null;

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
				highlightColor:
					part.kind === "WEEKEND_WATCHTOWER_STUDY" ? watchtowerColor : null,
				assignments: part.assignments
					.slice()
					.sort((a, b) => a.sortOrder - b.sortOrder)
					.map(mapAssignment),
			})),
	};
}

function dateAtTimeUtc(date: Date, time: string | null): Date | null {
	if (!time) {
		return null;
	}

	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

	if (!match) {
		return null;
	}

	const result = new Date(date);
	result.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);

	return result;
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

	let programs = await db.meetingProgram.findMany({
		where: {
			organizationId: organization.id,
			weekStart,
			kind: {
				in: ["MIDWEEK", "WEEKEND"],
			},
		},
		include: {
			sourceMwbWeek: {
				select: { id: true },
			},
			sourceWatchtowerStudy: {
				select: {
					id: true,
					highlightColor: true,
				},
			},
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

	if (!midweek.sourceMwbWeek) {
		await generateMeetingProgramsForWeek({
			organizationId: organization.id,
			weekStart,
			locale,
		});

		programs = await db.meetingProgram.findMany({
			where: {
				organizationId: organization.id,
				weekStart,
				kind: {
					in: ["MIDWEEK", "WEEKEND"],
				},
			},
			include: {
				sourceMwbWeek: {
					select: { id: true },
				},
				sourceWatchtowerStudy: {
					select: {
						id: true,
						highlightColor: true,
					},
				},
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
	}

	const finalMidweek = programs.find((program) => program.kind === "MIDWEEK");
	const finalWeekend = programs.find((program) => program.kind === "WEEKEND");

	if (!finalMidweek || !finalWeekend) {
		throw new Error("Não foi possível gerar os programas da semana.");
	}

	// Ressincroniza scheduledAt/scheduledTime com a configuração vigente.
	// Programas gerados antes de uma troca de dia (ex: quarta → quinta)
	// manteriam a data antiga e o PDF listaria o dia errado. Atualiza só as
	// colunas de agendamento para não apagar as designações existentes.
	const schedule = await resolveOrganizationWeekSchedule(
		organization.id,
		weekStart,
	);

	const resync: Array<Promise<unknown>> = [];

	if (schedule.midweek) {
		const expectedAt = dateAtTimeUtc(
			schedule.midweek.date,
			schedule.midweek.time,
		);

		if (
			expectedAt &&
			(finalMidweek.scheduledAt?.getTime() !== expectedAt.getTime() ||
				finalMidweek.scheduledTime !== schedule.midweek.time)
		) {
			resync.push(
				db.meetingProgram.update({
					where: { id: finalMidweek.id },
					data: {
						scheduledAt: expectedAt,
						scheduledTime: schedule.midweek.time,
					},
				}),
			);
			finalMidweek.scheduledAt = expectedAt;
			finalMidweek.scheduledTime = schedule.midweek.time;
		}
	}

	if (schedule.weekend) {
		const expectedAt = dateAtTimeUtc(
			schedule.weekend.date,
			schedule.weekend.time,
		);

		if (
			expectedAt &&
			(finalWeekend.scheduledAt?.getTime() !== expectedAt.getTime() ||
				finalWeekend.scheduledTime !== schedule.weekend.time)
		) {
			resync.push(
				db.meetingProgram.update({
					where: { id: finalWeekend.id },
					data: {
						scheduledAt: expectedAt,
						scheduledTime: schedule.weekend.time,
					},
				}),
			);
			finalWeekend.scheduledAt = expectedAt;
			finalWeekend.scheduledTime = schedule.weekend.time;
		}
	}

	await Promise.all(resync);

	return {
		organizationName: organization.name,
		organizationSlug: organization.slug,
		weekStart: toIsoDateOnly(weekStart),
		weekEnd: toIsoDateOnly(weekEnd),
		locale,
		canManage: access.canManage,
		midweek: mapProgram(finalMidweek),
		weekend: mapProgram(finalWeekend),
	};
}
