"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireMeetingContentManage } from "@/features/meeting-content/application/services/meeting-content-auth";
import { db } from "@/lib/db";

import type { MeetingWeekDto } from "../../domain/meeting-types";
import { loadMeetingWeekQuery } from "../queries/load-meeting-week.query";

export type ActionResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

const LoadWeekSchema = z.object({
	slug: z.string().min(1),
	weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function loadMeetingWeekForModalAction(
	input: z.infer<typeof LoadWeekSchema>,
): Promise<ActionResult<MeetingWeekDto>> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = LoadWeekSchema.parse(input);

		const data = await loadMeetingWeekQuery({
			slug: parsed.slug,
			week: parsed.weekStart,
		});

		return { ok: true, data };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível carregar os dados da semana.",
		};
	}
}

const SaveBatchSchema = z.object({
	slug: z.string().min(1),
	programId: z.string().min(1),
	assignments: z.array(
		z.object({
			partId: z.string().min(1),
			role: z.enum([
				"PRIMARY",
				"ASSISTANT",
				"READER",
				"CHAIRMAN",
				"PRAYER",
				"SPEAKER",
				"CONDUCTOR",
			]),
			source: z.enum(["PERSON", "SUB_PERSON", "EXTERNAL"]),
			personId: z.string().min(1).nullable().optional(),
			subPersonId: z.string().min(1).nullable().optional(),
			externalName: z.string().trim().max(120).nullable().optional(),
		}),
	),
});

export async function saveMeetingAssignmentsBatchAction(
	input: z.infer<typeof SaveBatchSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = SaveBatchSchema.parse(input);

		const program = await db.meetingProgram.findFirst({
			where: {
				id: parsed.programId,
				organization: { slug: parsed.slug },
			},
			select: { id: true, isCancelled: true, organizationId: true },
		});

		if (!program) {
			return { ok: false, error: "Programa não encontrado." };
		}

		if (program.isCancelled) {
			return { ok: false, error: "Esta reunião está cancelada." };
		}

		await db.$transaction(async (tx) => {
			for (const assignment of parsed.assignments) {
				let assigneeNameSnapshot = "";
				let personId: string | null = null;
				let subPersonId: string | null = null;
				let externalName: string | null = null;

				if (assignment.source === "PERSON" && assignment.personId) {
					const person = await tx.person.findFirst({
						where: {
							id: assignment.personId,
							organizationId: program.organizationId,
							isActive: true,
						},
						select: { id: true, name: true },
					});
					if (person) {
						personId = person.id;
						assigneeNameSnapshot = person.name;
					}
				} else if (
					assignment.source === "SUB_PERSON" &&
					assignment.subPersonId
				) {
					const sub = await tx.subPerson.findFirst({
						where: {
							id: assignment.subPersonId,
							isActive: true,
							subOrganization: { organizationId: program.organizationId },
						},
						select: { id: true, name: true },
					});
					if (sub) {
						subPersonId = sub.id;
						assigneeNameSnapshot = sub.name;
					}
				} else if (assignment.source === "EXTERNAL") {
					const name = assignment.externalName?.trim() ?? "";
					if (name.length >= 2) {
						externalName = name;
						assigneeNameSnapshot = name;
					}
				}

				await tx.meetingProgramAssignment.deleteMany({
					where: {
						meetingProgramPartId: assignment.partId,
						role: assignment.role,
					},
				});

				if (assigneeNameSnapshot) {
					await tx.meetingProgramAssignment.create({
						data: {
							meetingProgramPartId: assignment.partId,
							role: assignment.role,
							sortOrder: 0,
							personId,
							subPersonId,
							externalName,
							assigneeNameSnapshot,
						},
					});
				}
			}
		});

		revalidatePath(`/org/${input.slug}/meetings`);

		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível salvar as designações.",
		};
	}
}

const ClearAllSchema = z.object({
	slug: z.string().min(1),
	programId: z.string().min(1),
});

export async function clearMeetingAssignmentsAction(
	input: z.infer<typeof ClearAllSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = ClearAllSchema.parse(input);

		const program = await db.meetingProgram.findFirst({
			where: {
				id: parsed.programId,
				organization: { slug: parsed.slug },
			},
			select: { id: true },
		});

		if (!program) {
			return { ok: false, error: "Programa não encontrado." };
		}

		await db.meetingProgramAssignment.deleteMany({
			where: {
				meetingProgramPart: {
					meetingProgramId: parsed.programId,
				},
			},
		});

		revalidatePath(`/org/${parsed.slug}/meetings`);

		return { ok: true, data: undefined };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível limpar as designações.",
		};
	}
}
