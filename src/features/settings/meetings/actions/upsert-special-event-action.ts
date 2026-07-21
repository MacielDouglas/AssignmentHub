"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import {
	endOfCivilYear,
	parseDateInput,
	startOfCivilYear,
} from "@/features/settings/lib/year-bounds";
import { parseUpsertSpecialEvent } from "@/features/settings/meetings/actions/meeting-schema";
import {
	defaultTitleForType,
	SPECIAL_EVENT_META,
} from "@/features/settings/meetings/lib/special-event-meta";
import { db } from "@/lib/db";

export async function upsertSpecialEventAction(
	_prevState: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prevState;

	const parsed = parseUpsertSpecialEvent(formData);
	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const input = parsed.data;
	const meta = SPECIAL_EVENT_META[input.type];
	const startDate = parseDateInput(input.startDate);
	if (!startDate) {
		return {
			success: false,
			message: "Data inicial inválida.",
			fieldErrors: { startDate: ["Data inválida."] },
		};
	}

	const year = startDate.getUTCFullYear();
	let endDate = input.endDate ? parseDateInput(input.endDate) : null;

	if (meta.fields.includes("endDate")) {
		if (!endDate) {
			return {
				success: false,
				message: "Data final obrigatória.",
				fieldErrors: { endDate: ["Data final obrigatória."] },
			};
		}
		if (endDate.getTime() < startDate.getTime()) {
			return {
				success: false,
				message: "Data final deve ser ≥ data inicial.",
				fieldErrors: { endDate: ["Data final deve ser ≥ data inicial."] },
			};
		}
	} else {
		endDate = null;
	}

	let time: string | null = null;
	if (meta.fields.includes("time") && !meta.allDay) {
		if (!input.time) {
			return {
				success: false,
				message: "Horário obrigatório.",
				fieldErrors: { time: ["Horário obrigatório."] },
			};
		}
		time = input.time;
	}

	const location = meta.fields.includes("location")
		? input.location || null
		: null;

	if (meta.fields.includes("location") && meta.type !== "SPECIAL_MEETING") {
		// location obrigatório onde faz sentido (comemoração, congresso, assembleias)
		if (
			(meta.type === "CELEBRATION" ||
				meta.type === "CONVENTION" ||
				meta.type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER" ||
				meta.type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE") &&
			!location
		) {
			return {
				success: false,
				message: "Local obrigatório.",
				fieldErrors: { location: ["Local obrigatório."] },
			};
		}
	}

	let title = defaultTitleForType(input.type);
	if (meta.fields.includes("title")) {
		if (!input.title?.trim()) {
			return {
				success: false,
				message: meta.titleLabel
					? `${meta.titleLabel} é obrigatório.`
					: "Título obrigatório.",
				fieldErrors: { title: ["Campo obrigatório."] },
			};
		}
		title = input.title.trim();
	}

	const notes = input.notes?.trim() || null;
	const occurrenceId = input.occurrenceId || null;

	try {
		await db.$transaction(async (tx) => {
			let schedule = await tx.organizationSchedule.findFirst({
				where: {
					organizationId: authz.organization.id,
					type: input.type,
				},
				select: { id: true },
			});

			if (!schedule) {
				schedule = await tx.organizationSchedule.create({
					data: {
						organizationId: authz.organization.id,
						type: input.type,
						mode: meta.mode,
						title: defaultTitleForType(input.type),
						isActive: true,
					},
					select: { id: true },
				});
			}

			if (meta.oncePerYear) {
				const yearStart = startOfCivilYear(year);
				const yearEnd = endOfCivilYear(year);
				const existingInYear =
					await tx.organizationScheduleOccurrence.findFirst({
						where: {
							organizationScheduleId: schedule.id,
							startDate: { gte: yearStart, lte: yearEnd },
							...(occurrenceId ? { NOT: { id: occurrenceId } } : {}),
						},
						select: { id: true },
					});
				if (existingInYear) {
					throw new Error("ONCE_PER_YEAR");
				}
			}

			if (occurrenceId) {
				const occ = await tx.organizationScheduleOccurrence.findFirst({
					where: {
						id: occurrenceId,
						organizationSchedule: {
							organizationId: authz.organization.id,
							type: input.type,
						},
					},
					select: { id: true },
				});
				if (!occ) throw new Error("NOT_FOUND");

				await tx.organizationScheduleOccurrence.update({
					where: { id: occurrenceId },
					data: {
						startDate,
						endDate,
						time,
						isAllDay: meta.allDay,
						location,
						notes,
					},
				});

				// visita: title no schedule (nome do viajante) — se várias visitas,
				// guardamos o nome também em notes prefix ou title da occurrence via notes
				if (input.type === "TRAVELING_OVERSEER_VISIT") {
					await tx.organizationScheduleOccurrence.update({
						where: { id: occurrenceId },
						data: {
							notes: notes
								? `Viajante: ${title}${notes ? ` | ${notes}` : ""}`
								: `Viajante: ${title}`,
						},
					});
				}
			} else {
				await tx.organizationScheduleOccurrence.create({
					data: {
						organizationScheduleId: schedule.id,
						startDate,
						endDate,
						time,
						isAllDay: meta.allDay,
						location,
						notes:
							input.type === "TRAVELING_OVERSEER_VISIT"
								? notes
									? `Viajante: ${title} | ${notes}`
									: `Viajante: ${title}`
								: notes,
					},
				});
			}

			// atualiza title do schedule da visita com último viajante (lista usa notes)
			if (input.type === "TRAVELING_OVERSEER_VISIT") {
				await tx.organizationSchedule.update({
					where: { id: schedule.id },
					data: { title: "Visita do viajante" },
				});
			}
		});

		revalidatePath(`/org/${authz.organization.slug}/settings`);
		return { success: true, message: "Evento salvo com sucesso." };
	} catch (error) {
		if (error instanceof Error && error.message === "ONCE_PER_YEAR") {
			return {
				success: false,
				message: `Já existe ${meta.label.toLowerCase()} cadastrada(o) neste ano.`,
			};
		}
		if (error instanceof Error && error.message === "NOT_FOUND") {
			return { success: false, message: "Evento não encontrado." };
		}
		return { success: false, message: "Não foi possível salvar o evento." };
	}
}
