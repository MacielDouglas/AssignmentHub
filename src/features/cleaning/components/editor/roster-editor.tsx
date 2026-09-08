"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { HiOutlineCheck } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { historyWithDraftBefore } from "@/features/cleaning/lib/draft-history";
import { isEligibleForSector } from "@/features/cleaning/lib/eligibility";
import {
	lastAssignmentsForDisplay,
	recentAssignmentsWithSector,
	sortCandidatesByLeastRecent,
} from "@/features/cleaning/lib/fairness";
import type {
	EligiblePerson,
	FairnessHistory,
	RosterDraft,
	RosterSector,
	RosterSlot,
} from "@/features/cleaning/lib/roster-types";
import { SectorIcon } from "@/features/cleaning/lib/sector-icons";

type Props = {
	draft: RosterDraft;
	onChange: (d: RosterDraft) => void;
	history?: FairnessHistory;
};

function formatBr(dateKey: string) {
	const [y, m, d] = dateKey.split("-");
	return `${d}/${m}/${y}`;
}

function stableSlotId(date: string, slot: RosterSlot) {
	return `${date}:${slot.sectorId}:${slot.position}`;
}

function SectorFilterBadges({ sector }: { sector: RosterSector }) {
	const t = useTranslations("CleaningEditor");
	const badges: string[] = [];
	if (sector.targetSex === "MALE") badges.push(t("filterMale"));
	else if (sector.targetSex === "FEMALE") badges.push(t("filterFemale"));
	if (!sector.allowYoung) badges.push(t("adultOnly"));
	if (badges.length === 0) return null;
	return (
		<div className="flex flex-wrap gap-1">
			{badges.map((b) => (
				<span
					key={b}
					className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
				>
					{b}
				</span>
			))}
		</div>
	);
}

