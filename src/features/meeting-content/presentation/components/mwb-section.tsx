"use client";

import { useMemo, useState, useTransition } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

import type { MwbExtract } from "../../application/dto/mwb-extract.dto";
import type { MwbIssueEntity } from "../../domain/entities/mwb";
import type { ContentImportJobEntity } from "../../domain/entities/watchtower-study";
import type { ContentLocale } from "../../domain/values-objects/content-locale";
import { contentLocaleLabel } from "../../domain/values-objects/content-locale";
import {
	commitMwbImportAction,
	createAndProcessMwbImportAction,
	deleteAllMwbIssuesAction,
	deleteMwbIssuesAction,
	discardMwbImportAction,
	updateMwbImportDraftAction,
} from "../actions/mwb.actions";
import { MwbIssueEditDialog } from "./mwb-issue-edit-dialog";

type Props = {
	slug: string;
	canManage: boolean;
	issues: MwbIssueEntity[];
	counts: Array<{ locale: ContentLocale; count: number }>;
	pendingJob: ContentImportJobEntity | null;
};

type MwbWeekBase = MwbExtract["weeks"][number];
type MwbSectionBase = MwbWeekBase["sections"][number];
type MwbPartBase = MwbSectionBase["parts"][number];

type MwbReviewPart = MwbPartBase & {
	clientKey: string;
};

type MwbReviewSection = Omit<MwbSectionBase, "parts"> & {
	clientKey: string;
	parts: MwbReviewPart[];
};

type MwbReviewWeek = Omit<MwbWeekBase, "sections"> & {
	clientKey: string;
	sections: MwbReviewSection[];
};

type MwbReviewDraft = Omit<MwbExtract, "weeks"> & {
	weeks: MwbReviewWeek[];
};

type MwbSongField = "openingSongNum" | "middleSongNum" | "closingSongNum";

