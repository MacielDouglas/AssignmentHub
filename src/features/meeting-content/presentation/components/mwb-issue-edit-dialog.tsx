"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { MwbIssueUpdateInput } from "../../application/dto/mwb-extract.dto";
import type { MwbIssueEntity } from "../../domain/entities/mwb";
import { updateMwbIssueAction } from "../actions/mwb.actions";

type Props = {
	slug: string;
	issue: MwbIssueEntity;
	trigger: ReactNode;
};

type SongField = "openingSongNum" | "middleSongNum" | "closingSongNum";
type SectionCode = "TREASURES" | "APPLY" | "LIVING" | null;

type WeekBase = MwbIssueUpdateInput["weeks"][number];
type SectionBase = WeekBase["sections"][number];
type PartBase = SectionBase["parts"][number];

type PartDraft = PartBase & {
	clientKey: string;
};

type SectionDraft = Omit<SectionBase, "parts"> & {
	clientKey: string;
	parts: PartDraft[];
};

type WeekDraft = Omit<WeekBase, "sections"> & {
	clientKey: string;
	sections: SectionDraft[];
};

type IssueDraft = Omit<MwbIssueUpdateInput, "weeks"> & {
	weeks: WeekDraft[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function createClientKey(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `mwb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseOptionalInt(raw: string): number | null {
	if (raw === "") return null;

	const value = Number(raw);
	return Number.isFinite(value) ? value : null;
}

function createEmptyPart(sortOrder: number): PartDraft {
	return {
		clientKey: createClientKey(),
		title: "Nova parte",
		theme: null,
		durationMin: null,
		modality: null,
		source: null,
		sortOrder,
	};
}

function createEmptySection(sortOrder: number): SectionDraft {
	return {
		clientKey: createClientKey(),
		name: "Tesouros da Palavra de Deus",
		code: "TREASURES",
		sortOrder,
		parts: [createEmptyPart(0)],
	};
}

function createEmptyWeek(sortOrder: number, after?: WeekDraft): WeekDraft {
	let weekStart = "";
	let weekEnd = "";

	if (after && ISO_DATE.test(after.weekEnd)) {
		const base = new Date(`${after.weekEnd}T00:00:00.000Z`);

		if (!Number.isNaN(base.getTime())) {
			const start = new Date(base);
			start.setUTCDate(start.getUTCDate() + 1);

			const end = new Date(start);
			end.setUTCDate(end.getUTCDate() + 6);

			weekStart = start.toISOString().slice(0, 10);
			weekEnd = end.toISOString().slice(0, 10);
		}
	}

	return {
		clientKey: createClientKey(),
		weekStart,
		weekEnd,
		weekLabelRaw: null,
		dateRangeRaw: null,
		openingSongNum: null,
		middleSongNum: null,
		closingSongNum: null,
		sortOrder,
		sections: [createEmptySection(0)],
	};
}

function issueToDraft(issue: MwbIssueEntity): IssueDraft {
	return {
		id: issue.id,
		locale: issue.locale,
		symbol: issue.symbol,
		title: issue.title,
		coverTitle: issue.coverTitle,
		year: issue.year,
		month: issue.month,
		weeks: issue.weeks.map((week, weekIndex) => ({
			clientKey: week.id || createClientKey(),
			weekStart: week.weekStart,
			weekEnd: week.weekEnd,
			weekLabelRaw: week.weekLabelRaw,
			dateRangeRaw: week.dateRangeRaw,
			openingSongNum: week.openingSongNum,
			middleSongNum: week.middleSongNum,
			closingSongNum: week.closingSongNum,
			sortOrder: weekIndex,
			sections: week.sections.map((section, sectionIndex) => ({
				clientKey: section.id || createClientKey(),
				name: section.name,
				code: section.code,
				sortOrder: sectionIndex,
				parts: section.parts.map((part, partIndex) => ({
					clientKey: part.id || createClientKey(),
					title: part.title,
					theme: part.theme,
					durationMin: part.durationMin,
					modality: part.modality,
					source: part.source,
					sortOrder: partIndex,
				})),
			})),
		})),
	};
}

function validateDraft(draft: IssueDraft): string | null {
	if (!draft.symbol.trim()) {
		return "Informe o símbolo da edição.";
	}

	if (!draft.title.trim()) {
		return "Informe o título da edição.";
	}

	if (draft.weeks.length === 0) {
		return "Inclua ao menos uma semana.";
	}

	for (let weekIndex = 0; weekIndex < draft.weeks.length; weekIndex += 1) {
		const week = draft.weeks[weekIndex];

		if (!week) continue;

		if (!ISO_DATE.test(week.weekStart) || !ISO_DATE.test(week.weekEnd)) {
			return `Semana ${weekIndex + 1}: informe datas válidas para início e fim.`;
		}

		if (week.weekEnd < week.weekStart) {
			return `Semana ${weekIndex + 1}: a data final não pode ser anterior ao início.`;
		}

		if (week.sections.length === 0) {
			return `Semana ${weekIndex + 1}: inclua ao menos uma seção.`;
		}

		for (
			let sectionIndex = 0;
			sectionIndex < week.sections.length;
			sectionIndex += 1
		) {
			const section = week.sections[sectionIndex];

			if (!section?.name.trim()) {
				return `Semana ${weekIndex + 1}, seção ${sectionIndex + 1}: informe o nome.`;
			}

			if (section.parts.length === 0) {
				return `Semana ${weekIndex + 1}, seção ${sectionIndex + 1}: inclua ao menos uma parte.`;
			}

			for (
				let partIndex = 0;
				partIndex < section.parts.length;
				partIndex += 1
			) {
				const part = section.parts[partIndex];

				if (!part?.title.trim()) {
					return `Semana ${weekIndex + 1}, seção ${sectionIndex + 1}, parte ${partIndex + 1}: informe o título.`;
				}

				if (
					typeof part.durationMin === "number" &&
					(part.durationMin < 0 || part.durationMin > 180)
				) {
					return `Semana ${weekIndex + 1}, seção ${sectionIndex + 1}, parte ${partIndex + 1}: a duração deve estar entre 0 e 180 minutos.`;
				}
			}
		}
	}

	return null;
}

function toUpdateInput(draft: IssueDraft): MwbIssueUpdateInput {
	return {
		id: draft.id,
		locale: draft.locale,
		symbol: draft.symbol.trim(),
		title: draft.title.trim(),
		coverTitle: draft.coverTitle?.trim() || null,
		year: draft.year,
		month: draft.month,
		weeks: draft.weeks.map((week, weekIndex) => ({
			weekStart: week.weekStart,
			weekEnd: week.weekEnd,
			weekLabelRaw: week.weekLabelRaw?.trim() || null,
			dateRangeRaw: week.dateRangeRaw?.trim() || null,
			openingSongNum: week.openingSongNum,
			middleSongNum: week.middleSongNum,
			closingSongNum: week.closingSongNum,
			sortOrder: weekIndex,
			sections: week.sections.map((section, sectionIndex) => ({
				name: section.name.trim(),
				code: section.code,
				sortOrder: sectionIndex,
				parts: section.parts.map((part, partIndex) => ({
					title: part.title.trim(),
					theme: part.theme?.trim() || null,
					durationMin: part.durationMin,
					modality: part.modality?.trim() || null,
					source: part.source?.trim() || null,
					sortOrder: partIndex,
				})),
			})),
		})),
	};
}

export function MwbIssueEditDialog({ slug, issue, trigger }: Props) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<IssueDraft>(() => issueToDraft(issue));
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);

		if (nextOpen) {
			setDraft(issueToDraft(issue));
			setError(null);
		}
	}

	function updateWeek(weekIndex: number, patch: Partial<WeekDraft>) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks.map((week, index) =>
				index === weekIndex ? { ...week, ...patch } : week,
			),
		}));
	}

	function updateSection(
		weekIndex: number,
		sectionIndex: number,
		patch: Partial<SectionDraft>,
	) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks.map((week, currentWeekIndex) => {
				if (currentWeekIndex !== weekIndex) return week;

				return {
					...week,
					sections: week.sections.map((section, currentSectionIndex) =>
						currentSectionIndex === sectionIndex
							? { ...section, ...patch }
							: section,
					),
				};
			}),
		}));
	}

	function updatePart(
		weekIndex: number,
		sectionIndex: number,
		partIndex: number,
		patch: Partial<PartDraft>,
	) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks.map((week, currentWeekIndex) => {
				if (currentWeekIndex !== weekIndex) return week;

				return {
					...week,
					sections: week.sections.map((section, currentSectionIndex) => {
						if (currentSectionIndex !== sectionIndex) return section;

						return {
							...section,
							parts: section.parts.map((part, currentPartIndex) =>
								currentPartIndex === partIndex ? { ...part, ...patch } : part,
							),
						};
					}),
				};
			}),
		}));
	}

	function removeWeek(weekIndex: number) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks
				.filter((_, index) => index !== weekIndex)
				.map((week, index) => ({
					...week,
					sortOrder: index,
				})),
		}));
	}

	function removeSection(weekIndex: number, sectionIndex: number) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks.map((week, currentWeekIndex) => {
				if (currentWeekIndex !== weekIndex) return week;

				return {
					...week,
					sections: week.sections
						.filter((_, index) => index !== sectionIndex)
						.map((section, index) => ({
							...section,
							sortOrder: index,
						})),
				};
			}),
		}));
	}

	function removePart(
		weekIndex: number,
		sectionIndex: number,
		partIndex: number,
	) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks.map((week, currentWeekIndex) => {
				if (currentWeekIndex !== weekIndex) return week;

				return {
					...week,
					sections: week.sections.map((section, currentSectionIndex) => {
						if (currentSectionIndex !== sectionIndex) return section;

						return {
							...section,
							parts: section.parts
								.filter((_, index) => index !== partIndex)
								.map((part, index) => ({
									...part,
									sortOrder: index,
								})),
						};
					}),
				};
			}),
		}));
	}

	function addWeek() {
		setDraft((current) => ({
			...current,
			weeks: [
				...current.weeks,
				createEmptyWeek(
					current.weeks.length,
					current.weeks[current.weeks.length - 1],
				),
			],
		}));
	}

	function addSection(weekIndex: number) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks.map((week, index) => {
				if (index !== weekIndex) return week;

				return {
					...week,
					sections: [
						...week.sections,
						createEmptySection(week.sections.length),
					],
				};
			}),
		}));
	}

	function addPart(weekIndex: number, sectionIndex: number) {
		setDraft((current) => ({
			...current,
			weeks: current.weeks.map((week, currentWeekIndex) => {
				if (currentWeekIndex !== weekIndex) return week;

				return {
					...week,
					sections: week.sections.map((section, currentSectionIndex) => {
						if (currentSectionIndex !== sectionIndex) return section;

						return {
							...section,
							parts: [...section.parts, createEmptyPart(section.parts.length)],
						};
					}),
				};
			}),
		}));
	}

	function save() {
		const localError = validateDraft(draft);

		if (localError) {
			setError(localError);
			return;
		}

		setError(null);

		startTransition(async () => {
			const result = await updateMwbIssueAction(slug, toUpdateInput(draft));

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
		});
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto rounded-[28px] p-0">
				<DialogHeader className="border-b border-slate-200 px-5 py-4 text-left dark:border-slate-800">
					<DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
						Editar apostila
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 px-5 py-5">
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="mwb-edit-symbol">Símbolo</Label>
							<Input
								id="mwb-edit-symbol"
								value={draft.symbol}
								disabled={pending}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										symbol: event.target.value,
									}))
								}
								className="min-h-11 rounded-2xl"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mwb-edit-locale">Idioma</Label>
							<select
								id="mwb-edit-locale"
								value={draft.locale}
								disabled={pending}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										locale: event.target.value as IssueDraft["locale"],
									}))
								}
								className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
							>
								<option value="pt">Português</option>
								<option value="es">Español</option>
							</select>
						</div>

						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="mwb-edit-title">Título</Label>
							<Input
								id="mwb-edit-title"
								value={draft.title}
								disabled={pending}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										title: event.target.value,
									}))
								}
								className="min-h-11 rounded-2xl"
							/>
						</div>

						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="mwb-edit-cover">Título de capa</Label>
							<Input
								id="mwb-edit-cover"
								value={draft.coverTitle ?? ""}
								disabled={pending}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										coverTitle: event.target.value || null,
									}))
								}
								className="min-h-11 rounded-2xl"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mwb-edit-year">Ano</Label>
							<Input
								id="mwb-edit-year"
								type="number"
								min={2000}
								max={2100}
								value={draft.year ?? ""}
								disabled={pending}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										year: parseOptionalInt(event.target.value),
									}))
								}
								className="min-h-11 rounded-2xl"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="mwb-edit-month">Mês</Label>
							<Input
								id="mwb-edit-month"
								type="number"
								min={1}
								max={12}
								value={draft.month ?? ""}
								disabled={pending}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										month: parseOptionalInt(event.target.value),
									}))
								}
								className="min-h-11 rounded-2xl"
							/>
						</div>
					</div>

					{draft.weeks.map((week, weekIndex) => (
						<article
							key={week.clientKey}
							className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
						>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
									Semana {weekIndex + 1}
								</p>

								<Button
									type="button"
									variant="ghost"
									disabled={pending || draft.weeks.length <= 1}
									className="min-h-10 text-red-600 hover:text-red-700"
									onClick={() => removeWeek(weekIndex)}
								>
									Remover semana
								</Button>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor={`mwb-week-start-${week.clientKey}`}>
										Início (segunda)
									</Label>
									<Input
										id={`mwb-week-start-${week.clientKey}`}
										type="date"
										value={week.weekStart}
										disabled={pending}
										onChange={(event) =>
											updateWeek(weekIndex, {
												weekStart: event.target.value,
											})
										}
										className="min-h-11 rounded-2xl"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor={`mwb-week-end-${week.clientKey}`}>
										Fim (domingo)
									</Label>
									<Input
										id={`mwb-week-end-${week.clientKey}`}
										type="date"
										value={week.weekEnd}
										disabled={pending}
										onChange={(event) =>
											updateWeek(weekIndex, {
												weekEnd: event.target.value,
											})
										}
										className="min-h-11 rounded-2xl"
									/>
								</div>

								<div className="space-y-2 sm:col-span-2">
									<Label htmlFor={`mwb-week-label-${week.clientKey}`}>
										Rótulo
									</Label>
									<Input
										id={`mwb-week-label-${week.clientKey}`}
										value={week.weekLabelRaw ?? ""}
										disabled={pending}
										onChange={(event) =>
											updateWeek(weekIndex, {
												weekLabelRaw: event.target.value || null,
											})
										}
										className="min-h-11 rounded-2xl"
									/>
								</div>

								<div className="space-y-2 sm:col-span-2">
									<Label htmlFor={`mwb-week-range-${week.clientKey}`}>
										Intervalo (texto)
									</Label>
									<Input
										id={`mwb-week-range-${week.clientKey}`}
										value={week.dateRangeRaw ?? ""}
										disabled={pending}
										onChange={(event) =>
											updateWeek(weekIndex, {
												dateRangeRaw: event.target.value || null,
											})
										}
										className="min-h-11 rounded-2xl"
									/>
								</div>

								<div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-3">
									{(
										[
											["openingSongNum", "Cântico inicial"],
											["middleSongNum", "Cântico do meio"],
											["closingSongNum", "Cântico final"],
										] as const satisfies ReadonlyArray<
											readonly [SongField, string]
										>
									).map(([field, label]) => (
										<div key={field} className="space-y-2">
											<Label htmlFor={`mwb-${field}-${week.clientKey}`}>
												{label}
											</Label>
											<Input
												id={`mwb-${field}-${week.clientKey}`}
												type="number"
												min={1}
												max={999}
												value={week[field] ?? ""}
												disabled={pending}
												onChange={(event) =>
													updateWeek(weekIndex, {
														[field]: parseOptionalInt(event.target.value),
													})
												}
												className="min-h-11 rounded-2xl"
											/>
										</div>
									))}
								</div>
							</div>

							{week.sections.map((section, sectionIndex) => (
								<div
									key={section.clientKey}
									className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
								>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
											Seção {sectionIndex + 1}
										</p>

										<Button
											type="button"
											variant="ghost"
											disabled={pending || week.sections.length <= 1}
											className="min-h-9 text-red-600"
											onClick={() => removeSection(weekIndex, sectionIndex)}
										>
											Remover seção
										</Button>
									</div>

									<Input
										value={section.name}
										disabled={pending}
										aria-label={`Nome da seção ${sectionIndex + 1}`}
										onChange={(event) =>
											updateSection(weekIndex, sectionIndex, {
												name: event.target.value,
											})
										}
										className="min-h-10 rounded-xl font-medium"
									/>

									<select
										value={section.code ?? ""}
										disabled={pending}
										aria-label={`Código da seção ${sectionIndex + 1}`}
										onChange={(event) => {
											const value = event.target.value;

											const code: SectionCode =
												value === "TREASURES" ||
												value === "APPLY" ||
												value === "LIVING"
													? value
													: null;

											updateSection(weekIndex, sectionIndex, { code });
										}}
										className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
									>
										<option value="">Sem código</option>
										<option value="TREASURES">Tesouros</option>
										<option value="APPLY">Faça seu melhor</option>
										<option value="LIVING">Nossa vida cristã</option>
									</select>

									{section.parts.map((part, partIndex) => (
										<div
											key={part.clientKey}
											className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
										>
											<div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_auto]">
												<Input
													value={part.title}
													disabled={pending}
													placeholder="Título da parte"
													aria-label="Título da parte"
													onChange={(event) =>
														updatePart(weekIndex, sectionIndex, partIndex, {
															title: event.target.value,
														})
													}
													className="min-h-10 rounded-xl"
												/>

												<Input
													type="number"
													min={0}
													max={180}
													value={part.durationMin ?? ""}
													disabled={pending}
													placeholder="Min."
													aria-label="Duração em minutos"
													onChange={(event) =>
														updatePart(weekIndex, sectionIndex, partIndex, {
															durationMin: parseOptionalInt(event.target.value),
														})
													}
													className="min-h-10 rounded-xl"
												/>

												<Button
													type="button"
													variant="ghost"
													disabled={pending || section.parts.length <= 1}
													className="min-h-10 text-red-600"
													onClick={() =>
														removePart(weekIndex, sectionIndex, partIndex)
													}
												>
													Remover
												</Button>
											</div>

											<Input
												value={part.theme ?? ""}
												disabled={pending}
												placeholder="Tema"
												aria-label="Tema da parte"
												onChange={(event) =>
													updatePart(weekIndex, sectionIndex, partIndex, {
														theme: event.target.value || null,
													})
												}
												className="min-h-10 rounded-xl"
											/>

											<div className="grid gap-2 sm:grid-cols-2">
												<Input
													value={part.modality ?? ""}
													disabled={pending}
													placeholder="Modalidade"
													aria-label="Modalidade"
													onChange={(event) =>
														updatePart(weekIndex, sectionIndex, partIndex, {
															modality: event.target.value || null,
														})
													}
													className="min-h-10 rounded-xl"
												/>

												<Input
													value={part.source ?? ""}
													disabled={pending}
													placeholder="Fonte / referência"
													aria-label="Fonte ou referência"
													onChange={(event) =>
														updatePart(weekIndex, sectionIndex, partIndex, {
															source: event.target.value || null,
														})
													}
													className="min-h-10 rounded-xl"
												/>
											</div>
										</div>
									))}

									<Button
										type="button"
										variant="outline"
										disabled={pending}
										className="min-h-10 rounded-xl"
										onClick={() => addPart(weekIndex, sectionIndex)}
									>
										+ Parte
									</Button>
								</div>
							))}

							<Button
								type="button"
								variant="outline"
								disabled={pending}
								className="min-h-10 rounded-xl"
								onClick={() => addSection(weekIndex)}
							>
								+ Seção
							</Button>
						</article>
					))}

					<Button
						type="button"
						variant="outline"
						disabled={pending}
						className="min-h-11 rounded-2xl"
						onClick={addWeek}
					>
						+ Semana
					</Button>

					{error ? (
						<p className="text-sm text-red-600" role="alert">
							{error}
						</p>
					) : null}

					<div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white pt-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={pending}
							className="min-h-11 rounded-2xl"
							onClick={() => setOpen(false)}
						>
							Cancelar
						</Button>

						<Button
							type="button"
							disabled={pending}
							className="min-h-11 rounded-2xl"
							onClick={save}
						>
							{pending ? "Salvando..." : "Salvar alterações"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
