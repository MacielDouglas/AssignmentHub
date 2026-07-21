import { isEligibleForSector } from "@/features/cleaning/lib/eligibility";
import type {
	EligiblePerson,
	FairnessHistory,
	RosterSector,
} from "@/features/cleaning/lib/roster-types";

/** menor score = melhor escolha */
export function personScore(
	personId: string,
	sectorId: string,
	date: string,
	history: FairnessHistory,
	usedToday: Set<string>,
): number {
	if (usedToday.has(personId)) return Number.POSITIVE_INFINITY;

	const total = history.totalByPerson[personId] ?? 0;
	const onSector = history.sectorByPerson[personId]?.[sectorId] ?? 0;
	const dates = history.datesByPerson[personId] ?? [];
	const last = dates.length > 0 ? dates[dates.length - 1] : null;

	let recency = 0;
	if (last) {
		const lastMs = Date.parse(`${last}T12:00:00`);
		const curMs = Date.parse(`${date}T12:00:00`);
		const daysAgo = Math.max(0, Math.round((curMs - lastMs) / 86_400_000));
		// limpou recentemente → penalidade maior; há 40+ dias → 0
		recency = Math.max(0, 40 - daysAgo);
	}

	return total * 12 + onSector * 30 + recency;
}

/** carga média da unidade (família ou solo) */
export function unitLoad(
	memberIds: string[],
	history: FairnessHistory,
): number {
	if (memberIds.length === 0) return Number.POSITIVE_INFINITY;
	const sum = memberIds.reduce(
		(acc, id) => acc + (history.totalByPerson[id] ?? 0),
		0,
	);
	return sum / memberIds.length;
}

export function pickPeople(
	candidates: EligiblePerson[],
	sector: RosterSector,
	need: number,
	date: string,
	history: FairnessHistory,
	usedToday: Set<string>,
	relaxYoung: boolean,
): EligiblePerson[] {
	const pool = candidates
		.filter((p) => isEligibleForSector(p, sector, relaxYoung))
		.map((p) => ({
			p,
			s: personScore(p.id, sector.id, date, history, usedToday),
		}))
		.filter((x) => Number.isFinite(x.s))
		.sort((a, b) => a.s - b.s || a.p.name.localeCompare(b.p.name));

	const out: EligiblePerson[] = [];
	for (const { p } of pool) {
		if (out.length >= need) break;
		if (usedToday.has(p.id)) continue;
		out.push(p);
	}
	return out;
}

export function recordAssignment(
	history: FairnessHistory,
	personId: string,
	sectorId: string,
	date: string,
) {
	history.totalByPerson[personId] = (history.totalByPerson[personId] ?? 0) + 1;
	if (!history.sectorByPerson[personId]) {
		history.sectorByPerson[personId] = {};
	}
	history.sectorByPerson[personId][sectorId] =
		(history.sectorByPerson[personId][sectorId] ?? 0) + 1;
	if (!history.datesByPerson[personId]) {
		history.datesByPerson[personId] = [];
	}
	history.datesByPerson[personId].push(date);
}
