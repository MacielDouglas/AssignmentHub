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

type Props = {
	slug: string;
	canManage: boolean;
	issues: MwbIssueEntity[];
	counts: Array<{ locale: ContentLocale; count: number }>;
	pendingJob: ContentImportJobEntity | null;
};

type MwbWeekDraft = MwbExtract["weeks"][number];
type MwbSongField = "openingSongNum" | "middleSongNum" | "closingSongNum";

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

function patchWeek(
	draft: MwbExtract,
	weekIndex: number,
	patch: Partial<MwbWeekDraft>,
): MwbExtract {
	return {
		...draft,
		weeks: draft.weeks.map((item, index) =>
			index === weekIndex ? { ...item, ...patch } : item,
		),
	};
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

	const initialDraft = useMemo(() => {
		if (!pendingJob?.extractedJson) return null;
		return pendingJob.extractedJson as MwbExtract;
	}, [pendingJob]);

	const [draft, setDraft] = useState<MwbExtract | null>(initialDraft);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();

		return issues
			.filter((issue) => issue.locale === locale)
			.filter((issue) => {
				if (!q) return true;

				return (
					issue.title.toLowerCase().includes(q) ||
					issue.symbol.toLowerCase().includes(q) ||
					String(issue.year ?? "").includes(q) ||
					issue.weeks.some((week) =>
						(week.weekLabelRaw ?? "").toLowerCase().includes(q),
					)
				);
			});
	}, [issues, locale, query]);

	const totalLocale =
		counts.find((item) => item.locale === locale)?.count ??
		issues.filter((issue) => issue.locale === locale).length;

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

			const result = await createAndProcessMwbImportAction(slug, formData);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage("Apostila extraída. Revise e confirme.");
		});
	}

	function saveDraft() {
		if (!pendingJob || !draft) return;

		startTransition(async () => {
			setError(null);

			const result = await updateMwbImportDraftAction(
				slug,
				pendingJob.id,
				draft,
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

			setMessage(
				`${result.data.weeksUpserted} semanas salvas · ${result.data.partsCreated} partes.`,
			);
			setDraft(null);
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

			setDraft(null);
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

			setMessage(`${result.data.count} edição(ões) excluída(s).`);
			setSelected(new Set());
		});
	}

	function removeAllLocale() {
		if (
			!confirm(
				`Excluir TODAS as edições da apostila em ${contentLocaleLabel(locale)}?`,
			)
		) {
			return;
		}

		startTransition(async () => {
			setError(null);

			const result = await deleteAllMwbIssuesAction(slug, locale);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage(`${result.data.count} edição(ões) excluída(s).`);
			setSelected(new Set());
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

			{canManage && pendingJob && (draft || pendingJob.extractedJson) ? (
				<MwbReviewCard
					job={pendingJob}
					draft={draft ?? (pendingJob.extractedJson as MwbExtract)}
					onChange={setDraft}
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
							onClick={removeSelected}
							className="min-h-10 rounded-xl bg-red-600 px-3 text-sm font-medium text-white"
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
							Importe o `.jwpub` da Guia de atividades (mwb) para cadastrar
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
												onChange={() => {
													setSelected((prev) => {
														const next = new Set(prev);
														if (next.has(issue.id)) next.delete(issue.id);
														else next.add(issue.id);
														return next;
													});
												}}
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

											<button
												type="button"
												className="mt-3 min-h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
												onClick={() =>
													setExpandedIssueId(expanded ? null : issue.id)
												}
											>
												{expanded ? "Ocultar semanas" : "Ver semanas"}
											</button>

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
																	.filter((value) => value != null)
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
							onClick={removeAllLocale}
							className="text-sm font-medium text-red-600"
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
	draft: MwbExtract;
	onChange: (value: MwbExtract) => void;
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
						key={`${week.sortOrder}-${week.weekStart}-${week.weekEnd}`}
						className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800"
					>
						<div className="grid gap-2 sm:grid-cols-2">
							<label className="block space-y-1">
								<span className="text-xs text-slate-500">Início</span>
								<input
									type="date"
									value={week.weekStart}
									onChange={(event) => {
										onChange(
											patchWeek(draft, weekIndex, {
												weekStart: event.target.value,
											}),
										);
									}}
									className="min-h-10 w-full rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
								/>
							</label>

							<label className="block space-y-1">
								<span className="text-xs text-slate-500">Fim</span>
								<input
									type="date"
									value={week.weekEnd}
									onChange={(event) => {
										onChange(
											patchWeek(draft, weekIndex, {
												weekEnd: event.target.value,
											}),
										);
									}}
									className="min-h-10 w-full rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
								/>
							</label>
						</div>

						<div className="mt-2 grid grid-cols-3 gap-2">
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
										onChange={(event) => {
											const raw = event.target.value;
											const value = raw === "" ? null : Number(raw);

											onChange(
												patchWeek(draft, weekIndex, {
													[field]:
														value === null || Number.isFinite(value)
															? value
															: null,
												}),
											);
										}}
										className="min-h-10 w-full rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
									/>
								</label>
							))}
						</div>

						<p className="mt-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
							{week.sections.length} seção(ões) ·{" "}
							{week.sections.reduce(
								(total, section) => total + section.parts.length,
								0,
							)}{" "}
							parte(s)
						</p>

						<ul className="mt-2 space-y-1">
							{week.sections.flatMap((section) =>
								section.parts.map((part) => (
									<li
										key={`${section.sortOrder}-${part.sortOrder}-${part.title}`}
										className="text-sm text-slate-700 dark:text-slate-200"
									>
										<span className="font-medium">{part.title}</span>
										{part.durationMin != null
											? ` · ${part.durationMin} min`
											: ""}
									</li>
								)),
							)}
						</ul>
					</div>
				))}
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<button
					type="button"
					disabled={pending}
					onClick={onSave}
					className="min-h-11 rounded-2xl border border-slate-300 px-4 text-sm font-medium dark:border-slate-600"
				>
					Salvar rascunho
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onCommit}
					className="min-h-11 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white"
				>
					Confirmar e salvar
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onDiscard}
					className="min-h-11 rounded-2xl px-4 text-sm font-medium text-red-600"
				>
					Descartar
				</button>
			</div>
		</section>
	);
}
