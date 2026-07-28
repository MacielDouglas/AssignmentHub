"use client";

import { PencilLine, Plus, Trash2 } from "lucide-react";
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
const SAFE_TEXT_MAX = 300;
const SAFE_LONG_TEXT_MAX = 500;

function createClientKey(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `mwb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeText(value: string, max = SAFE_TEXT_MAX): string {
	return value.replace(/\s+/g, " ").slice(0, max);
}

function sanitizeNullableText(
	value: string,
	max = SAFE_TEXT_MAX,
): string | null {
	const normalized = sanitizeText(value, max).trim();
	return normalized ? normalized : null;
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
		symbol: sanitizeText(draft.symbol).trim(),
		title: sanitizeText(draft.title, SAFE_LONG_TEXT_MAX).trim(),
		coverTitle: sanitizeNullableText(
			draft.coverTitle ?? "",
			SAFE_LONG_TEXT_MAX,
		),
		year: draft.year,
		month: draft.month,
		weeks: draft.weeks.map((week, weekIndex) => ({
			weekStart: week.weekStart,
			weekEnd: week.weekEnd,
			weekLabelRaw: sanitizeNullableText(
				week.weekLabelRaw ?? "",
				SAFE_LONG_TEXT_MAX,
			),
			dateRangeRaw: sanitizeNullableText(
				week.dateRangeRaw ?? "",
				SAFE_LONG_TEXT_MAX,
			),
			openingSongNum: week.openingSongNum,
			middleSongNum: week.middleSongNum,
			closingSongNum: week.closingSongNum,
			sortOrder: weekIndex,
			sections: week.sections.map((section, sectionIndex) => ({
				name: sanitizeText(section.name, SAFE_LONG_TEXT_MAX).trim(),
				code: section.code,
				sortOrder: sectionIndex,
				parts: section.parts.map((part, partIndex) => ({
					title: sanitizeText(part.title, SAFE_LONG_TEXT_MAX).trim(),
					theme: sanitizeNullableText(part.theme ?? "", SAFE_LONG_TEXT_MAX),
					durationMin: part.durationMin,
					modality: sanitizeNullableText(part.modality ?? "", SAFE_TEXT_MAX),
					source: sanitizeNullableText(part.source ?? "", SAFE_LONG_TEXT_MAX),
					sortOrder: partIndex,
				})),
			})),
		})),
	};
}

function SectionShell({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-4 rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
			<div className="space-y-1">
				<h3 className="text-base font-semibold text-foreground">{title}</h3>
				{subtitle ? (
					<p className="text-sm leading-relaxed text-muted-foreground">
						{subtitle}
					</p>
				) : null}
			</div>
			{children}
		</section>
	);
}

export function MwbIssueEditDialog({ slug, issue, trigger }: Props) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<IssueDraft>(() => issueToDraft(issue));
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && pending) return;

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

			<DialogContent className="max-h-dvh w-[calc(100%-1rem)] max-w-4xl overflow-y-auto rounded-[32px] border border-border bg-background p-0 shadow-xl sm:max-h-[92dvh] sm:w-full">
				<DialogHeader className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 text-left backdrop-blur-md sm:px-5">
					<div className="flex items-start gap-3 pr-8">
						<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<PencilLine className="size-5" aria-hidden="true" />
						</div>

						<div className="min-w-0 space-y-1">
							<DialogTitle className="text-base font-semibold leading-6 text-foreground sm:text-lg">
								Editar apostila
							</DialogTitle>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Ajuste os dados gerais, semanas, seções e partes mantendo o
								padrão mobile do catálogo.
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
					<SectionShell
						title="Dados da edição"
						subtitle="Informações principais da apostila, idioma e período de referência."
					>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="mwb-edit-symbol">Símbolo</Label>
								<Input
									id="mwb-edit-symbol"
									value={draft.symbol}
									disabled={pending}
									maxLength={50}
									autoCapitalize="none"
									autoCorrect="off"
									spellCheck={false}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											symbol: sanitizeText(event.target.value, 50),
										}))
									}
									className="min-h-11 rounded-2xl bg-muted/60"
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
									className="min-h-11 w-full rounded-2xl border border-border bg-muted/60 px-3 text-sm outline-none ring-0"
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
									maxLength={SAFE_LONG_TEXT_MAX}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											title: sanitizeText(
												event.target.value,
												SAFE_LONG_TEXT_MAX,
											),
										}))
									}
									className="min-h-11 rounded-2xl bg-muted/60"
								/>
							</div>

							<div className="space-y-2 sm:col-span-2">
								<Label htmlFor="mwb-edit-cover">Título de capa</Label>
								<Input
									id="mwb-edit-cover"
									value={draft.coverTitle ?? ""}
									disabled={pending}
									maxLength={SAFE_LONG_TEXT_MAX}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											coverTitle: sanitizeNullableText(
												event.target.value,
												SAFE_LONG_TEXT_MAX,
											),
										}))
									}
									className="min-h-11 rounded-2xl bg-muted/60"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="mwb-edit-year">Ano</Label>
								<Input
									id="mwb-edit-year"
									type="number"
									min={2000}
									max={2100}
									inputMode="numeric"
									value={draft.year ?? ""}
									disabled={pending}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											year: parseOptionalInt(event.target.value),
										}))
									}
									className="min-h-11 rounded-2xl bg-muted/60"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="mwb-edit-month">Mês</Label>
								<Input
									id="mwb-edit-month"
									type="number"
									min={1}
									max={12}
									inputMode="numeric"
									value={draft.month ?? ""}
									disabled={pending}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											month: parseOptionalInt(event.target.value),
										}))
									}
									className="min-h-11 rounded-2xl bg-muted/60"
								/>
							</div>
						</div>
					</SectionShell>

					<section className="space-y-4">
						{draft.weeks.map((week, weekIndex) => (
							<article
								key={week.clientKey}
								className="space-y-4 rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5"
							>
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div className="space-y-1">
										<p className="inline-flex min-h-8 items-center rounded-full bg-primary/10 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
											Semana {weekIndex + 1}
										</p>
										<h3 className="text-base font-semibold text-foreground">
											Programação semanal
										</h3>
										<p className="text-sm text-muted-foreground">
											Defina datas, rótulos, cânticos e estrutura das seções.
										</p>
									</div>

									<Button
										type="button"
										variant="ghost"
										disabled={pending || draft.weeks.length <= 1}
										className="min-h-10 rounded-2xl px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
										onClick={() => removeWeek(weekIndex)}
									>
										<Trash2 className="mr-2 size-4" aria-hidden="true" />
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
											className="min-h-11 rounded-2xl bg-muted/60"
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
											className="min-h-11 rounded-2xl bg-muted/60"
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
											maxLength={SAFE_LONG_TEXT_MAX}
											onChange={(event) =>
												updateWeek(weekIndex, {
													weekLabelRaw: sanitizeNullableText(
														event.target.value,
														SAFE_LONG_TEXT_MAX,
													),
												})
											}
											className="min-h-11 rounded-2xl bg-muted/60"
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
											maxLength={SAFE_LONG_TEXT_MAX}
											onChange={(event) =>
												updateWeek(weekIndex, {
													dateRangeRaw: sanitizeNullableText(
														event.target.value,
														SAFE_LONG_TEXT_MAX,
													),
												})
											}
											className="min-h-11 rounded-2xl bg-muted/60"
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
													inputMode="numeric"
													value={week[field] ?? ""}
													disabled={pending}
													onChange={(event) =>
														updateWeek(weekIndex, {
															[field]: parseOptionalInt(event.target.value),
														})
													}
													className="min-h-11 rounded-2xl bg-muted/60"
												/>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-3">
									{week.sections.map((section, sectionIndex) => (
										<div
											key={section.clientKey}
											className="space-y-3 rounded-[24px] border border-border bg-muted/70 p-3 sm:p-4"
										>
											<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
												<div className="space-y-1">
													<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
														Seção {sectionIndex + 1}
													</p>
													<p className="text-sm text-muted-foreground">
														Nome, código e partes da seção.
													</p>
												</div>

												<Button
													type="button"
													variant="ghost"
													disabled={pending || week.sections.length <= 1}
													className="min-h-10 rounded-2xl px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
													onClick={() => removeSection(weekIndex, sectionIndex)}
												>
													<Trash2 className="mr-2 size-4" aria-hidden="true" />
													Remover seção
												</Button>
											</div>

											<Input
												value={section.name}
												disabled={pending}
												aria-label={`Nome da seção ${sectionIndex + 1}`}
												maxLength={SAFE_LONG_TEXT_MAX}
												onChange={(event) =>
													updateSection(weekIndex, sectionIndex, {
														name: sanitizeText(
															event.target.value,
															SAFE_LONG_TEXT_MAX,
														),
													})
												}
												className="min-h-11 rounded-2xl bg-background font-medium"
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
												className="min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none ring-0"
											>
												<option value="">Sem código</option>
												<option value="TREASURES">Tesouros</option>
												<option value="APPLY">Faça seu melhor</option>
												<option value="LIVING">Nossa vida cristã</option>
											</select>

											<div className="space-y-3">
												{section.parts.map((part, partIndex) => (
													<div
														key={part.clientKey}
														className="space-y-3 rounded-[20px] border border-border bg-card p-3"
													>
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium text-foreground">
																Parte {partIndex + 1}
															</p>

															<Button
																type="button"
																variant="ghost"
																disabled={pending || section.parts.length <= 1}
																className="min-h-10 rounded-2xl px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
																onClick={() =>
																	removePart(weekIndex, sectionIndex, partIndex)
																}
															>
																<Trash2
																	className="mr-2 size-4"
																	aria-hidden="true"
																/>
																Remover
															</Button>
														</div>

														<div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_6rem]">
															<Input
																value={part.title}
																disabled={pending}
																placeholder="Título da parte"
																aria-label="Título da parte"
																maxLength={SAFE_LONG_TEXT_MAX}
																onChange={(event) =>
																	updatePart(
																		weekIndex,
																		sectionIndex,
																		partIndex,
																		{
																			title: sanitizeText(
																				event.target.value,
																				SAFE_LONG_TEXT_MAX,
																			),
																		},
																	)
																}
																className="min-h-11 rounded-2xl bg-muted/60"
															/>

															<Input
																type="number"
																min={0}
																max={180}
																inputMode="numeric"
																value={part.durationMin ?? ""}
																disabled={pending}
																placeholder="Min."
																aria-label="Duração em minutos"
																onChange={(event) =>
																	updatePart(
																		weekIndex,
																		sectionIndex,
																		partIndex,
																		{
																			durationMin: parseOptionalInt(
																				event.target.value,
																			),
																		},
																	)
																}
																className="min-h-11 rounded-2xl bg-muted/60"
															/>
														</div>

														<Input
															value={part.theme ?? ""}
															disabled={pending}
															placeholder="Tema"
															aria-label="Tema da parte"
															maxLength={SAFE_LONG_TEXT_MAX}
															onChange={(event) =>
																updatePart(weekIndex, sectionIndex, partIndex, {
																	theme: sanitizeNullableText(
																		event.target.value,
																		SAFE_LONG_TEXT_MAX,
																	),
																})
															}
															className="min-h-11 rounded-2xl bg-muted/60"
														/>

														<div className="grid gap-2 sm:grid-cols-2">
															<Input
																value={part.modality ?? ""}
																disabled={pending}
																placeholder="Modalidade"
																aria-label="Modalidade"
																maxLength={SAFE_TEXT_MAX}
																onChange={(event) =>
																	updatePart(
																		weekIndex,
																		sectionIndex,
																		partIndex,
																		{
																			modality: sanitizeNullableText(
																				event.target.value,
																				SAFE_TEXT_MAX,
																			),
																		},
																	)
																}
																className="min-h-11 rounded-2xl bg-muted/60"
															/>

															<Input
																value={part.source ?? ""}
																disabled={pending}
																placeholder="Fonte / referência"
																aria-label="Fonte ou referência"
																maxLength={SAFE_LONG_TEXT_MAX}
																onChange={(event) =>
																	updatePart(
																		weekIndex,
																		sectionIndex,
																		partIndex,
																		{
																			source: sanitizeNullableText(
																				event.target.value,
																				SAFE_LONG_TEXT_MAX,
																			),
																		},
																	)
																}
																className="min-h-11 rounded-2xl bg-muted/60"
															/>
														</div>
													</div>
												))}
											</div>

											<Button
												type="button"
												variant="outline"
												disabled={pending}
												className="min-h-11 w-full rounded-2xl border-dashed"
												onClick={() => addPart(weekIndex, sectionIndex)}
											>
												<Plus className="mr-2 size-4" aria-hidden="true" />
												Adicionar parte
											</Button>
										</div>
									))}
								</div>

								<Button
									type="button"
									variant="outline"
									disabled={pending}
									className="min-h-11 w-full rounded-2xl border-dashed"
									onClick={() => addSection(weekIndex)}
								>
									<Plus className="mr-2 size-4" aria-hidden="true" />
									Adicionar seção
								</Button>
							</article>
						))}
					</section>

					<Button
						type="button"
						variant="outline"
						disabled={pending}
						className="min-h-11 w-full rounded-[24px] border-dashed"
						onClick={addWeek}
					>
						<Plus className="mr-2 size-4" aria-hidden="true" />
						Adicionar semana
					</Button>

					{error ? (
						<p
							className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950/60 dark:bg-red-950/30 dark:text-red-300"
							role="alert"
						>
							{error}
						</p>
					) : null}

					<div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-4 pt-4 pb-[calc(0.25rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:-mx-5 sm:flex-row sm:justify-end sm:px-5">
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
							className="min-h-11 rounded-2xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
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
