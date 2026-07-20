// src/features/cleaning-list/actions/generate-cleaning-list.action.ts
"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	type GenerateCleaningListState,
	initialGenerateCleaningListState,
} from "../domain/generate-cleaning-list.types";
import { autoAssignCleaning } from "../lib/auto-assign-cleaning";
import {
	mapOrganizationPeopleToCandidates,
	normalizeCleaningConfig,
} from "../lib/cleaning-list.mappers";
import {
	cleaningConfigSelect,
	cleaningMeetingScheduleSelect,
	cleaningPersonSelect,
} from "../lib/cleaning-list.selects";
import { getCleaningRotationMap } from "../lib/get-cleaning-rotation-map";
import { parseGenerateCleaningListFormData } from "../lib/parse-generate-cleaning-list-form-data";
import { resolveCleaningDates } from "../lib/resolve-cleaning-dates";
import { generateCleaningListSchema } from "../schemas/generate-cleaning-list.schema";

type WeekdayKey =
	| "SUNDAY"
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY";

export async function generateCleaningListAction(
	_prev: GenerateCleaningListState,
	formData: FormData,
): Promise<GenerateCleaningListState> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return {
			...initialGenerateCleaningListState,
			message: "Sessão inválida.",
		};
	}

	const payload = parseGenerateCleaningListFormData(formData);
	const parsed = generateCleaningListSchema.safeParse(payload);

	if (!parsed.success) {
		return {
			...initialGenerateCleaningListState,
			message: "Verifique o período e o tipo de limpeza.",
			errors: parsed.error.flatten().fieldErrors,
		};
	}

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organizationId: parsed.data.organizationId,
		},
		select: {
			role: true,
			organization: {
				select: {
					id: true,
					cleaningSettings: {
						select: {
							configs: {
								where: {
									type: parsed.data.cleaningType,
									enabled: true,
								},
								select: cleaningConfigSelect,
							},
						},
					},
					people: {
						where: { isActive: true, cleaning: true },
						orderBy: { name: "asc" },
						select: cleaningPersonSelect,
					},
					schedules: {
						where: { type: "MEETINGS", isActive: true },
						select: cleaningMeetingScheduleSelect,
					},
				},
			},
		},
	});

	if (!membership) {
		return {
			...initialGenerateCleaningListState,
			message: "Organização não encontrada.",
		};
	}

	if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
		return {
			...initialGenerateCleaningListState,
			message: "Você não tem permissão para gerar listas.",
		};
	}

	const rawConfig = membership.organization.cleaningSettings?.configs[0];
	if (!rawConfig) {
		return {
			...initialGenerateCleaningListState,
			message: "Nenhuma configuração de limpeza ativa foi encontrada.",
		};
	}

	const config = normalizeCleaningConfig(rawConfig);
	if (config.sectors.length === 0) {
		return {
			...initialGenerateCleaningListState,
			message: "A configuração selecionada não possui setores ativos.",
		};
	}

	// MEETING: só weekly rules das reuniões (1 e 2)
	const meetingWeekdays = Array.from(
		new Set(
			membership.organization.schedules.flatMap((schedule) =>
				schedule.weeklyRules.map((rule) => rule.weekday as WeekdayKey),
			),
		),
	);

	const resolved = resolveCleaningDates({
		cleaningType: parsed.data.cleaningType,
		periodFrom: parsed.data.periodFrom,
		periodTo: parsed.data.periodTo,
		config,
		meetingWeekdays,
	});

	if (resolved.dates.length === 0) {
		return {
			...initialGenerateCleaningListState,
			message:
				resolved.reason ??
				"Nenhuma data de limpeza foi encontrada para o período.",
		};
	}

	const rotationMap = await getCleaningRotationMap({
		organizationId: membership.organization.id,
		cleaningType: parsed.data.cleaningType,
	});

	const people = mapOrganizationPeopleToCandidates(
		membership.organization.people,
	);

	const result = autoAssignCleaning({
		cleaningType: parsed.data.cleaningType,
		periodFrom: parsed.data.periodFrom,
		periodTo: parsed.data.periodTo,
		dates: resolved.dates,
		config,
		people,
		rotationMap,
	});

	return {
		success: true,
		message: "Lista gerada com sucesso.",
		errors: {},
		result,
	};
}
