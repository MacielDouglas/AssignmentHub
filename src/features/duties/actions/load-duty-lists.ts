"use server";

import { z } from "zod";
import { requireOrgMember } from "@/features/cleaning/lib/require-org-member";
import { loadMeetingWeekQuery } from "@/features/meetings/application/queries/load-meeting-week.query";
import {
	startOfWeekMonday,
	toIsoDateOnly,
} from "@/features/meetings/application/services/meeting-week-dates";
import { db } from "@/lib/db";
import { collectDutyConflicts } from "../lib/duty-conflicts";
import type {
	DutyMeetingDraft,
	DutyMeetingKind,
	DutySlotDraft,
} from "../lib/duty-types";
import { fromDbSector, fromDbSide } from "../lib/duty-types";

const SlugSchema = z.object({ slug: z.string().min(1) });

export type DutyListSummary = {
	id: string;
	periodFrom: string;
	periodTo: string;
	meetingsCount: number;
};

export async function listDutyListsAction(
	input: z.infer<typeof SlugSchema>,
): Promise<
	{ ok: true; lists: DutyListSummary[] } | { ok: false; error: string }
> {
	try {
		const parsed = SlugSchema.parse(input);
		const access = await requireOrgMember(parsed.slug);

		if (!access.ok) {
			return { ok: false, error: access.message };
		}

		const lists = await db.meetingDutyList.findMany({
			where: { organizationId: access.organization.id },
			orderBy: { periodFrom: "desc" },
			take: 50,
			select: {
				id: true,
				periodFrom: true,
				periodTo: true,
				_count: { select: { dates: true } },
			},
		});

		return {
			ok: true,
			lists: lists.map((list) => ({
				id: list.id,
				periodFrom: toIsoDateOnly(list.periodFrom),
				periodTo: toIsoDateOnly(list.periodTo),
				meetingsCount: list._count.dates,
			})),
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "Falha ao carregar programas.",
		};
	}
}

const DetailSchema = z.object({
	slug: z.string().min(1),
	listId: z.string().min(1),
});

export type DutyListDetail = {
	id: string;
	periodFrom: string;
	periodTo: string;
	meetings: DutyMeetingDraft[];
};

export async function getDutyListDetailAction(
	input: z.infer<typeof DetailSchema>,
): Promise<
	{ ok: true; detail: DutyListDetail } | { ok: false; error: string }
> {
	try {
		const parsed = DetailSchema.parse(input);
		const access = await requireOrgMember(parsed.slug);

		if (!access.ok) {
			return { ok: false, error: access.message };
		}

		const list = await db.meetingDutyList.findFirst({
			where: { id: parsed.listId, organizationId: access.organization.id },
			include: {
				dates: {
					orderBy: { date: "asc" },
					include: {
						assignments: {
							orderBy: [{ sector: "asc" }, { position: "asc" }],
							include: {
								person: { select: { id: true, name: true } },
							},
						},
					},
				},
			},
		});

		if (!list) {
			return { ok: false, error: "Programa não encontrado." };
		}

		const weekCache = new Map<
			string,
			Awaited<ReturnType<typeof loadMeetingWeekQuery>>
		>();

		async function conflictsFor(date: string, kind: DutyMeetingKind) {
			try {
				const monday = toIsoDateOnly(
					startOfWeekMonday(new Date(`${date}T12:00:00.000Z`)),
				);
				let week = weekCache.get(monday);

				if (!week) {
					week = await loadMeetingWeekQuery({
						slug: parsed.slug,
						week: monday,
					});
					weekCache.set(monday, week);
				}

				const program = kind === "MIDWEEK" ? week.midweek : week.weekend;
				const conflicts = collectDutyConflicts(program, kind);

				return {
					excludedAll: [...conflicts.excludedAll],
					excludedMic: [...conflicts.excludedMic],
					keyPeople: conflicts.keyPeople,
					conflictRoles: conflicts.conflictRoles,
				};
			} catch {
				return {
					excludedAll: [],
					excludedMic: [],
					keyPeople: [],
					conflictRoles: [],
				};
			}
		}

		const meetings: DutyMeetingDraft[] = [];

		for (const dutyDate of list.dates) {
			const date = toIsoDateOnly(dutyDate.date);
			const kind = dutyDate.meetingKind as DutyMeetingKind;
			const conflicts = await conflictsFor(date, kind);

			const slots: DutySlotDraft[] = dutyDate.assignments.map((assignment) => ({
				key: assignment.id,
				sector: fromDbSector(assignment.sector),
				postLabel: assignment.postLabel,
				side: fromDbSide(assignment.side),
				position: assignment.position,
				personId: assignment.personId,
				personName: assignment.person?.name ?? "",
				isManual: assignment.isManual,
			}));

			meetings.push({
				date,
				kind,
				excludedAll: conflicts.excludedAll,
				excludedMic: conflicts.excludedMic,
				keyPeople: conflicts.keyPeople,
				conflictRoles: conflicts.conflictRoles,
				slots,
			});
		}

		return {
			ok: true,
			detail: {
				id: list.id,
				periodFrom: toIsoDateOnly(list.periodFrom),
				periodTo: toIsoDateOnly(list.periodTo),
				meetings,
			},
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "Falha ao carregar programa.",
		};
	}
}
