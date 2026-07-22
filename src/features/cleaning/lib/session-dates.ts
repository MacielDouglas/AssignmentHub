import type { Weekday } from "@/generated/prisma/client";

const WEEKDAY_INDEX: Record<Weekday, number> = {
	SUNDAY: 0,
	MONDAY: 1,
	TUESDAY: 2,
	WEDNESDAY: 3,
	THURSDAY: 4,
	FRIDAY: 5,
	SATURDAY: 6,
};

/** yyyy-mm-dd em calendário local */
export function toDateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export function eachDateKey(from: string, to: string): string[] {
	const out: string[] = [];
	let cur = parseDateKey(from);
	const end = parseDateKey(to);
	if (cur > end) return out;
	while (cur <= end) {
		out.push(toDateKey(cur));
		cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
	}
	return out;
}

export function meetingSessionDates(
	from: string,
	to: string,
	slots: Array<{ weekday: Weekday; time: string }>,
): Array<{ date: string; time: string }> {
	const want = new Set(slots.map((s) => WEEKDAY_INDEX[s.weekday]));
	const labelByDow = new Map(
		slots.map((s) => [WEEKDAY_INDEX[s.weekday], s.time] as const),
	);
	return eachDateKey(from, to)
		.filter((k) => want.has(parseDateKey(k).getDay()))
		.map((date) => ({
			date,
			time: labelByDow.get(parseDateKey(date).getDay()) ?? "",
		}));
}

export function weeklySessionDates(
	from: string,
	to: string,
	weekdays: Weekday[],
): Array<{ date: string }> {
	const want = new Set(weekdays.map((w) => WEEKDAY_INDEX[w]));
	return eachDateKey(from, to)
		.filter((k) => want.has(parseDateKey(k).getDay()))
		.map((date) => ({ date }));
}
export function generalSessionDates(
	selected: string[],
	from: string,
	to: string,
	labels: Record<string, string | null | undefined>,
): Array<{ date: string; label: string | null }> {
	return selected
		.filter((d) => d >= from && d <= to)
		.sort()
		.map((date) => ({ date, label: labels[date] ?? "Limpeza geral" }));
}

export function maxRangeOk(from: string, to: string): boolean {
	const a = parseDateKey(from).getTime();
	const b = parseDateKey(to).getTime();
	const days = (b - a) / (86400 * 1000);
	return days >= 0 && days <= 366;
}
