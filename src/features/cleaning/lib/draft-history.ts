import { recordAssignment } from "@/features/cleaning/lib/fairness";
import type {
	FairnessHistory,
	RosterDraft,
} from "@/features/cleaning/lib/roster-types";

export type DraftAssignment = {
	date: string;
	sectorId: string;
	personId: string;
};

/** Todas as designações do rascunho (ainda não salvas), em ordem crescente. */
export function collectDraftAssignments(draft: RosterDraft): DraftAssignment[] {
	const out: DraftAssignment[] = [];
	for (const day of draft.days) {
		for (const slot of day.slots) {
			out.push({
				date: day.date,
				sectorId: slot.sectorId,
				personId: slot.personId,
			});
		}
	}
	out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
	return out;
}

function cloneHistory(base: FairnessHistory): FairnessHistory {
	return {
		totalByPerson: { ...base.totalByPerson },
		sectorByPerson: Object.fromEntries(
			Object.entries(base.sectorByPerson).map(([k, v]) => [k, { ...v }]),
		),
		datesByPerson: Object.fromEntries(
			Object.entries(base.datesByPerson).map(([k, v]) => [k, [...v]]),
		),
		assignmentsByPerson: Object.fromEntries(
			Object.entries(base.assignmentsByPerson ?? {}).map(([k, v]) => [
				k,
				v.map((a) => ({ ...a })),
			]),
		),
	};
}

/** Dobra designações (ex.: do rascunho) no histórico, mantendo a ordenação. */
export function mergeAssignmentsIntoHistory(
	base: FairnessHistory,
	assignments: DraftAssignment[],
): FairnessHistory {
	if (assignments.length === 0) return base;
	const next = cloneHistory(base);
	for (const a of assignments) {
		recordAssignment(next, a.personId, a.sectorId, a.date);
	}
	for (const id of Object.keys(next.datesByPerson)) {
		next.datesByPerson[id].sort();
	}
	for (const id of Object.keys(next.assignmentsByPerson)) {
		next.assignmentsByPerson[id].sort((a, b) =>
			a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
		);
	}
	return next;
}

/**
 * Histórico efetivo para analisar a data de referência: banco + designações
 * do rascunho estritamente anteriores (`date < beforeDate`), em sequência.
 * A própria data de referência fica de fora (inclusive o slot em edição).
 */
export function historyWithDraftBefore(
	base: FairnessHistory,
	draft: RosterDraft,
	beforeDate: string,
): FairnessHistory {
	const earlier = collectDraftAssignments(draft).filter(
		(a) => a.date < beforeDate,
	);
	return mergeAssignmentsIntoHistory(base, earlier);
}
