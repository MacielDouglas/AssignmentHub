"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireMeetingContentManage } from "@/features/meeting-content/application/services/meeting-content-auth";
import { db } from "@/lib/db";

import { getMeetingPartMeta } from "../../domain/meeting-part-meta";
import type { AssignmentDialogDataDto } from "../../domain/meeting-types";
import { loadMeetingCandidates } from "../services/meeting-candidates.service";
import { toIsoDateOnly } from "../services/meeting-week-dates";

export type ActionResult<T = void> =
	| {
			ok: true;
			data: T;
	  }
	| {
			ok: false;
			error: string;
	  };

const LoadDialogSchema = z.object({
	slug: z.string().min(1),
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
});

const SaveAssignmentSchema = z.object({
	slug: z.string().min(1),
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
});

const ClearAssignmentSchema = z.object({
	slug: z.string().min(1),
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
});

function revalidateMeetings(slug: string) {
	revalidatePath(`/org/${slug}/meetings`);
}

export async function loadAssignmentDialogAction(
	input: z.infer<typeof LoadDialogSchema>,
): Promise<ActionResult<AssignmentDialogDataDto>> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = LoadDialogSchema.parse(input);

		const part = await db.meetingProgramPart.findFirst({
			where: {
				id: parsed.partId,
				meetingProgram: {
					organization: {
						slug: parsed.slug,
					},
				},
			},
			include: {
				meetingProgram: {
					select: {
						organizationId: true,
						scheduledAt: true,
						weekStart: true,
						isCancelled: true,
					},
				},
			},
		});

		if (!part) {
			return {
				ok: false,
				error: "Parte da reunião não encontrada.",
			};
		}

		if (part.isDisabled || part.meetingProgram.isCancelled) {
			return {
				ok: false,
				error: "Esta parte não está disponível para designação.",
			};
		}

		const meta = getMeetingPartMeta(part.kind);

		if (!meta?.roles.includes(parsed.role)) {
			return {
				ok: false,
				error: "Papel inválido para esta parte.",
			};
		}

		const meetingDate =
			part.meetingProgram.scheduledAt ?? part.meetingProgram.weekStart;

		const candidates = await loadMeetingCandidates({
			organizationId: part.meetingProgram.organizationId,
			meetingDate,
			partKind: part.kind,
			role: parsed.role,
		});

		return {
			ok: true,
			data: {
				partId: part.id,
				partKind: part.kind,
				title: part.title,
				roles: meta.roles,
				candidates,
				canUseExternalName: Boolean(meta.allowExternalName),
			},
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível carregar os candidatos.",
		};
	}
}

export async function saveMeetingAssignmentAction(
	input: z.infer<typeof SaveAssignmentSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = SaveAssignmentSchema.parse(input);
		const metaPart = await db.meetingProgramPart.findFirst({
			where: {
				id: parsed.partId,
				meetingProgram: {
					organization: {
						slug: parsed.slug,
					},
				},
			},
			include: {
				meetingProgram: {
					select: {
						organizationId: true,
						isCancelled: true,
					},
				},
			},
		});

		if (!metaPart) {
			return {
				ok: false,
				error: "Parte da reunião não encontrada.",
			};
		}

		if (metaPart.isDisabled || metaPart.meetingProgram.isCancelled) {
			return {
				ok: false,
				error: "Esta parte não está disponível para designação.",
			};
		}

		const meta = getMeetingPartMeta(metaPart.kind);

		if (!meta?.roles.includes(parsed.role)) {
			return {
				ok: false,
				error: "Papel inválido para esta parte.",
			};
		}

		let assigneeNameSnapshot = "";
		let personId: string | null = null;
		let subPersonId: string | null = null;
		let externalName: string | null = null;

		if (parsed.source === "PERSON") {
			if (!parsed.personId) {
				return {
					ok: false,
					error: "Selecione uma pessoa.",
				};
			}

			const person = await db.person.findFirst({
				where: {
					id: parsed.personId,
					organizationId: metaPart.meetingProgram.organizationId,
					isActive: true,
				},
				select: {
					id: true,
					name: true,
				},
			});

			if (!person) {
				return {
					ok: false,
					error: "Pessoa não encontrada.",
				};
			}

			personId = person.id;
			assigneeNameSnapshot = person.name;
		} else if (parsed.source === "SUB_PERSON") {
			if (!meta.allowSubPerson || !parsed.subPersonId) {
				return {
					ok: false,
					error: "Visitante inválido para esta parte.",
				};
			}

			const subPerson = await db.subPerson.findFirst({
				where: {
					id: parsed.subPersonId,
					isActive: true,
					subOrganization: {
						organizationId: metaPart.meetingProgram.organizationId,
					},
				},
				select: {
					id: true,
					name: true,
				},
			});

			if (!subPerson) {
				return {
					ok: false,
					error: "Visitante não encontrado.",
				};
			}

			subPersonId = subPerson.id;
			assigneeNameSnapshot = subPerson.name;
		} else {
			if (!meta.allowExternalName) {
				return {
					ok: false,
					error: "Nome manual não é permitido nesta parte.",
				};
			}

			const name = parsed.externalName?.trim() ?? "";

			if (name.length < 2) {
				return {
					ok: false,
					error: "Informe um nome válido.",
				};
			}

			externalName = name;
			assigneeNameSnapshot = name;
		}

		await db.$transaction(async (tx) => {
			await tx.meetingProgramAssignment.deleteMany({
				where: {
					meetingProgramPartId: parsed.partId,
					role: parsed.role,
				},
			});

			await tx.meetingProgramAssignment.create({
				data: {
					meetingProgramPartId: parsed.partId,
					role: parsed.role,
					sortOrder: 0,
					personId,
					subPersonId,
					externalName,
					assigneeNameSnapshot,
				},
			});
		});

		revalidateMeetings(parsed.slug);

		return {
			ok: true,
			data: undefined,
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível salvar a designação.",
		};
	}
}

export async function clearMeetingAssignmentAction(
	input: z.infer<typeof ClearAssignmentSchema>,
): Promise<ActionResult> {
	try {
		await requireMeetingContentManage(input.slug);

		const parsed = ClearAssignmentSchema.parse(input);

		const part = await db.meetingProgramPart.findFirst({
			where: {
				id: parsed.partId,
				meetingProgram: {
					organization: {
						slug: parsed.slug,
					},
				},
			},
			select: {
				id: true,
			},
		});

		if (!part) {
			return {
				ok: false,
				error: "Parte da reunião não encontrada.",
			};
		}

		await db.meetingProgramAssignment.deleteMany({
			where: {
				meetingProgramPartId: parsed.partId,
				role: parsed.role,
			},
		});

		revalidateMeetings(parsed.slug);

		return {
			ok: true,
			data: undefined,
		};
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Não foi possível remover a designação.",
		};
	}
}

// evita warning de import não usado em alguns setups
void toIsoDateOnly;
