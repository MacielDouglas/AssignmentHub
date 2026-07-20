import {
	type endOfCivilYear,
	startOfCivilYear,
	todayUtcDateOnly,
} from "@/features/settings/lib/year-bounds";
import type { Weekday } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const WEEKDAY_JS: Record<number, Weekday> = {
	0: "SUNDAY",
	1: "MONDAY",
	2: "TUESDAY",
	3: "WEDNESDAY",
	4: "THURSDAY",
	5: "FRIDAY",
	6: "SATURDAY",
};

export type MeetingSlot = {
	weekday: Weekday;
	time: string; // HH:mm
	scheduleId: string;
	source: "weekly" | "suppressed_by_visit";
};

export type MeetingSlotsResult = {
	date: Date;
	slots: MeetingSlot[];
	suppressedByVisit: boolean;
	visitTitle: string | null;
};

function dateOnlyUtc(date: Date): Date {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
}

function isInRange(day: Date, from: Date, to: Date | null | undefined) {
	const t = day.getTime();
	if (t < dateOnlyUtc(from).getTime()) return false;
	if (to && t > dateOnlyUtc(to).getTime()) return false;
	return true;
}

/**
 * Fonte da verdade para horários de reunião de congregação em uma data.
 * - Escolhe o schedule MEETINGS cuja vigência cobre a data.
 * - Se houver Visita do Viajante cobrindo a data, oculta slots semanais.
 */
export async function getMeetingSlotsForDate(
	organizationId: string,
	date: Date,
): Promise<MeetingSlotsResult> {
	const day = dateOnlyUtc(date);
	const weekday = WEEKDAY_JS[day.getUTCDay()];

	const visit = await db.organizationSchedule.findFirst({
		where: {
			organizationId,
			type: "TRAVELING_OVERSEER_VISIT",
			isActive: true,
			occurrences: {
				some: {
					startDate: { lte: day },
					OR: [{ endDate: null }, { endDate: { gte: day } }],
				},
			},
		},
		select: {
			title: true,
			occurrences: {
				where: {
					startDate: { lte: day },
					OR: [{ endDate: null }, { endDate: { gte: day } }],
				},
				take: 1,
				select: { id: true },
			},
		},
	});

	if (visit && visit.occurrences.length > 0) {
		return {
			date: day,
			slots: [],
			suppressedByVisit: true,
			visitTitle: visit.title,
		};
	}

	const meetings = await db.organizationSchedule.findMany({
		where: {
			organizationId,
			type: "MEETINGS",
			mode: "WEEKLY_RECURRING",
			isActive: true,
		},
		select: {
			id: true,
			effectiveFrom: true,
			effectiveUntil: true,
			weeklyRules: {
				orderBy: { sortOrder: "asc" },
				select: { weekday: true, time: true },
			},
		},
	});

	const covering = meetings.filter((s) => {
		const from = s.effectiveFrom ?? startOfCivilYear(1970);
		return isInRange(day, from, s.effectiveUntil);
	});

	// Preferir a vigência mais específica (effectiveFrom mais recente)
	covering.sort((a, b) => {
		const af = a.effectiveFrom?.getTime() ?? 0;
		const bf = b.effectiveFrom?.getTime() ?? 0;
		return bf - af;
	});

	const chosen = covering[0];
	if (!chosen) {
		return {
			date: day,
			slots: [],
			suppressedByVisit: false,
			visitTitle: null,
		};
	}

	const slots: MeetingSlot[] = chosen.weeklyRules
		.filter((r) => r.weekday === weekday)
		.map((r) => ({
			weekday: r.weekday,
			time: r.time,
			scheduleId: chosen.id,
			source: "weekly" as const,
		}));

	return {
		date: day,
		slots,
		suppressedByVisit: false,
		visitTitle: null,
	};
}

export type WeeklyMeetingDraft = {
	weekday: Weekday;
	time: string;
};

export type WeeklyMeetingsView = {
	current: {
		scheduleId: string | null;
		effectiveFrom: Date | null;
		effectiveUntil: Date | null;
		slots: WeeklyMeetingDraft[];
	};
	nextYear: {
		year: number;
		scheduleId: string | null;
		slots: WeeklyMeetingDraft[];
	};
};

export async function loadWeeklyMeetingsView(
	organizationId: string,
): Promise<WeeklyMeetingsView> {
	const now = todayUtcDateOnly();
	const currentYear = now.getUTCFullYear();
	const nextYear = currentYear + 1;

	const schedules = await db.organizationSchedule.findMany({
		where: {
			organizationId,
			type: "MEETINGS",
			mode: "WEEKLY_RECURRING",
			isActive: true,
		},
		include: {
			weeklyRules: { orderBy: { sortOrder: "asc" } },
		},
		orderBy: { effectiveFrom: "asc" },
	});

	const nextStart = startOfCivilYear(nextYear);

	const next = schedules.find((s) => {
		if (!s.effectiveFrom) return false;
		return s.effectiveFrom.getTime() >= nextStart.getTime();
	});

	// "Atual" = cobre hoje, senão o mais recente antes de next
	const coveringToday = schedules
		.filter((s) => {
			if (next && s.id === next.id) return false;
			const from = s.effectiveFrom ?? startOfCivilYear(1970);
			return isInRange(now, from, s.effectiveUntil);
		})
		.sort(
			(a, b) =>
				(b.effectiveFrom?.getTime() ?? 0) - (a.effectiveFrom?.getTime() ?? 0),
		)[0];

	const current = coveringToday ?? null;

	return {
		current: {
			scheduleId: current?.id ?? null,
			effectiveFrom: current?.effectiveFrom ?? null,
			effectiveUntil: current?.effectiveUntil ?? null,
			slots: (current?.weeklyRules ?? []).map((r) => ({
				weekday: r.weekday,
				time: r.time,
			})),
		},
		nextYear: {
			year: nextYear,
			scheduleId: next?.id ?? null,
			slots: (next?.weeklyRules ?? []).map((r) => ({
				weekday: r.weekday,
				time: r.time,
			})),
		},
	};
}

export { type endOfCivilYear, startOfCivilYear };