function LastAssignments({
	personId,
	sectorId,
	history,
}: {
	personId: string;
	sectorId: string;
	history?: FairnessHistory;
}) {
	const t = useTranslations("CleaningEditor");
	if (!history) return null;
	const items = lastAssignmentsForDisplay(personId, sectorId, history, 6);
	// Se a pessoa nunca foi designada, não mostra nada.
	if (items.length === 0) return null;
	return (
		<div className="space-y-1 rounded-2xl border border-border bg-muted/60 px-3 py-2">
			<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{t("lastAssignments")}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{items.map((it) => (
					<span
						key={it.date}
						title={it.isSameSector ? t("sameSectorHint") : t("otherSectorHint")}
						className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
							it.isSameSector
								? "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
								: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
						}`}
					>
						{formatBr(it.date)}
					</span>
				))}
			</div>
			<p className="text-[11px] text-muted-foreground">{t("colorLegend")}</p>
		</div>
	);
}

function CandidateRowIcons({
	person,
	currentSectorId,
	history,
	sectorNameById,
}: {
	person: EligiblePerson;
	currentSectorId: string;
	history?: FairnessHistory;
	sectorNameById: Map<string, string>;
}) {
	const t = useTranslations("CleaningEditor");
	if (!history) return null;
	const recents = recentAssignmentsWithSector(
		person.id,
		currentSectorId,
		history,
		4,
	);
	if (recents.length === 0) {
		return (
			<span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
				{t("neverCleaned")}
			</span>
		);
	}
	return (
		<span className="flex shrink-0 items-center gap-1">
			{recents.map((r) => {
				const sectorName =
					sectorNameById.get(r.sectorId) ?? t("otherSectorHint");
				return (
					<span
						key={`${r.date}-${r.sectorId}`}
						title={`${sectorName} · ${formatBr(r.date)}`}
						className={
							r.isSameSector
								? "text-red-600"
								: "text-blue-600 dark:text-blue-400"
						}
					>
						<SectorIcon name={sectorName} className="h-4 w-4" />
					</span>
				);
			})}
		</span>
	);
}

function SlotEditor({
	slot,
	sector,
	people,
	history,
	sectorNameById,
	isOpen,
	onToggle,
	onSelect,
	personName,
}: {
	slot: RosterSlot;
	sector: RosterSector;
	people: EligiblePerson[];
	history?: FairnessHistory;
	sectorNameById: Map<string, string>;
	isOpen: boolean;
	onToggle: () => void;
	onSelect: (personId: string) => void;
	personName: (id: string) => string;
}) {
	const t = useTranslations("CleaningEditor");
	const [search, setSearch] = useState("");

	const orderedOptions = useMemo(() => {
		const eligible = people.filter((p) =>
			isEligibleForSector(p, sector, false),
		);
		const current = people.find((p) => p.id === slot.personId);
		const base =
			current && !eligible.some((p) => p.id === current.id)
				? [current, ...eligible]
				: eligible;
		if (!history) {
			return [...base].sort((a, b) => a.name.localeCompare(b.name));
		}
		// Quem nunca limpou ou limpou há mais tempo primeiro.
		const currentFirst =
			current && !eligible.some((p) => p.id === current.id) ? [current] : [];
		const rest = base.filter((p) => !currentFirst.some((c) => c.id === p.id));
		return [...currentFirst, ...sortCandidatesByLeastRecent(rest, history)];
	}, [people, sector, slot.personId, history]);

	const visibleOptions = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return orderedOptions;
		return orderedOptions.filter((p) => p.name.toLowerCase().includes(q));
	}, [orderedOptions, search]);

	return (
		<div className="space-y-2 rounded-2xl border border-border px-3 py-2">
			<div className="flex items-center justify-between gap-2">
				<p className="truncate text-sm text-foreground">
					{personName(slot.personId)}
					{slot.isManual ? (
						<span className="text-xs text-muted-foreground">
							{t("manualSuffix")}
						</span>
					) : null}
				</p>
				<Button
					type="button"
					variant="outline"
					className="h-8 shrink-0 rounded-xl px-2 text-xs"
					onClick={onToggle}
					aria-expanded={isOpen}
				>
					{isOpen ? t("close") : t("change")}
				</Button>
			</div>

			{isOpen ? (
				<div className="space-y-2">
					<input
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("searchPerson")}
						className="h-9 w-full rounded-xl border border-border bg-card px-2 text-sm"
						aria-label={t("searchPerson")}
					/>
					<div
						role="listbox"
						aria-label={t("changePersonLabel", { sector: sector.name })}
						className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-1"
					>
						{visibleOptions.map((p) => {
							const selected = p.id === slot.personId;
							return (
								<div key={p.id}>
									<button
										type="button"
										role="option"
										aria-selected={selected}
										onClick={() => onSelect(p.id)}
										className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
											selected
												? "bg-primary/10 font-semibold text-foreground"
												: "text-foreground hover:bg-muted"
										}`}
									>
										<span className="flex min-w-0 items-center gap-2">
											{selected ? (
												<HiOutlineCheck className="h-4 w-4 shrink-0 text-primary" />
											) : (
												<span className="h-4 w-4 shrink-0" />
											)}
											<span className="truncate">{p.name}</span>
										</span>
										<CandidateRowIcons
											person={p}
											currentSectorId={sector.id}
											history={history}
											sectorNameById={sectorNameById}
										/>
									</button>
								</div>
							);
						})}
					</div>
					<p className="text-[11px] text-muted-foreground">
						{t("filteredCount", {
							shown: orderedOptions.length,
							total: people.length,
						})}
					</p>
					<LastAssignments
						personId={slot.personId}
						sectorId={sector.id}
						history={history}
					/>
				</div>
			) : null}
		</div>
	);
}

