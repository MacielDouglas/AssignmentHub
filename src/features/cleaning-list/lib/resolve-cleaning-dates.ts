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
	occurrenceDates: Date[];
	scheduleWeekdays: WeekdayKey[];
};

type Output = {
	dates: Date[];
	source:
		| "occurrences"
		| "weekly-rules"
		| "config-dates"
		| "config-weekdays"
		| "meeting-config-weekdays";
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

function buildDatesFromWeekdays(
	from: Date,
	to: Date,
	weekdays: WeekdayKey[],
): Date[] {
	if (weekdays.length === 0) return [];

	const allowedDays = new Set(weekdays.map((weekday) => weekdayMap[weekday]));
	const result: Date[] = [];
	const cursor = new Date(from);

	while (cursor <= to) {
		if (allowedDays.has(cursor.getDay())) {
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
	occurrenceDates,
	scheduleWeekdays,
}: Input): Output {
	const from = startOfDay(periodFrom);
	const to = endOfDay(periodTo);

	if (cleaningType === "MEETING") {
		const filteredOccurrences =
			occurrenceDates.length > 0
				? occurrenceDates.filter((date) => {
						const normalized = new Date(date);
						return normalized >= from && normalized <= to;
					})
				: [];

		if (filteredOccurrences.length > 0) {
			return {
				dates: uniqueDates(filteredOccurrences),
				source: "occurrences",
				reason: null,
			};
		}

		const weeklyRuleDates = buildDatesFromWeekdays(from, to, scheduleWeekdays);

		if (weeklyRuleDates.length > 0) {
			return {
				dates: uniqueDates(weeklyRuleDates),
				source: "weekly-rules",
				reason: null,
			};
		}

		const configWeekdays = config.weekdays
			.map((item) => item.weekday as WeekdayKey)
			.filter((weekday) => weekday in weekdayMap);

		const fallbackDates = buildDatesFromWeekdays(from, to, configWeekdays);

		return {
			dates: uniqueDates(fallbackDates),
			source: "meeting-config-weekdays",
			reason:
				fallbackDates.length === 0
					? "Nenhuma ocorrência de reunião, regra semanal ou dia configurado para limpeza por reunião foi encontrado no período."
					: null,
		};
	}

	if (cleaningType === "GENERAL") {
		const dates = config.dates
			.map((item) => new Date(item.date))
			.filter((date) => date >= from && date <= to);

		return {
			dates: uniqueDates(dates),
			source: "config-dates",
			reason:
				dates.length === 0
					? "Nenhuma data configurada para limpeza geral foi encontrada no período."
					: null,
		};
	}

	const weekdays = config.weekdays.map((item) => item.weekday as WeekdayKey);
	const dates = buildDatesFromWeekdays(from, to, weekdays);

	return {
		dates: uniqueDates(dates),
		source: "config-weekdays",
		reason:
			dates.length === 0
				? "Nenhum dia da semana configurado para limpeza semanal foi encontrado no período."
				: null,
	};
}
