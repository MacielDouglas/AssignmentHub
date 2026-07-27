"use client";

import { useMemo, useState, useTransition } from "react";

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

			if (next.has(issueId)) {
				next.delete(issueId);
			} else {
				next.add(issueId);
			}

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

		if (!confirm("Descartar esta importação da apostila?")) return;

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
		const confirmed = confirm(
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
		<div className="space-y-4">
			<section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
				<div className="flex flex-col gap-3">
					<div>
						<p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-950/50 dark:text-blue-300">
							Meio de semana
						</p>

						<h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
							Apostila
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							{totalLocale} edição(ões) em {contentLocaleLabel(locale)}.
						</p>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
						<label className="sr-only" htmlFor="mwb-locale">
							Idioma
						</label>

						<select
							id="mwb-locale"
							value={locale}
							disabled={pending}
							onChange={(event) =>
								setLocale(event.target.value as ContentLocale)
							}
							className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
						>
							<option value="pt">Português</option>
							<option value="es">Español</option>
						</select>

						{canManage ? (
							<label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25">
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

					<div>
						<label className="sr-only" htmlFor="mwb-search">
							Buscar edição
						</label>

						<input
							id="mwb-search"
							value={query}
							disabled={pending}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Buscar por título, símbolo ou semana"
							className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900"
						/>
					</div>

					{error ? (
						<p className="text-sm text-red-600" role="alert">
							{error}
						</p>
					) : null}

					{message ? (
						<p className="text-sm text-emerald-600" role="status">
							{message}
						</p>
					) : null}

					{pending ? (
						<p className="text-sm text-slate-500" aria-live="polite">
							Processando…
						</p>
					) : null}
				</div>
			</section>

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
				className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
			>
				{canManage && selected.size > 0 ? (
					<div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
						<span className="text-sm text-slate-600">
							{selected.size} selecionada(s)
						</span>

						<button
							type="button"
							disabled={pending}
							onClick={removeSelected}
							className="min-h-10 rounded-xl bg-red-600 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
						>
							Excluir
						</button>
					</div>
				) : null}

				{filtered.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<p className="text-sm font-medium text-slate-700 dark:text-slate-200">
							Nenhuma edição neste idioma
						</p>

						<p className="mt-1 text-sm text-slate-500">
							Importe o arquivo `.jwpub` da Guia de Atividades para cadastrar
							semanas, seções, partes e cânticos.
						</p>
					</div>
				) : (
					<ul className="divide-y divide-slate-100 dark:divide-slate-900">
						{filtered.map((issue) => {
							const checked = selected.has(issue.id);
							const expanded = expandedIssueId === issue.id;

							return (
								<li key={issue.id} className="px-4 py-4">
									<div className="flex items-start gap-3">
										{canManage ? (
											<input
												type="checkbox"
												checked={checked}
												disabled={pending}
												onChange={() => toggleIssueSelection(issue.id)}
												className="mt-1 h-4 w-4 rounded border-slate-300"
												aria-label={`Selecionar ${issue.title}`}
											/>
										) : null}

										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className="inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
													{issue.symbol}
												</span>

												<span className="inline-flex min-h-8 items-center rounded-full bg-teal-50 px-3 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
													{issue.year ?? "—"}/{formatMonth(issue.month)}
												</span>

												<span className="inline-flex min-h-8 items-center rounded-full bg-violet-50 px-3 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
													{issue.weeksCount} semana(s)
												</span>
											</div>

											<h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
												{issue.title}
											</h3>

											{issue.coverTitle ? (
												<p className="mt-1 text-sm text-slate-500">
													{issue.coverTitle}
												</p>
											) : null}

											<div className="mt-3 flex flex-wrap gap-2">
												<button
													type="button"
													disabled={pending}
													className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
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
																className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
															>
																Editar
															</button>
														}
													/>
												) : null}
											</div>

											{expanded ? (
												<div className="mt-3 space-y-3">
													{issue.weeks.map((week) => (
														<article
															key={week.id}
															className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
														>
															<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
																{week.weekLabelRaw ||
																	`${week.weekStart} → ${week.weekEnd}`}
															</p>

															<p className="mt-1 text-xs text-slate-500">
																Cânticos:{" "}
																{[
																	week.openingSongNum,
																	week.middleSongNum,
																	week.closingSongNum,
																]
																	.filter((songNumber) => songNumber != null)
																	.join(" · ") || "—"}
															</p>

															<div className="mt-3 space-y-2">
																{week.sections.map((section) => (
																	<div key={section.id}>
																		<p className="text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-300">
																			{sectionBadge(section.code)} ·{" "}
																			{section.name}
																		</p>

																		<ul className="mt-1 space-y-1">
																			{section.parts.map((part) => (
																				<li
																					key={part.id}
																					className="text-sm text-slate-700 dark:text-slate-200"
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
					<div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
						<button
							type="button"
							disabled={pending}
							onClick={removeAllLocale}
							className="min-h-10 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Excluir todas · {contentLocaleLabel(locale)}
						</button>
					</div>
				) : null}
			</section>
		</div>
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
			className="space-y-3 rounded-[28px] border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-5"
		>
			<div>
				<h3
					id="mwb-review-title"
					className="text-base font-semibold text-slate-900 dark:text-slate-50"
				>
					Revisar importação
				</h3>

				<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
					{draft.weeks.length} semana(s) · {job.fileNames.join(", ")}
					{job.notes ? ` · ${job.notes}` : ""}
				</p>
			</div>

			<div className="grid gap-3">
				<label className="block space-y-1">
					<span className="text-xs font-medium text-slate-600 dark:text-slate-300">
						Símbolo
					</span>

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
						className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
					/>
				</label>

				<label className="block space-y-1">
					<span className="text-xs font-medium text-slate-600 dark:text-slate-300">
						Título
					</span>

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
						className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
					/>
				</label>
			</div>

			<div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
				{draft.weeks.map((week, weekIndex) => (
					<div
						key={week.clientKey}
						className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800"
					>
						<div className="grid gap-2 sm:grid-cols-2">
							<label className="block space-y-1">
								<span className="text-xs text-slate-500">Início</span>

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
									className="min-h-10 w-full rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
								/>
							</label>

							<label className="block space-y-1">
								<span className="text-xs text-slate-500">Fim</span>

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
									className="min-h-10 w-full rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
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
									<span className="text-xs text-slate-500">{label}</span>

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
										className="min-h-10 w-full rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
									/>
								</label>
							))}
						</div>

						<div className="mt-3 space-y-3">
							{week.sections.map((section, sectionIndex) => (
								<div
									key={section.clientKey}
									className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
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
										className="mb-2 min-h-9 w-full rounded-lg border border-slate-200 px-2 text-xs font-semibold tracking-wide uppercase dark:border-slate-700 dark:bg-slate-950"
									/>

									{section.parts.map((part, partIndex) => (
										<div
											key={part.clientKey}
											className="mb-1 grid gap-1.5 sm:grid-cols-[1fr_5rem]"
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
												className="min-h-9 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
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
												className="min-h-9 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
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
					className="min-h-11 rounded-2xl border border-slate-300 px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600"
				>
					Salvar rascunho
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={onCommit}
					className="min-h-11 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
				>
					Confirmar e salvar
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={onDiscard}
					className="min-h-11 rounded-2xl px-4 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
				>
					Descartar
				</button>
			</div>
		</section>
	);
}