export function RosterEditor({ draft, onChange, history }: Props) {
	const t = useTranslations("CleaningEditor");
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const sectorNameById = useMemo(
		() => new Map(draft.sectors.map((s) => [s.id, s.name] as const)),
		[draft.sectors],
	);

	// Histórico efetivo por data: banco + designações do rascunho (não salvas)
	// estritamente anteriores, em sequência. Ex.: ao analisar 12/09, a
	// designação feita em 09/09 no próprio rascunho já conta.
	const historiesByDate = useMemo(() => {
		const map = new Map<string, FairnessHistory | undefined>();
		if (!history) return map;
		for (const day of draft.days) {
			if (!map.has(day.date)) {
				map.set(day.date, historyWithDraftBefore(history, draft, day.date));
			}
		}
		return map;
	}, [history, draft]);

	const personName = (id: string) =>
		draft.people.find((p) => p.id === id)?.name ?? t("emDash");

	const updateDaySlots = (date: string, slots: RosterSlot[]) => {
		onChange({
			...draft,
			days: draft.days.map((d) => (d.date === date ? { ...d, slots } : d)),
		});
	};

	const hideSector = (date: string, sectorId: string) => {
		onChange({
			...draft,
			days: draft.days.map((d) => {
				if (d.date !== date) return d;
				return {
					...d,
					hiddenSectorIds: [...new Set([...d.hiddenSectorIds, sectorId])],
					slots: d.slots.filter((s) => s.sectorId !== sectorId),
				};
			}),
		});
	};

	const changePerson = (date: string, slotKey: string, personId: string) => {
		const person = draft.people.find((p) => p.id === personId);
		if (!person) return;

		updateDaySlots(
			date,
			(draft.days.find((d) => d.date === date)?.slots ?? []).map((s) =>
				s.key === slotKey
					? {
							...s,
							personId,
							familyId: person.familyId,
							groupId: person.groupId,
							isManual: true,
							key: `${date}:${s.sectorId}:${personId}:${s.position}`,
						}
					: s,
			),
		);
	};

	const toggleExpand = (id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<div className="space-y-4">
			{draft.days.map((day) => {
				const visibleSectors = draft.sectors.filter(
					(s) => !day.hiddenSectorIds.includes(s.id),
				);

				return (
					<article
						key={day.date}
						className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm"
					>
						<header className="border-b border-border bg-muted px-4 py-3">
							<p className="text-title text-foreground">{formatBr(day.date)}</p>
							{day.label ? (
								<p className="text-xs text-muted-foreground">{day.label}</p>
							) : null}
						</header>

						<ul className="divide-y divide-border">
							{visibleSectors.map((sector) => {
								const slots = day.slots
									.filter((s) => s.sectorId === sector.id)
									.sort((a, b) => a.position - b.position);

								return (
									<li key={sector.id} className="space-y-2 px-4 py-3">
										<div className="flex items-start justify-between gap-2">
											<div className="space-y-1">
												<p className="flex items-center gap-2 text-sm font-medium text-foreground">
													<SectorIcon
														name={sector.name}
														className="h-4 w-4 shrink-0 text-primary"
													/>
													{sector.name}
												</p>
												{sector.description ? (
													<p className="line-clamp-2 text-xs text-muted-foreground">
														{sector.description}
													</p>
												) : null}
												<SectorFilterBadges sector={sector} />
											</div>
											<Button
												type="button"
												variant="outline"
												className="h-8 shrink-0 rounded-xl px-2 text-xs"
												onClick={() => hideSector(day.date, sector.id)}
											>
												{t("hide")}
											</Button>
										</div>

										{slots.length === 0 ? (
											<p className="text-xs text-amber-600">
												{t("noAssignment")}
											</p>
										) : (
											<div className="space-y-3">
												{slots.map((slot) => (
													<SlotEditor
														key={slot.key}
														slot={slot}
														sector={sector}
														people={draft.people}
														history={historiesByDate.get(day.date) ?? history}
														sectorNameById={sectorNameById}
														isOpen={expanded.has(stableSlotId(day.date, slot))}
														onToggle={() =>
															toggleExpand(stableSlotId(day.date, slot))
														}
														onSelect={(personId) =>
															changePerson(day.date, slot.key, personId)
														}
														personName={personName}
													/>
												))}
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</article>
				);
			})}
		</div>
	);
}
