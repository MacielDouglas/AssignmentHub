function dateOnlyUtc(year: number, month: number, day: number) {
	return new Date(Date.UTC(year, month, day));
}

export function isIsoDate(value: string | undefined): value is string {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const [year, month, day] = value.split("-").map(Number);
	const parsed = dateOnlyUtc(year, month - 1, day);

	return (
		parsed.getUTCFullYear() === year &&
		parsed.getUTCMonth() === month - 1 &&
		parsed.getUTCDate() === day
	);
}

export function parseIsoDateOnly(value: string): Date {
	if (!isIsoDate(value)) {
		throw new Error("Data semanal inválida.");
	}

	const [year, month, day] = value.split("-").map(Number);

	return dateOnlyUtc(year, month - 1, day);
}

export function toIsoDateOnly(value: Date): string {
	return value.toISOString().slice(0, 10);
}

export function startOfWeekMonday(value: Date): Date {
	const date = dateOnlyUtc(
		value.getUTCFullYear(),
		value.getUTCMonth(),
		value.getUTCDate(),
	);

	const weekday = date.getUTCDay();
	const offset = weekday === 0 ? -6 : 1 - weekday;

	date.setUTCDate(date.getUTCDate() + offset);

	return date;
}

export function endOfWeekSunday(weekStart: Date): Date {
	const date = new Date(weekStart);
	date.setUTCDate(date.getUTCDate() + 6);

	return date;
}

export function addDays(value: Date, days: number): Date {
	const date = new Date(value);
	date.setUTCDate(date.getUTCDate() + days);

	return date;
}

export function todayUtcDateOnly(): Date {
	const now = new Date();

	return dateOnlyUtc(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function resolveWeekStart(value?: string): Date {
	if (!isIsoDate(value)) {
		return startOfWeekMonday(todayUtcDateOnly());
	}

	return startOfWeekMonday(parseIsoDateOnly(value));
}

export function startOfPreviousTwelveMonths(date: Date): Date {
	const result = new Date(date);
	result.setUTCFullYear(result.getUTCFullYear() - 1);

	return result;
}