function createClientKey(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `mwb-review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatMonth(month: number | null): string {
	if (!month || month < 1 || month > 12) return "—";
	return String(month).padStart(2, "0");
}

function sectionBadge(code: "TREASURES" | "APPLY" | "LIVING" | null): string {
	if (code === "TREASURES") return "Tesouros";
	if (code === "APPLY") return "Ministério";
	if (code === "LIVING") return "Vida cristã";
	return "Seção";
}

function asMwbExtract(value: unknown): MwbExtract | null {
	if (!value || typeof value !== "object") return null;

	const record = value as Partial<MwbExtract>;

	if (
		!Array.isArray(record.weeks) ||
		typeof record.symbol !== "string" ||
		typeof record.title !== "string"
	) {
		return null;
	}

	return value as MwbExtract;
}

function withClientKeys(extract: MwbExtract): MwbReviewDraft {
	return {
		...extract,
		weeks: extract.weeks.map((week) => ({
			...week,
			clientKey: createClientKey(),
			sections: week.sections.map((section) => ({
				...section,
				clientKey: createClientKey(),
				parts: section.parts.map((part) => ({
					...part,
					clientKey: createClientKey(),
				})),
			})),
		})),
	};
}

function stripClientKeys(draft: MwbReviewDraft): MwbExtract {
	return {
		locale: draft.locale,
		symbol: draft.symbol,
		title: draft.title,
		coverTitle: draft.coverTitle,
		year: draft.year,
		month: draft.month,
		weeks: draft.weeks.map((week) => ({
			weekStart: week.weekStart,
			weekEnd: week.weekEnd,
			weekLabelRaw: week.weekLabelRaw,
			dateRangeRaw: week.dateRangeRaw,
			openingSongNum: week.openingSongNum,
			middleSongNum: week.middleSongNum,
			closingSongNum: week.closingSongNum,
			sortOrder: week.sortOrder,
			sections: week.sections.map((section) => ({
				name: section.name,
				code: section.code,
				sortOrder: section.sortOrder,
				parts: section.parts.map((part) => ({
					title: part.title,
					theme: part.theme,
					durationMin: part.durationMin,
					modality: part.modality,
					source: part.source,
					sortOrder: part.sortOrder,
				})),
			})),
		})),
	};
}

function patchWeek(
	draft: MwbReviewDraft,
	weekIndex: number,
	patch: Partial<MwbReviewWeek>,
): MwbReviewDraft {
	return {
		...draft,
		weeks: draft.weeks.map((week, index) =>
			index === weekIndex ? { ...week, ...patch } : week,
		),
	};
}

function parseOptionalSongNumber(raw: string): number | null {
	if (raw === "") return null;

	const value = Number(raw);

	if (!Number.isInteger(value) || value < 1 || value > 999) {
		return null;
	}

	return value;
}

function patchSection(
	draft: MwbReviewDraft,
	weekIndex: number,
	sectionIndex: number,
	patch: Partial<MwbReviewSection>,
): MwbReviewDraft {
	return {
		...draft,
		weeks: draft.weeks.map((week, wIndex) =>
			wIndex === weekIndex
				? {
						...week,
						sections: week.sections.map((section, sIndex) =>
							sIndex === sectionIndex ? { ...section, ...patch } : section,
						),
					}
				: week,
		),
	};
}

function patchPart(
	draft: MwbReviewDraft,
	weekIndex: number,
	sectionIndex: number,
	partIndex: number,
	patch: Partial<MwbReviewPart>,
): MwbReviewDraft {
	const weeks = draft.weeks.map((week, wIndex) => {
		if (wIndex !== weekIndex) return week;

		const sections = week.sections.map((section, sIndex) => {
			if (sIndex !== sectionIndex) return section;

			const parts = section.parts.map((part, pIndex) =>
				pIndex === partIndex ? { ...part, ...patch } : part,
			);

			return { ...section, parts };
		});

		return { ...week, sections };
	});

	return { ...draft, weeks };
}

export function MwbSection({
	slug,
	canManage,
	issues,
	counts,
	pendingJob,
}: Props) {
	const [locale, setLocale] = useState<ContentLocale>("pt");
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const [draftOverride, setDraftOverride] = useState<MwbReviewDraft | null>(
		null,
	);
	const [draftJobId, setDraftJobId] = useState<string | null>(null);

	const jobExtract = useMemo(
		() => asMwbExtract(pendingJob?.extractedJson),
		[pendingJob],
	);

	const reviewDraft =
		pendingJob && draftJobId === pendingJob.id && draftOverride
			? draftOverride
			: jobExtract
				? withClientKeys(jobExtract)
				: null;

	const filtered = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase();

		return issues
			.filter((issue) => issue.locale === locale)
			.filter((issue) => {
				if (!normalizedQuery) return true;

				return (
					issue.title.toLocaleLowerCase().includes(normalizedQuery) ||
					issue.symbol.toLocaleLowerCase().includes(normalizedQuery) ||
					String(issue.year ?? "").includes(normalizedQuery) ||
					issue.weeks.some((week) =>
						(week.weekLabelRaw ?? "")
							.toLocaleLowerCase()
							.includes(normalizedQuery),
					)
				);
			});
	}, [issues, locale, query]);

	const totalLocale =
		counts.find((item) => item.locale === locale)?.count ??
		issues.filter((issue) => issue.locale === locale).length;

	function setReviewDraft(nextDraft: MwbReviewDraft) {
		if (!pendingJob) return;
		setDraftJobId(pendingJob.id);
		setDraftOverride(nextDraft);
	}

	function clearDraftOverride() {
		setDraftOverride(null);
		setDraftJobId(null);
	}

	function toggleIssueSelection(issueId: string) {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(issueId)) next.delete(issueId);
			else next.add(issueId);
			return next;
		});
	}

	function onUpload(fileList: FileList | null) {
		if (!fileList?.length) return;

		const file = fileList.item(0);
		if (!file) return;

		const formData = new FormData();
		formData.set("locale", locale);
		formData.append("files", file);

		startTransition(async () => {
			setError(null);
			setMessage(null);
			clearDraftOverride();

			const result = await createAndProcessMwbImportAction(slug, formData);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage("Apostila extraída. Revise e confirme.");
		});
	}

	function saveDraft() {
		if (!pendingJob || !reviewDraft) return;

		startTransition(async () => {
			setError(null);

			const result = await updateMwbImportDraftAction(
				slug,
				pendingJob.id,
				stripClientKeys(reviewDraft),
			);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage("Rascunho da apostila salvo.");
		});
	}

	function commit() {
		if (!pendingJob) return;

		startTransition(async () => {
			setError(null);

			const result = await commitMwbImportAction(slug, pendingJob.id);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			clearDraftOverride();
			setMessage(
				`${result.data.weeksUpserted} semanas salvas · ${result.data.partsCreated} partes.`,
			);
		});
	}

	function discard() {
		if (!pendingJob) return;
		if (!window.confirm("Descartar esta importação da apostila?")) return;

		startTransition(async () => {
			setError(null);

			const result = await discardMwbImportAction(slug, pendingJob.id);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			clearDraftOverride();
			setMessage("Importação descartada.");
		});
	}

	function removeSelected() {
		if (!selected.size) return;

		startTransition(async () => {
			setError(null);

			const result = await deleteMwbIssuesAction(slug, [...selected]);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setSelected(new Set());
			setMessage(`${result.data.count} edição(ões) excluída(s).`);
		});
	}

	function removeAllLocale() {
		const confirmed = window.confirm(
			`Excluir TODAS as edições da apostila em ${contentLocaleLabel(locale)}?`,
		);

		if (!confirmed) return;

		startTransition(async () => {
			setError(null);

			const result = await deleteAllMwbIssuesAction(slug, locale);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setSelected(new Set());
			setExpandedIssueId(null);
			setMessage(`${result.data.count} edição(ões) excluída(s).`);
		});
	}

	return (
		<section className="space-y-4">
			<header className="app-card app-card-body space-y-4">
				<div className="space-y-1">
					<p className="app-chip-brand">Meio de semana</p>
					<h2 className="text-headline text-foreground">Apostila</h2>
					<p className="text-body-sm text-muted-foreground">
						Gerencie as edições da apostila por idioma, revise importações e
						mantenha semanas, seções, partes e cânticos organizados.
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="app-segmented">
							<button
								type="button"
								disabled={pending}
								data-state={locale === "pt" ? "active" : "inactive"}
								onClick={() => setLocale("pt")}
								className="app-segmented-item"
							>
								Português
							</button>
							<button
								type="button"
								disabled={pending}
								data-state={locale === "es" ? "active" : "inactive"}
								onClick={() => setLocale("es")}
								className="app-segmented-item"
							>
								Español
							</button>
						</div>

						{canManage ? (
							<label className="app-button-primary inline-flex cursor-pointer items-center justify-center">
								Importar .jwpub
								<input
									type="file"
									accept=".jwpub,application/octet-stream"
									className="sr-only"
									disabled={pending}
									onChange={(event) => {
										onUpload(event.target.files);
										event.target.value = "";
									}}
								/>
							</label>
						) : null}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span className="app-chip">
							{totalLocale} edição(ões) em {contentLocaleLabel(locale)}
						</span>
					</div>
				</div>

				<div className="app-search">
					<HiOutlineMagnifyingGlass className="app-search-icon" />
					<input
						id="mwb-search"
						value={query}
						disabled={pending}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por título, símbolo ou semana"
						className="app-input app-search-input w-full"
					/>
				</div>

				{error ? (
					<p className="app-status-error" role="alert">
						{error}
					</p>
				) : null}

				{message ? (
					<p className="app-status-success" role="status">
						{message}
					</p>
				) : null}

				{pending ? (
					<p className="app-status-info" aria-live="polite">
						Processando…
					</p>
				) : null}
			</header>

			{canManage && pendingJob && reviewDraft ? (
				<MwbReviewCard
					key={pendingJob.id}
					job={pendingJob}
					draft={reviewDraft}
					onChange={setReviewDraft}
					onSave={saveDraft}
					onCommit={commit}
					onDiscard={discard}
					pending={pending}
				/>
			) : null}

			<section
				aria-label="Lista de edições da apostila"
				className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm"
			>
				{canManage && selected.size > 0 ? (
					<div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
						<span className="text-sm text-muted-foreground">
							{selected.size} selecionada(s)
						</span>

						<button
							type="button"
							disabled={pending}
							onClick={removeSelected}
							className="app-button-danger min-h-10 rounded-xl px-3"
						>
							Excluir selecionadas
						</button>
					</div>
				) : null}

				{filtered.length === 0 ? (
					<div className="app-list-empty m-4 text-center sm:m-5">
						Nenhuma edição encontrada para esse filtro.
					</div>
				) : (
					<ul className="grid gap-4 p-4 sm:p-5">
						{filtered.map((issue) => {
							const checked = selected.has(issue.id);
							const expanded = expandedIssueId === issue.id;

							return (
								<li
									key={issue.id}
									className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5"
								>
									<div className="flex items-start gap-3">
										{canManage ? (
											<input
												type="checkbox"
												checked={checked}
												disabled={pending}
												onChange={() => toggleIssueSelection(issue.id)}
												className="mt-1 h-4 w-4 rounded border-border"
												aria-label={`Selecionar ${issue.title}`}
											/>
										) : null}

										<div className="min-w-0 flex-1 space-y-4">
											<div className="flex flex-wrap items-center gap-2">
												<span className="app-chip">{issue.symbol}</span>
												<span className="app-chip">
													{issue.year ?? "—"}/{formatMonth(issue.month)}
												</span>
												<span className="app-chip">
													{issue.weeksCount} semana(s)
												</span>
											</div>

											<div className="space-y-1">
												<h3 className="text-title text-foreground">
													{issue.title}
												</h3>

												{issue.coverTitle ? (
													<p className="text-body-sm text-muted-foreground">
														{issue.coverTitle}
													</p>
												) : null}
											</div>

											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													disabled={pending}
													className="app-button-secondary min-h-10 rounded-2xl"
													onClick={() =>
														setExpandedIssueId(expanded ? null : issue.id)
													}
												>
													{expanded ? "Ocultar semanas" : "Ver semanas"}
												</button>

												{canManage ? (
													<MwbIssueEditDialog
														slug={slug}
														issue={issue}
														trigger={
															<button
																type="button"
																disabled={pending}
																className="app-button-secondary min-h-10 rounded-2xl"
															>
																Editar
															</button>
														}
													/>
												) : null}
											</div>

											{expanded ? (
												<div className="space-y-3">
													{issue.weeks.map((week) => (
														<article
															key={week.id}
															className="rounded-4xl border border-border bg-muted p-4"
														>
															<p className="text-sm font-medium text-foreground">
																{week.weekLabelRaw ||
																	`${week.weekStart} → ${week.weekEnd}`}
															</p>

															<p className="mt-1 text-xs text-muted-foreground">
																Cânticos:{" "}
																{[
																	week.openingSongNum,
																	week.middleSongNum,
																	week.closingSongNum,
																]
																	.filter((songNumber) => songNumber != null)
																	.join(" · ") || "—"}
															</p>

															<div className="mt-3 space-y-3">
																{week.sections.map((section) => (
																	<div key={section.id} className="space-y-1.5">
																		<p className="text-label uppercase text-muted-foreground">
																			{sectionBadge(section.code)} ·{" "}
																			{section.name}
																		</p>

																		<ul className="space-y-1">
																			{section.parts.map((part) => (
																				<li
																					key={part.id}
																					className="text-sm text-foreground"
																				>
																					<span className="font-medium">
																						{part.title}
																					</span>
																					{part.durationMin != null
																						? ` · ${part.durationMin} min`
																						: ""}
																					{part.modality
																						? ` · ${part.modality}`
																						: ""}
																				</li>
																			))}
																		</ul>
																	</div>
																))}
															</div>
														</article>
													))}
												</div>
											) : null}
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}

				{canManage && totalLocale > 0 ? (
					<div className="border-t border-border px-4 py-3 sm:px-5">
						<button
							type="button"
							disabled={pending}
							onClick={removeAllLocale}
							className="min-h-10 text-sm font-medium text-destructive disabled:cursor-not-allowed disabled:opacity-60"
						>
							Excluir todas · {contentLocaleLabel(locale)}
						</button>
					</div>
				) : null}
			</section>
		</section>
	);
}

function MwbReviewCard({
	job,
	draft,
	onChange,
	onSave,
	onCommit,
	onDiscard,
	pending,
}: {
	job: ContentImportJobEntity;
	draft: MwbReviewDraft;
	onChange: (value: MwbReviewDraft) => void;
	onSave: () => void;
	onCommit: () => void;
	onDiscard: () => void;
	pending: boolean;
}) {
	return (
		<section
			aria-labelledby="mwb-review-title"
			className="space-y-3 rounded-4xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5"
		>
			<div>
				<h3 id="mwb-review-title" className="text-title text-foreground">
					Revisar importação
				</h3>

				<p className="mt-1 text-sm text-muted-foreground">
					{draft.weeks.length} semana(s) · {job.fileNames.join(", ")}
					{job.notes ? ` · ${job.notes}` : ""}
				</p>
			</div>

			<div className="grid gap-3">
				<label className="block space-y-1">
					<span className="text-label text-muted-foreground">Símbolo</span>
					<input
						type="text"
						value={draft.symbol}
						disabled={pending}
						onChange={(event) =>
							onChange({
								...draft,
								symbol: event.target.value,
							})
						}
						className="app-input w-full"
					/>
				</label>

				<label className="block space-y-1">
					<span className="text-label text-muted-foreground">Título</span>
					<input
						type="text"
						value={draft.title}
						disabled={pending}
						onChange={(event) =>
							onChange({
								...draft,
								title: event.target.value,
							})
						}
						className="app-input w-full"
					/>
				</label>
			</div>

			<div className="max-h-96 space-y-3 overflow-y-auto rounded-4xl border border-border bg-card p-3">
				{draft.weeks.map((week, weekIndex) => (
					<div
						key={week.clientKey}
						className="rounded-4xl border border-border bg-card p-3"
					>
						<div className="grid gap-2 sm:grid-cols-2">
							<label className="block space-y-1">
								<span className="text-xs text-muted-foreground">Início</span>
								<input
									type="date"
									value={week.weekStart}
									disabled={pending}
									onChange={(event) =>
										onChange(
											patchWeek(draft, weekIndex, {
												weekStart: event.target.value,
											}),
										)
									}
									className="min-h-10 w-full rounded-xl border border-border px-2 text-sm"
								/>
							</label>

							<label className="block space-y-1">
								<span className="text-xs text-muted-foreground">Fim</span>
								<input
									type="date"
									value={week.weekEnd}
									disabled={pending}
									onChange={(event) =>
										onChange(
											patchWeek(draft, weekIndex, {
												weekEnd: event.target.value,
											}),
										)
									}
									className="min-h-10 w-full rounded-xl border border-border px-2 text-sm"
								/>
							</label>
						</div>

						<div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
							{(
								[
									["openingSongNum", "Inicial"],
									["middleSongNum", "Meio"],
									["closingSongNum", "Final"],
								] as const satisfies ReadonlyArray<
									readonly [MwbSongField, string]
								>
							).map(([field, label]) => (
								<label key={field} className="block space-y-1">
									<span className="text-xs text-muted-foreground">{label}</span>
									<input
										type="number"
										min={1}
										max={999}
										value={week[field] ?? ""}
										disabled={pending}
										onChange={(event) =>
											onChange(
												patchWeek(draft, weekIndex, {
													[field]: parseOptionalSongNumber(event.target.value),
												}),
											)
										}
										className="min-h-10 w-full rounded-xl border border-border px-2 text-sm"
									/>
								</label>
							))}
						</div>

						<div className="mt-3 space-y-3">
							{week.sections.map((section, sectionIndex) => (
								<div
									key={section.clientKey}
									className="rounded-xl border border-border bg-muted p-3"
								>
									<input
										type="text"
										value={section.name}
										disabled={pending}
										aria-label={`Nome da seção ${sectionIndex + 1}`}
										onChange={(event) =>
											onChange(
												patchSection(draft, weekIndex, sectionIndex, {
													name: event.target.value,
												}),
											)
										}
										className="mb-2 min-h-10 w-full rounded-xl border border-border bg-card px-3 text-xs font-semibold uppercase tracking-wide"
									/>

									{section.parts.map((part, partIndex) => (
										<div
											key={part.clientKey}
											className="mb-2 grid gap-2 sm:grid-cols-[1fr_5rem]"
										>
											<input
												type="text"
												value={part.title}
												disabled={pending}
												aria-label={`Título da parte ${partIndex + 1}`}
												onChange={(event) =>
													onChange(
														patchPart(
															draft,
															weekIndex,
															sectionIndex,
															partIndex,
															{ title: event.target.value },
														),
													)
												}
												className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
											/>

											<input
												type="number"
												min={0}
												max={180}
												value={part.durationMin ?? ""}
												disabled={pending}
												placeholder="Min."
												aria-label="Duração em minutos"
												onChange={(event) => {
													const raw = event.target.value;
													const value =
														raw === ""
															? null
															: Number.isFinite(Number(raw))
																? Number(raw)
																: null;

													onChange(
														patchPart(
															draft,
															weekIndex,
															sectionIndex,
															partIndex,
															{ durationMin: value },
														),
													);
												}}
												className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
											/>
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<button
					type="button"
					disabled={pending}
					onClick={onSave}
					className="app-button-secondary"
				>
					Salvar rascunho
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={onCommit}
					className="app-button-primary"
				>
					Confirmar e salvar
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={onDiscard}
					className="app-button-ghost text-destructive hover:text-destructive"
				>
					Descartar
				</button>
			</div>
		</section>
	);
}
