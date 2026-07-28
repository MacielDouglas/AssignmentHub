"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type {
	RosterDraft,
	RosterSlot,
} from "@/features/cleaning/lib/roster-types";

type Props = {
	draft: RosterDraft;
	onChange: (d: RosterDraft) => void;
};

function formatBr(dateKey: string) {
	const [y, m, d] = dateKey.split("-");
	return `${d}/${m}/${y}`;
}

export function RosterEditor({ draft, onChange }: Props) {
	const t = useTranslations("CleaningEditor");

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
											<div>
												<p className="text-sm font-medium text-foreground">
													{sector.name}
												</p>
												{sector.description ? (
													<p className="line-clamp-2 text-xs text-muted-foreground">
														{sector.description}
													</p>
												) : null}
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
											<div className="space-y-2">
												{slots.map((slot) => (
													<div
														key={slot.key}
														className="flex items-center gap-2"
													>
														<select
															value={slot.personId}
															onChange={(e) =>
																changePerson(day.date, slot.key, e.target.value)
															}
															className="h-10 w-full rounded-xl border border-border bg-card px-2 text-sm"
														>
															{draft.people.map((p) => (
																<option key={p.id} value={p.id}>
																	{p.name}
																	{slot.isManual && p.id === slot.personId
																		? t("manualSuffix")
																		: ""}
																</option>
															))}
														</select>
														<span className="sr-only">
															{personName(slot.personId)}
														</span>
													</div>
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
