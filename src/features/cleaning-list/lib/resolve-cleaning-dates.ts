// src/features/cleaning-list/lib/resolve-cleaning-dates.ts
import type { CleaningType } from "@/generated/prisma/enums";
import type { CleaningTypeConfigView } from "../domain/cleaning-list.types";

type WeekdayKey =
	| "SUNDAY"
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY";

type Input = {
	cleaningType: CleaningType;
	periodFrom: Date;
	periodTo: Date;
	config: CleaningTypeConfigView;
	/** Apenas MEETING: weekdays das reuniões 1 e 2 */
	meetingWeekdays: WeekdayKey[];
};

type Output = {
	dates: Date[];
	source: "meeting-weekly-rules" | "config-weekdays" | "config-dates";
	reason: string | null;
};

const weekdayMap: Record<WeekdayKey, number> = {
	SUNDAY: 0,
	MONDAY: 1,
	TUESDAY: 2,
	WEDNESDAY: 3,
	THURSDAY: 4,
	FRIDAY: 5,
	SATURDAY: 6,
};

function startOfDay(date: Date) {
	const next = new Date(date);
	next.setHours(0, 0, 0, 0);
	return next;
}

function endOfDay(date: Date) {
	const next = new Date(date);
	next.setHours(23, 59, 59, 999);
	return next;
}

function buildDatesFromWeekdays(from: Date, to: Date, weekdays: WeekdayKey[]) {
	if (weekdays.length === 0) return [] as Date[];

	const allowed = new Set(weekdays.map((d) => weekdayMap[d]));
	const result: Date[] = [];
	const cursor = new Date(from);

	while (cursor <= to) {
		if (allowed.has(cursor.getDay())) {
			result.push(new Date(cursor));
		}
		cursor.setDate(cursor.getDate() + 1);
	}

	return result;
}

function uniqueDates(dates: Date[]) {
	const map = new Map<string, Date>();
	for (const date of dates) {
		const normalized = startOfDay(date);
		map.set(normalized.toISOString(), normalized);
	}
	return Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime());
}

export function resolveCleaningDates({
	cleaningType,
	periodFrom,
	periodTo,
	config,
	meetingWeekdays,
}: Input): Output {
	const from = startOfDay(periodFrom);
	const to = endOfDay(periodTo);

	if (cleaningType === "MEETING") {
		const dates = uniqueDates(
			buildDatesFromWeekdays(from, to, meetingWeekdays),
		);

		return {
			dates,
			source: "meeting-weekly-rules",
			reason:
				dates.length === 0
					? "Nenhuma data de reunião (reunião 1/2) encontrada no período. Configure a agenda de reuniões."
					: null,
		};
	}

	if (cleaningType === "GENERAL") {
		const dates = uniqueDates(
			config.dates
				.map((item) => new Date(item.date))
				.filter((date) => date >= from && date <= to),
		);

		return {
			dates,
			source: "config-dates",
			reason:
				dates.length === 0
					? "Nenhuma data de limpeza geral configurada no período."
					: null,
		};
	}

	// WEEKLY: 0 ou 1 weekday nas settings
	const weekdays = config.weekdays
		.map((item) => item.weekday as WeekdayKey)
		.filter((weekday) => weekday in weekdayMap);

	const dates = uniqueDates(buildDatesFromWeekdays(from, to, weekdays));

	return {
		dates,
		source: "config-weekdays",
		reason:
			dates.length === 0
				? weekdays.length === 0
					? "Limpeza semanal sem dia da semana configurado."
					: "Nenhuma ocorrência do dia semanal no período."
				: null,
	};
}
