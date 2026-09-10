"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";
import { toDbSector, toDbSide } from "../lib/duty-types";

const SlotSchema = z.object({
	sector: z.enum(["indicator", "mic", "sound", "video", "stage"]),
	postLabel: z.string().trim().max(80).default(""),
	side: z.enum(["externo", "interno"]).nullable().default(null),
	position: z.number().int().min(0).max(50).default(0),
	personId: z.string().min(1).nullable().default(null),
	isManual: z.boolean().default(false),
});

const MeetingSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	kind: z.enum(["MIDWEEK", "WEEKEND"]),
	slots: z.array(SlotSchema).max(60),
});

const SaveSchema = z.object({
	slug: z.string().min(1),
	listId: z.string().min(1).nullable().default(null),
	periodFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	periodTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	meetings: z.array(MeetingSchema).min(1).max(100),
});

export type SaveDutyListResult =
	| { ok: true; listId: string }
	| { ok: false; error: string };

export async function saveDutyListAction(
	input: z.infer<typeof SaveSchema>,
): Promise<SaveDutyListResult> {
	try {
		const parsed = SaveSchema.parse(input);
		const authz = await requireSettingsManager(parsed.slug);

		if (!authz.ok) {
			return { ok: false, error: authz.message };
		}

		const organizationId = authz.organization.id;

		if (parsed.periodFrom > parsed.periodTo) {
			return { ok: false, error: "Período inválido." };
		}

		const personIds = new Set(
			parsed.meetings.flatMap((meeting) =>
				meeting.slots.flatMap((slot) => (slot.personId ? [slot.personId] : [])),
			),
		);

		if (personIds.size > 0) {
			const existing = await db.person.findMany({
				where: {
					id: { in: [...personIds] },
					organizationId,
					isActive: true,
				},
				select: { id: true },
			});

			if (existing.length !== personIds.size) {
				return { ok: false, error: "Pessoa inválida na programação." };
			}
		}

		const incomingKeys = new Set(
			parsed.meetings.map((meeting) => `${meeting.date}:${meeting.kind}`),
		);

		const takenDates = await db.meetingDutyDate.findMany({
			where: {
				list: {
					organizationId,
					...(parsed.listId ? { id: { not: parsed.listId } } : {}),
				},
				date: {
					in: [...incomingKeys].map(
						(key) => new Date(`${key.split(":")[0]}T12:00:00.000Z`),
					),
				},
			},
			select: { date: true, meetingKind: true },
		});

		const takenKeys = takenDates.filter((taken) =>
			incomingKeys.has(
				`${taken.date.toISOString().slice(0, 10)}:${taken.meetingKind}`,
			),
		);

		if (takenKeys.length > 0) {
			const takenLabels = takenKeys
				.map((taken) =>
					taken.date.toISOString().slice(0, 10).split("-").reverse().join("/"),
				)
				.join(", ");

			return {
				ok: false,
				error: `Data(s) já utilizada(s) em outro programa: ${takenLabels}. Edite ou exclua a data no programa existente.`,
			};
		}

		const fromDate = new Date(`${parsed.periodFrom}T12:00:00.000Z`);
		const toDate = new Date(`${parsed.periodTo}T12:00:00.000Z`);

		const listId = await db.$transaction(async (tx) => {
			let list: { id: string };

			if (parsed.listId) {
				const owned = await tx.meetingDutyList.findFirst({
					where: { id: parsed.listId, organizationId },
					select: { id: true },
				});

				if (!owned) {
					throw new Error("Programa não encontrado.");
				}

				await tx.meetingDutyDate.deleteMany({
					where: { listId: parsed.listId },
				});

				list = await tx.meetingDutyList.update({
					where: { id: parsed.listId },
					data: { periodFrom: fromDate, periodTo: toDate },
					select: { id: true },
				});
			} else {
				list = await tx.meetingDutyList.create({
					data: {
						organizationId,
						periodFrom: fromDate,
						periodTo: toDate,
					},
					select: { id: true },
				});
			}

			for (const meeting of parsed.meetings) {
				const dutyDate = await tx.meetingDutyDate.create({
					data: {
						listId: list.id,
						date: new Date(`${meeting.date}T12:00:00.000Z`),
						meetingKind: meeting.kind,
					},
					select: { id: true },
				});

				if (meeting.slots.length > 0) {
					await tx.meetingDutyAssignment.createMany({
						data: meeting.slots.map((slot) => ({
							dutyDateId: dutyDate.id,
							sector: toDbSector(slot.sector),
							postLabel: slot.postLabel,
							side:
								slot.sector === "indicator"
									? (toDbSide(slot.side) ?? "EXTERNO")
									: null,
							position: slot.position,
							personId: slot.personId,
							isManual: slot.isManual,
						})),
					});
				}
			}

			return list.id;
		});

		revalidatePath(`/org/${authz.organization.slug}/duties`);

		return { ok: true, listId };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "Falha ao salvar o programa.",
		};
	}
}
