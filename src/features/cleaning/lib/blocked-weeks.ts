import type { BlockingEvent } from "@/features/cleaning/lib/blocking-events";
import { parseDateKey, toDateKey } from "@/features/cleaning/lib/session-dates";

export type BlockedWeek = {
	/** Segunda-feira da semana, yyyy-mm-dd */
	weekStart: string;
	/** Domingo da semana, yyyy-mm-dd */
	weekEnd: string;
	label: string;
};

function mondayOf(key: string): Date {
	const d = parseDateKey(key);
	const offset = (d.getDay() + 6) % 7;
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
}

function addDaysLocal(d: Date, n: number): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Todas as semanas (seg–dom) que tocam o intervalo [startDate, endDate]. */
function weeksOverlapping(startDate: string, endDate: string): string[] {
	const out: string[] = [];
	let cur = mondayOf(startDate);
	const end = parseDateKey(endDate);
	while (cur <= end) {
		out.push(toDateKey(cur));
		cur = addDaysLocal(cur, 7);
	}
	return out;
}

/**
 * Divide as datas de sessão em ativas x bloqueadas. Uma data é bloqueada
 * quando sua semana (seg–dom) cruza Congresso ou Assembleia (Viajante ou
 * Representante). Retorna também as semanas bloqueadas para exibição.
 */
export function splitSessionDatesByBlockedWeeks(
	sessionDates: Array<{ date: string; label?: string | null }>,
	events: BlockingEvent[],
): {
	active: Array<{ date: string; label?: string | null }>;
	blockedDates: Array<{ date: string; label: string }>;
	blockedWeeks: BlockedWeek[];
} {
	const labelsByWeek = new Map<string, Set<string>>();
	for (const e of events) {
		for (const week of weeksOverlapping(e.startDate, e.endDate)) {
			const set = labelsByWeek.get(week) ?? new Set<string>();
			set.add(e.label);
			labelsByWeek.set(week, set);
		}
	}

	const active: Array<{ date: string; label?: string | null }> = [];
	const blockedDates: Array<{ date: string; label: string }> = [];
	for (const s of sessionDates) {
		const week = toDateKey(mondayOf(s.date));
		const labels = labelsByWeek.get(week);
		if (labels && labels.size > 0) {
			blockedDates.push({ date: s.date, label: [...labels].join(" · ") });
		} else {
			active.push(s);
		}
	}

	const blockedWeeks: BlockedWeek[] = [...labelsByWeek.entries()]
		.filter(([week, labels]) => {
			void labels;
			// Só mostra semanas que realmente cortaram alguma data da grade.
			return blockedDates.some((b) => toDateKey(mondayOf(b.date)) === week);
		})
		.map(([week, labels]) => ({
			weekStart: week,
			weekEnd: toDateKey(addDaysLocal(mondayOf(week), 6)),
			label: [...labels].join(" · "),
		}))
		.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

	return { active, blockedDates, blockedWeeks };
}
