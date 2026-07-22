import type { SavedListDetailForPdf } from "@/features/cleaning/lib/cleaning-pdf-types";
import type {
	EligiblePerson,
	RosterDraft,
	RosterSector,
	RosterSlot,
} from "@/features/cleaning/lib/roster-types";
import type { CleaningType } from "@/generated/prisma/client";

type DetailLike = SavedListDetailForPdf & {
	// se getSavedListDetail tiver mais campos, ok
};

/**
 * Monta RosterDraft a partir da lista salva + people/sectors da página.
 * Setores vêm das assignments (união) ordenados por sortOrder.
 */
export function savedListToDraft(
	list: DetailLike,
	people: EligiblePerson[],
): RosterDraft {
	const sectorMap = new Map<string, RosterSector>();

	for (const day of list.days) {
		for (const a of day.assignments) {
			if (!sectorMap.has(a.sectorId)) {
				sectorMap.set(a.sectorId, {
					id: a.sectorId,
					name: a.sectorName,
					description: a.sectorDescription ?? null,
					peopleRequired: 1,
					allowYoung: true,
					targetSex: null,
					sortOrder: a.sortOrder ?? 0,
				});
			}
		}
	}

	// peopleRequired real: max position+1 por setor num dia qualquer
	for (const day of list.days) {
		const countBySector = new Map<string, number>();
		for (const a of day.assignments) {
			const n = (countBySector.get(a.sectorId) ?? 0) + 1;
			countBySector.set(a.sectorId, n);
		}
		for (const [sectorId, n] of countBySector) {
			const s = sectorMap.get(sectorId);
			if (s && n > (s.peopleRequired ?? 1)) {
				s.peopleRequired = n;
			}
		}
	}

	const sectors = [...sectorMap.values()].sort(
		(a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
	);

	const days = list.days.map((day) => {
		const slots: RosterSlot[] = day.assignments.map((a) => ({
			key: `${day.date}:${a.sectorId}:${a.personId}:${a.position}`,
			sectorId: a.sectorId,
			personId: a.personId,
			familyId: a.familyId,
			groupId: a.groupId,
			position: a.position,
			isManual: a.isManual,
		}));

		return {
			date: day.date,
			label: null as string | null,
			slots,
			hiddenSectorIds: [] as string[],
		};
	});

	const periodFrom = list.periodFrom.includes("T")
		? list.periodFrom.slice(0, 10)
		: list.periodFrom;
	const periodTo = list.periodTo.includes("T")
		? list.periodTo.slice(0, 10)
		: list.periodTo;

	return {
		listId: list.id,
		cleaningType: list.cleaningType as CleaningType,
		periodFrom,
		periodTo,
		keepFamilyTogether: true,
		days,
		sectors,
		people,
	};
}
