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

/** maior carga individual da unidade — evita arrastar quem já trabalhou muito. */
export function unitMaxLoad(
	memberIds: string[],
	history: FairnessHistory,
): number {
	if (memberIds.length === 0) return Number.POSITIVE_INFINITY;
	return Math.max(...memberIds.map((id) => history.totalByPerson[id] ?? 0));
}

/**
 * Última data trabalhada (yyyy-mm-dd) ou null. `datesByPerson` vem ordenado
 * do banco e `recordAssignment` adiciona em ordem cronológica.
 */
export function lastWorkedDate(
	personId: string,
	history: FairnessHistory,
): string | null {
	const dates = history.datesByPerson[personId] ?? [];
	return dates.length > 0 ? (dates[dates.length - 1] as string) : null;
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
	if (!history.assignmentsByPerson) {
		history.assignmentsByPerson = {};
	}
	if (!history.assignmentsByPerson[personId]) {
		history.assignmentsByPerson[personId] = [];
	}
	history.assignmentsByPerson[personId].push({ date, sectorId });
}

/**
 * Últimas N datas distintas (ordem decrescente) com flag se passou pelo setor atual.
 * Independe do setor para listar, mas sinaliza mesmo setor (vermelho) vs outro (azul).
 */
export function lastAssignmentsForDisplay(
	personId: string,
	currentSectorId: string,
	history: FairnessHistory,
	limit = 6,
): Array<{ date: string; isSameSector: boolean }> {
	const all = history.assignmentsByPerson?.[personId] ?? [];
	const byDate = new Map<string, boolean>();
	for (const a of all) {
		const prev = byDate.get(a.date) ?? false;
		byDate.set(a.date, prev || a.sectorId === currentSectorId);
	}
	return [...byDate.entries()]
		.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
		.slice(0, limit)
		.map(([date, isSameSector]) => ({ date, isSameSector }));
}

/**
 * Últimas designações com o setor de cada data (ordem decrescente).
 * Usado para exibir os ícones dos setores nas linhas de candidatos.
 * Deduplica por data: se no mesmo dia houve >1 setor, prioriza o setor atual.
 */
export function recentAssignmentsWithSector(
	personId: string,
	currentSectorId: string,
	history: FairnessHistory,
	limit = 6,
): Array<{ date: string; sectorId: string; isSameSector: boolean }> {
	const all = history.assignmentsByPerson?.[personId] ?? [];
	const byDate = new Map<string, { sectorId: string; isSame: boolean }>();
	for (const a of all) {
		const cur = byDate.get(a.date);
		const isSame = a.sectorId === currentSectorId;
		if (!cur) {
			byDate.set(a.date, { sectorId: a.sectorId, isSame });
		} else if (!cur.isSame && isSame) {
			byDate.set(a.date, { sectorId: a.sectorId, isSame: true });
		}
	}
	return [...byDate.entries()]
		.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
		.slice(0, limit)
		.map(([date, v]) => ({
			date,
			sectorId: v.sectorId,
			isSameSector: v.isSame,
		}));
}

/**
 * Ordena candidatos: quem nunca limpou primeiro, depois quem limpou há mais
 * tempo; quem limpou por último fica no fim. Desempate por nome.
 */
export function sortCandidatesByLeastRecent(
	candidates: EligiblePerson[],
	history: FairnessHistory,
): EligiblePerson[] {
	const lastOf = new Map<string, string | null>();
	for (const p of candidates) {
		lastOf.set(p.id, lastWorkedDate(p.id, history));
	}
	return [...candidates].sort((a, b) => {
		const la = lastOf.get(a.id);
		const lb = lastOf.get(b.id);
		if (la == null && lb == null) return a.name.localeCompare(b.name);
		if (la == null) return -1;
		if (lb == null) return 1;
		if (la !== lb) return la < lb ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}
