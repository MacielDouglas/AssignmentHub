"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import {
	endOfCivilYear,
	startOfCivilYear,
	todayUtcDateOnly,
} from "@/features/settings/lib/year-bounds";
import { parseSaveWeeklyMeetings } from "@/features/settings/meetings/actions/meeting-schema";
import type { Weekday } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function saveWeeklyMeetingsAction(
	_prevState: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prevState;

	const parsed = parseSaveWeeklyMeetings(formData);
	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const { organization } = authz;
	const data = parsed.data;
	const today = todayUtcDateOnly();
	const currentYear = today.getUTCFullYear();
	const nextYear = currentYear + 1;

	const currentSlots: Array<{
		weekday: Weekday;
		time: string;
		sortOrder: number;
	}> = [
		{
			weekday: data.currentSlot1Weekday,
			time: data.currentSlot1Time,
			sortOrder: 0,
		},
		{
			weekday: data.currentSlot2Weekday,
			time: data.currentSlot2Time,
			sortOrder: 1,
		},
	];

	try {
		await db.$transaction(async (tx) => {
			const existing = await tx.organizationSchedule.findMany({
				where: {
					organizationId: organization.id,
					type: "MEETINGS",
					mode: "WEEKLY_RECURRING",
				},
				include: { weeklyRules: true },
				orderBy: { effectiveFrom: "asc" },
			});

			const nextStart = startOfCivilYear(nextYear);
			const nextExisting = existing.find(
				(s) =>
					s.effectiveFrom && s.effectiveFrom.getTime() >= nextStart.getTime(),
			);

			// schedules que NÃO são "próximo ano"
			const historical = existing.filter((s) => s.id !== nextExisting?.id);

			// schedule que cobre hoje
			const covering = historical
				.filter((s) => {
					const from = s.effectiveFrom ?? new Date(0);
					const until = s.effectiveUntil;
					if (today.getTime() < from.getTime()) return false;
					if (until && today.getTime() > until.getTime()) return false;
					return true;
				})
				.sort(
					(a, b) =>
						(b.effectiveFrom?.getTime() ?? 0) -
						(a.effectiveFrom?.getTime() ?? 0),
				)[0];

			const sameRules = (
				rules: typeof currentSlots,
				other: typeof covering,
			) => {
				if (!other) return false;
				if (other.weeklyRules.length !== 2) return false;
				const a = [...other.weeklyRules]
					.map((r) => `${r.weekday}|${r.time}`)
					.sort()
					.join(";");
				const b = [...rules]
					.map((r) => `${r.weekday}|${r.time}`)
					.sort()
					.join(";");
				return a === b;
			};

			let currentScheduleId: string | null = covering?.id ?? null;

			if (!covering) {
				// cria vigência atual a partir de hoje (ou início do ano)
				const created = await tx.organizationSchedule.create({
					data: {
						organizationId: organization.id,
						type: "MEETINGS",
						mode: "WEEKLY_RECURRING",
						title: "Reuniões de congregação",
						isActive: true,
						effectiveFrom: startOfCivilYear(currentYear),
						effectiveUntil:
							data.nextEnabled === "true" ? endOfCivilYear(currentYear) : null,
						weeklyRules: {
							create: currentSlots,
						},
					},
					select: { id: true },
				});
				currentScheduleId = created.id;
			} else if (!sameRules(currentSlots, covering)) {
				// mid-year change: encerra ontem e abre nova vigência hoje
				const yesterday = new Date(today);
				yesterday.setUTCDate(yesterday.getUTCDate() - 1);

				const coveringFrom =
					covering.effectiveFrom ?? startOfCivilYear(currentYear);
				if (dateOnly(coveringFrom).getTime() === today.getTime()) {
					// mesma data de início: só substitui rules
					await tx.organizationScheduleWeeklyRule.deleteMany({
						where: { organizationScheduleId: covering.id },
					});
					await tx.organizationScheduleWeeklyRule.createMany({
						data: currentSlots.map((s) => ({
							organizationScheduleId: covering.id,
							...s,
						})),
					});
					await tx.organizationSchedule.update({
						where: { id: covering.id },
						data: {
							effectiveUntil:
								data.nextEnabled === "true"
									? endOfCivilYear(currentYear)
									: null,
							title: "Reuniões de congregação",
							isActive: true,
						},
					});
					currentScheduleId = covering.id;
				} else {
					await tx.organizationSchedule.update({
						where: { id: covering.id },
						data: { effectiveUntil: yesterday },
					});

					const created = await tx.organizationSchedule.create({
						data: {
							organizationId: organization.id,
							type: "MEETINGS",
							mode: "WEEKLY_RECURRING",
							title: "Reuniões de congregação",
							isActive: true,
							effectiveFrom: today,
							effectiveUntil:
								data.nextEnabled === "true"
									? endOfCivilYear(currentYear)
									: null,
							weeklyRules: { create: currentSlots },
						},
						select: { id: true },
					});
					currentScheduleId = created.id;
				}
			} else {
				// rules iguais: só ajusta effectiveUntil conforme next year
				await tx.organizationSchedule.update({
					where: { id: covering.id },
					data: {
						effectiveUntil:
							data.nextEnabled === "true" ? endOfCivilYear(currentYear) : null,
						isActive: true,
					},
				});
				currentScheduleId = covering.id;
			}

			// Próximo ano
			if (data.nextEnabled === "true") {
				const nextSlots = [
					{
						weekday: data.nextSlot1Weekday as Weekday,
						time: data.nextSlot1Time as string,
						sortOrder: 0,
					},
					{
						weekday: data.nextSlot2Weekday as Weekday,
						time: data.nextSlot2Time as string,
						sortOrder: 1,
					},
				];

				if (nextExisting) {
					await tx.organizationScheduleWeeklyRule.deleteMany({
						where: { organizationScheduleId: nextExisting.id },
					});
					await tx.organizationScheduleWeeklyRule.createMany({
						data: nextSlots.map((s) => ({
							organizationScheduleId: nextExisting.id,
							...s,
						})),
					});
					await tx.organizationSchedule.update({
						where: { id: nextExisting.id },
						data: {
							isActive: true,
							effectiveFrom: startOfCivilYear(nextYear),
							effectiveUntil: null,
							title: `Reuniões de congregação ${nextYear}`,
						},
					});
				} else {
					await tx.organizationSchedule.create({
						data: {
							organizationId: organization.id,
							type: "MEETINGS",
							mode: "WEEKLY_RECURRING",
							title: `Reuniões de congregação ${nextYear}`,
							isActive: true,
							effectiveFrom: startOfCivilYear(nextYear),
							effectiveUntil: null,
							weeklyRules: { create: nextSlots },
						},
					});
				}

				// garante que o atual termina em 31/12
				if (currentScheduleId) {
					await tx.organizationSchedule.update({
						where: { id: currentScheduleId },
						data: { effectiveUntil: endOfCivilYear(currentYear) },
					});
				}
			} else if (nextExisting) {
				await tx.organizationSchedule.delete({
					where: { id: nextExisting.id },
				});
				if (currentScheduleId) {
					await tx.organizationSchedule.update({
						where: { id: currentScheduleId },
						data: { effectiveUntil: null },
					});
				}
			}
		});

		revalidatePath(`/org/${organization.slug}/settings`);
		return {
			success: true,
			message: "Reuniões semanais salvas com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Não foi possível salvar as reuniões semanais.",
		};
	}
}

function dateOnly(d: Date) {
	return new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
	);
}
