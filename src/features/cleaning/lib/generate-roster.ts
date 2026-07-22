import {
	isEligibleForSector,
	requiredCount,
} from "@/features/cleaning/lib/eligibility";
import {
	personScore,
	recordAssignment,
	unitLoad,
} from "@/features/cleaning/lib/fairness";
import { buildAssignmentUnits } from "@/features/cleaning/lib/family-units";
import type {
	EligiblePerson,
	FairnessHistory,
	GenerateRosterInput,
	RosterDay,
	RosterDraft,
	RosterSector,
	RosterSlot,
} from "@/features/cleaning/lib/roster-types";

function slotKey(
	date: string,
	sectorId: string,
	personId: string,
	pos: number,
): string {
	return `${date}:${sectorId}:${personId}:${pos}`;
}

function cloneHistory(h: FairnessHistory): FairnessHistory {
	return {
		totalByPerson: { ...h.totalByPerson },
		sectorByPerson: Object.fromEntries(
			Object.entries(h.sectorByPerson).map(([k, v]) => [k, { ...v }]),
		),
		datesByPerson: Object.fromEntries(
			Object.entries(h.datesByPerson).map(([k, v]) => [k, [...v]]),
		),
	};
}

function totalSlotsNeeded(sectors: RosterSector[]): number {
	return sectors.reduce((n, s) => n + requiredCount(s), 0);
}

function pushPerson(
	slots: RosterSlot[],
	history: FairnessHistory,
	usedToday: Set<string>,
	date: string,
	sectorId: string,
	person: EligiblePerson,
	position: number,
) {
	usedToday.add(person.id);
	recordAssignment(history, person.id, sectorId, date);
	slots.push({
		key: slotKey(date, sectorId, person.id, position),
		sectorId,
		personId: person.id,
		familyId: person.familyId,
		groupId: person.groupId,
		position,
		isManual: false,
	});
}

/**
 * Seleciona quem trabalha no dia:
 * - com keepFamilyTogether: família entra inteira ou não entra
 * - preenche o restante com pessoas sem família (unidades de 1)
 * - ordena por quem limpou menos (carga média da unidade)
 */
function selectUnitsForDay(
	people: EligiblePerson[],
	sectors: RosterSector[],
	history: FairnessHistory,
	keepFamilyTogether: boolean,
): EligiblePerson[] {
	const need = totalSlotsNeeded(sectors);
	if (need <= 0) return [];

	const units = buildAssignmentUnits(people);

	const ranked = [...units].sort((a, b) => {
		const la = unitLoad(
			a.members.map((m) => m.id),
			history,
		);
		const lb = unitLoad(
			b.members.map((m) => m.id),
			history,
		);
		if (la !== lb) return la - lb;

		const aFamily = a.familyId ? 0 : 1;
		const bFamily = b.familyId ? 0 : 1;
		if (aFamily !== bFamily) return aFamily - bFamily;

		const an = a.members[0]?.name ?? "";
		const bn = b.members[0]?.name ?? "";
		return an.localeCompare(bn);
	});

	const selected: EligiblePerson[] = [];
	const used = new Set<string>();
	let open = need;

	const personCanWorkSomewhere = (person: EligiblePerson): boolean => {
		return (
			sectors.some((s) => isEligibleForSector(person, s, false)) ||
			sectors.some((s) => isEligibleForSector(person, s, true))
		);
	};

	for (const unit of ranked) {
		if (open <= 0) break;

		const available = unit.members.filter(
			(m) => !used.has(m.id) && personCanWorkSomewhere(m),
		);
		if (available.length === 0) continue;

		const isFamilyUnit = Boolean(unit.familyId) && keepFamilyTogether;

		if (isFamilyUnit) {
			const whole = unit.members.filter((m) => !used.has(m.id));
			const placeable = whole.filter(personCanWorkSomewhere);
			if (placeable.length !== whole.length) {
				continue;
			}
			if (whole.length > open) continue;

			for (const m of whole) {
				selected.push(m);
				used.add(m.id);
			}
			open -= whole.length;
			continue;
		}

		for (const m of available) {
			if (open <= 0) break;
			selected.push(m);
			used.add(m.id);
			open -= 1;
		}
	}

	return selected;
}

/** Distribui as pessoas do dia nos setores (sexo / jovem + rotatividade por setor). */
function assignPeopleToSectors(
	dayPeople: EligiblePerson[],
	sectors: RosterSector[],
	history: FairnessHistory,
	date: string,
	usedToday: Set<string>,
): RosterSlot[] {
	const slots: RosterSlot[] = [];
	const remaining = new Set(dayPeople.map((p) => p.id));
	const byId = new Map(dayPeople.map((p) => [p.id, p]));

	const orderedSectors = [...sectors].sort(
		(a, b) =>
			Number(Boolean(b.targetSex)) - Number(Boolean(a.targetSex)) ||
			Number(!b.allowYoung) - Number(!a.allowYoung) ||
			requiredCount(b) - requiredCount(a) ||
			a.sortOrder - b.sortOrder,
	);

	for (const sector of orderedSectors) {
		const need = requiredCount(sector);
		let filled = 0;

		const tryFill = (relaxYoung: boolean) => {
			while (filled < need) {
				const candidates = [...remaining]
					.map((id) => byId.get(id))
					.filter((p): p is EligiblePerson => p != null)
					.filter((p) => isEligibleForSector(p, sector, relaxYoung))
					.map((p) => ({
						p,
						s: personScore(p.id, sector.id, date, history, usedToday),
					}))
					.filter((x) => Number.isFinite(x.s))
					.sort((a, b) => a.s - b.s || a.p.name.localeCompare(b.p.name));

				const best = candidates[0];
				if (!best) break;

				pushPerson(slots, history, usedToday, date, sector.id, best.p, filled);
				remaining.delete(best.p.id);
				filled += 1;
			}
		};

		tryFill(false);
		if (filled < need) tryFill(true);
	}

	return slots;
}

export function generateRoster(input: GenerateRosterInput): RosterDraft {
	const history = cloneHistory(input.history);
	const sectors = [...input.sectors].sort((a, b) => a.sortOrder - b.sortOrder);

	const days: RosterDay[] = input.sessionDates.map(({ date, label }) => {
		const usedToday = new Set<string>();

		const dayPeople = selectUnitsForDay(
			input.people,
			sectors,
			history,
			input.keepFamilyTogether,
		);

		const slots = assignPeopleToSectors(
			dayPeople,
			sectors,
			history,
			date,
			usedToday,
		);

		return {
			date,
			label: label ?? null,
			slots,
			hiddenSectorIds: [],
		};
	});

	return {
		cleaningType: input.cleaningType,
		periodFrom: input.periodFrom,
		periodTo: input.periodTo,
		keepFamilyTogether: input.keepFamilyTogether,
		days,
		sectors: input.sectors,
		people: input.people,
	};
}
