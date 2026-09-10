"use server";

import { z } from "zod";
import { loadMeetingWeekQuery } from "@/features/meetings/application/queries/load-meeting-week.query";
import {
	addDays,
	parseIsoDateOnly,
	startOfWeekMonday,
	toIsoDateOnly,
} from "@/features/meetings/application/services/meeting-week-dates";
import type { MeetingProgramDto } from "@/features/meetings/domain/meeting-types";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";
import { collectDutyConflicts } from "../lib/duty-conflicts";
import type {
	DutyMeetingDraft,
	DutyMeetingKind,
	DutyPerson,
	DutyRosterDraft,
	DutySectorKey,
	DutySideKey,
	DutySlotDraft,
} from "../lib/duty-types";

const InputSchema = z.object({
	slug: z.string().min(1),
	from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type GenerateDutyResult =
	| { ok: true; draft: DutyRosterDraft }
	| { ok: false; error: string };

type SlotSpec = {
	sector: DutySectorKey;
	postLabel: string;
	side: DutySideKey | null;
	position: number;
};

function buildSlots(input: {
	indicatorActive: boolean;
	indicatorCount: number;
	indicatorSectors: string[];
	micActive: boolean;
	micCount: number;
	soundActive: boolean;
	videoActive: boolean;
	stageActive: boolean;
}): SlotSpec[] {
	const slots: SlotSpec[] = [];

	if (input.indicatorActive) {
		for (let i = 0; i < input.indicatorCount; i += 1) {
			slots.push({
				sector: "indicator",
				postLabel: input.indicatorSectors[i] ?? "",
				side: i % 2 === 0 ? "interno" : "externo",
				position: i,
			});
		}
	}

	if (input.micActive) {
		for (let i = 0; i < input.micCount; i += 1) {
			slots.push({ sector: "mic", postLabel: "", side: null, position: i });
		}
	}

	if (input.soundActive) {
		slots.push({ sector: "sound", postLabel: "", side: null, position: 0 });
	}

	if (input.videoActive) {
		slots.push({ sector: "video", postLabel: "", side: null, position: 0 });
	}

	if (input.stageActive) {
		slots.push({ sector: "stage", postLabel: "", side: null, position: 0 });
	}

	return slots;
}

export async function generateDutyRosterAction(
	input: z.infer<typeof InputSchema>,
): Promise<GenerateDutyResult> {
	try {
		const parsed = InputSchema.parse(input);
		const authz = await requireSettingsManager(parsed.slug);

		if (!authz.ok) {
			return { ok: false, error: authz.message };
		}

		const organizationId = authz.organization.id;
		const fromDate = parseIsoDateOnly(parsed.from);
		const toDate = parseIsoDateOnly(parsed.to);

		if (fromDate.getTime() > toDate.getTime()) {
			return { ok: false, error: "Período inválido." };
		}

		const rangeDays = Math.round(
			(toDate.getTime() - fromDate.getTime()) / 86_400_000,
		);

		if (rangeDays > 366) {
			return { ok: false, error: "Período máximo de 366 dias." };
		}

		const settings = await db.meetingDutySettings.findUnique({
			where: { organizationId },
		});

		const slotSpecs = buildSlots({
			indicatorActive: settings?.indicatorActive ?? false,
			indicatorCount: settings?.indicatorCount ?? 0,
			indicatorSectors: settings?.indicatorSectors ?? [],
			micActive: settings?.micActive ?? false,
			micCount: settings?.micCount ?? 0,
			soundActive: settings?.soundActive ?? false,
			videoActive: settings?.videoActive ?? false,
			stageActive: settings?.stageActive ?? false,
		});

		if (slotSpecs.length === 0) {
			return { ok: false, error: "Nenhum setor ativo nas configurações." };
		}

		const personRows = await db.person.findMany({
			where: {
				organizationId,
				isActive: true,
				sex: "MALE",
			},
			select: {
				id: true,
				name: true,
				attendant: true,
				roamingMic: true,
				sound: true,
				video: true,
				stage: true,
			},
			orderBy: { name: "asc" },
		});

		const people: DutyPerson[] = personRows.map((person) => ({
			id: person.id,
			name: person.name,
			indicator: person.attendant,
			mic: person.roamingMic,
			sound: person.sound,
			video: person.video,
			stage: person.stage,
		}));

		const historyRows = await db.meetingDutyAssignment.findMany({
			where: {
				personId: { not: null },
				dutyDate: {
					list: { organizationId },
					date: { lt: fromDate },
				},
			},
			select: {
				personId: true,
				dutyDate: { select: { date: true } },
			},
			orderBy: { dutyDate: { date: "desc" } },
			take: 5000,
		});

		const pastTotals = new Map<string, number>();
		const pastLast = new Map<string, number>();

		for (const row of historyRows) {
			if (!row.personId) {
				continue;
			}

			pastTotals.set(row.personId, (pastTotals.get(row.personId) ?? 0) + 1);

			if (!pastLast.has(row.personId)) {
				pastLast.set(row.personId, row.dutyDate.date.getTime());
			}
		}

		type CollectedMeeting = {
			date: string;
			kind: DutyMeetingKind;
			program: MeetingProgramDto;
		};

		const collected: CollectedMeeting[] = [];
		let weekStart = startOfWeekMonday(fromDate);

		while (weekStart.getTime() <= toDate.getTime()) {
			const week = await loadMeetingWeekQuery({
				slug: parsed.slug,
				week: toIsoDateOnly(weekStart),
			});

			const candidates: Array<{
				kind: DutyMeetingKind;
				program: MeetingProgramDto;
			}> = [
				{ kind: "MIDWEEK", program: week.midweek },
				{ kind: "WEEKEND", program: week.weekend },
			];

			for (const candidate of candidates) {
				if (!candidate.program.scheduledAt || candidate.program.isCancelled) {
					continue;
				}

				const date = candidate.program.scheduledAt;

				if (date < parsed.from || date > parsed.to) {
					continue;
				}

				collected.push({
					date,
					kind: candidate.kind,
					program: candidate.program,
				});
			}

			weekStart = addDays(weekStart, 7);
		}

		collected.sort((a, b) => a.date.localeCompare(b.date));

		if (collected.length === 0) {
			return {
				ok: false,
				error: "Nenhuma reunião no período.",
			};
		}

		const draftTotals = new Map<string, number>();
		const meetings: DutyMeetingDraft[] = [];

		for (const meeting of collected) {
			const conflicts = collectDutyConflicts(meeting.program, meeting.kind);
			const { excludedAll, excludedMic } = conflicts;
			const usedInMeeting = new Set<string>();
			const slots: DutySlotDraft[] = [];

			for (const spec of slotSpecs) {
				const candidates = people
					.filter((person) => person[spec.sector])
					.filter((person) => !usedInMeeting.has(person.id))
					.filter((person) => !excludedAll.has(person.id))
					.filter(
						(person) => spec.sector !== "mic" || !excludedMic.has(person.id),
					)
					.sort((a, b) => {
						const totalA =
							(pastTotals.get(a.id) ?? 0) + (draftTotals.get(a.id) ?? 0);
						const totalB =
							(pastTotals.get(b.id) ?? 0) + (draftTotals.get(b.id) ?? 0);

						if (totalA !== totalB) {
							return totalA - totalB;
						}

						const lastA = pastLast.get(a.id) ?? -1;
						const lastB = pastLast.get(b.id) ?? -1;

						if (lastA !== lastB) {
							return lastA - lastB;
						}

						return a.name.localeCompare(b.name);
					});

				const picked = candidates[0] ?? null;

				if (picked) {
					usedInMeeting.add(picked.id);
					draftTotals.set(picked.id, (draftTotals.get(picked.id) ?? 0) + 1);
				}

				slots.push({
					key: `${meeting.date}:${meeting.kind}:${spec.sector}:${spec.postLabel}:${spec.position}`,
					sector: spec.sector,
					postLabel: spec.postLabel,
					side: spec.side,
					position: spec.position,
					personId: picked?.id ?? null,
					personName: picked?.name ?? "",
					isManual: false,
				});
			}

			meetings.push({
				date: meeting.date,
				kind: meeting.kind,
				excludedAll: [...excludedAll],
				excludedMic: [...excludedMic],
				keyPeople: conflicts.keyPeople,
				conflictRoles: conflicts.conflictRoles,
				slots,
			});
		}

		return {
			ok: true,
			draft: {
				periodFrom: parsed.from,
				periodTo: parsed.to,
				meetings,
				people,
			},
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "Falha ao gerar designações.",
		};
	}
}
