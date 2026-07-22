import type {
	CleaningPdfI18n,
	CleaningPdfInput,
	SavedListDetailForPdf,
} from "@/features/cleaning/lib/cleaning-pdf-types";
import type { RosterDraft } from "@/features/cleaning/lib/roster-types";

export type BuildPdfOpts = {
	title: string;
	orgFallback: string;
	sectorFallback: string;
	emptyName: string;
	i18n: CleaningPdfI18n;
};

function safeOrgName(
	name: string | null | undefined,
	fallback: string,
): string {
	const t = (name ?? "").trim();
	return t.length > 0 ? t : fallback;
}

export function buildPdfInputFromDraft(
	draft: RosterDraft,
	organizationName: string | null | undefined,
	opts: BuildPdfOpts,
): CleaningPdfInput {
	const names = new Map(draft.people.map((p) => [p.id, p.name]));
	const sectors = [...draft.sectors]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((s) => ({
			id: s.id,
			name: s.name || opts.sectorFallback,
			description: s.description ?? null,
			sortOrder: s.sortOrder,
		}));

	const days = draft.days.map((day) => {
		const bySector: Record<string, string[]> = {};
		const visible = day.slots.filter(
			(s) => !day.hiddenSectorIds.includes(s.sectorId),
		);
		const sorted = [...visible].sort(
			(a, b) => a.sectorId.localeCompare(b.sectorId) || a.position - b.position,
		);
		for (const slot of sorted) {
			const n = names.get(slot.personId) ?? opts.emptyName;
			if (!bySector[slot.sectorId]) bySector[slot.sectorId] = [];
			bySector[slot.sectorId].push(n);
		}
		return { date: day.date, bySector };
	});

	return {
		organizationName: safeOrgName(organizationName, opts.orgFallback),
		title: opts.title,
		periodFrom: draft.periodFrom,
		periodTo: draft.periodTo,
		sectors,
		days,
		fileName: `limpeza-${draft.periodFrom}_${draft.periodTo}`,
		i18n: opts.i18n,
	};
}

export function buildPdfInputFromSavedList(
	list: SavedListDetailForPdf,
	organizationName: string | null | undefined,
	opts: BuildPdfOpts,
): CleaningPdfInput {
	const sectorMap = new Map<
		string,
		{ id: string; name: string; description: string | null; sortOrder: number }
	>();

	for (const day of list.days) {
		for (const a of day.assignments) {
			if (!sectorMap.has(a.sectorId)) {
				sectorMap.set(a.sectorId, {
					id: a.sectorId,
					name: a.sectorName || opts.sectorFallback,
					description: a.sectorDescription ?? null,
					sortOrder: a.sortOrder ?? 0,
				});
			}
		}
	}

	const sectors = [...sectorMap.values()].sort(
		(a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
	);

	const days = list.days.map((day) => {
		const bySector: Record<string, string[]> = {};
		const sorted = [...day.assignments].sort(
			(a, b) => a.sectorId.localeCompare(b.sectorId) || a.position - b.position,
		);
		for (const a of sorted) {
			if (!bySector[a.sectorId]) bySector[a.sectorId] = [];
			bySector[a.sectorId].push(a.personName || opts.emptyName);
		}
		return { date: day.date, bySector };
	});

	return {
		organizationName: safeOrgName(organizationName, opts.orgFallback),
		title: opts.title,
		periodFrom: list.periodFrom,
		periodTo: list.periodTo,
		sectors,
		days,
		fileName: `limpeza-${list.periodFrom}_${list.periodTo}`,
		i18n: opts.i18n,
	};
}
