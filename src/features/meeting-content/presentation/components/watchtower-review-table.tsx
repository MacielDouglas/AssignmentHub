"use client";

import { useState, useTransition } from "react";

import type { WatchtowerExtract } from "@/features/meeting-content/application/dto/watchtower-extract.dto";
import type { ContentImportJobEntity } from "@/features/meeting-content/domain/entities/watchtower-study";

import {
	commitWatchtowerImportAction,
	discardWatchtowerImportAction,
	updateWatchtowerImportDraftAction,
} from "../actions/watchtower.actions";

type Props = {
	slug: string;
	job: ContentImportJobEntity;
	onError?: (message: string | null) => void;
	onMessage?: (message: string | null) => void;
};

type DraftArticle = WatchtowerExtract["articles"][number];

function normalizeColor(value: string) {
	const normalized = value.trim().toUpperCase();
	if (!normalized) return null;
	const finalValue = normalized.startsWith("#") ? normalized : `#${normalized}`;
	return /^#[0-9A-F]{6}$/.test(finalValue) ? finalValue : null;
}

export function WatchtowerReviewTable({
	slug,
	job,
	onError,
	onMessage,
}: Props) {
	const [draft, setDraft] = useState<WatchtowerExtract | null>(
		job?.extractedJson as WatchtowerExtract | null,
	);
	const [pending, startTransition] = useTransition();

	if (!draft) return null;

	function patchArticle(index: number, patch: Partial<DraftArticle>) {
		setDraft((current) => {
			if (!current) return current;
			return {
				...current,
				articles: current.articles.map((article, currentIndex) =>
					currentIndex === index ? { ...article, ...patch } : article,
				),
			};
		});
	}

	function saveDraft() {
		if (!draft) return;

		onError?.(null);
		onMessage?.(null);

		startTransition(async () => {
			const result = await updateWatchtowerImportDraftAction(
				slug,
				job.id,
				draft,
			);
			if (!result.ok) {
				onError?.(result.error);
				return;
			}
			onMessage?.("Rascunho salvo.");
		});
	}

	function commitDraft() {
		onError?.(null);
		onMessage?.(null);

		startTransition(async () => {
			const result = await commitWatchtowerImportAction(slug, job.id);
			if (!result.ok) {
				onError?.(result.error);
				return;
			}
			onMessage?.(`${result.data.estudosSalvos} estudo(s) salvos.`);
		});
	}

	function discardDraft() {
		onError?.(null);
		onMessage?.(null);

		startTransition(async () => {
			const result = await discardWatchtowerImportAction(slug, job.id);
			if (!result.ok) {
				onError?.(result.error);
				return;
			}
			onMessage?.("Importação descartada.");
			setDraft(null);
		});
	}

	return (
		<section
			aria-labelledby="watchtower-review-title"
			className="space-y-3 rounded-4xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5"
		>
			<div>
				<h3 id="watchtower-review-title" className="text-title text-foreground">
					Revisar importação
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					{draft.articles.length} artigo(s) · {job.fileNames?.join(", ")}
					{job.notes ? ` · ${job.notes}` : ""}
				</p>
			</div>

			<div className="max-h-128 space-y-3 overflow-y-auto rounded-4xl border border-border bg-card p-3">
				{draft.articles.map((article, idx) => (
					<div
						key={`review-${article.weekStart}-${article.weekEnd}`}
						className="rounded-3xl border border-border p-3"
					>
						<div className="grid gap-3 sm:grid-cols-2">
							<label className="grid gap-1">
								<span className="text-xs text-muted-foreground">Título</span>
								<input
									type="text"
									value={article.title}
									disabled={pending}
									onChange={(event) =>
										patchArticle(idx, { title: event.target.value })
									}
									className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
								/>
							</label>

							<label className="grid gap-1">
								<span className="text-xs text-muted-foreground">
									Rótulo da semana
								</span>
								<input
									type="text"
									value={article.weekLabelRaw ?? ""}
									disabled={pending}
									onChange={(event) =>
										patchArticle(idx, {
											weekLabelRaw: event.target.value.trim(),
										})
									}
									className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
								/>
							</label>
						</div>

						<div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<label className="grid gap-1">
								<span className="text-xs text-muted-foreground">Início</span>
								<input
									type="date"
									value={article.weekStart ?? ""}
									disabled={pending}
									onChange={(event) =>
										patchArticle(idx, { weekStart: event.target.value })
									}
									className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
								/>
							</label>

							<label className="grid gap-1">
								<span className="text-xs text-muted-foreground">Fim</span>
								<input
									type="date"
									value={article.weekEnd ?? ""}
									disabled={pending}
									onChange={(event) =>
										patchArticle(idx, { weekEnd: event.target.value })
									}
									className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
								/>
							</label>

							<label className="grid gap-1">
								<span className="text-xs text-muted-foreground">
									Cântico inicial
								</span>
								<input
									type="number"
									min={1}
									max={999}
									value={article.openingSong ?? ""}
									disabled={pending}
									onChange={(event) =>
										patchArticle(idx, {
											openingSong: event.target.value
												? Number(event.target.value)
												: null,
										})
									}
									className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
								/>
							</label>

							<label className="grid gap-1">
								<span className="text-xs text-muted-foreground">
									Cântico final
								</span>
								<input
									type="number"
									min={1}
									max={999}
									value={article.closingSong ?? ""}
									disabled={pending}
									onChange={(event) =>
										patchArticle(idx, {
											closingSong: event.target.value
												? Number(event.target.value)
												: null,
										})
									}
									className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm"
								/>
							</label>
						</div>

						<div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
							<label className="grid gap-1">
								<span className="text-xs text-muted-foreground">
									Cor de destaque
								</span>
								<input
									type="text"
									inputMode="text"
									placeholder="#2563EB"
									value={article.highlightColor ?? ""}
									disabled={pending}
									onChange={(event) =>
										patchArticle(idx, {
											highlightColor: normalizeColor(event.target.value),
										})
									}
									className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm uppercase"
								/>
							</label>
						</div>
					</div>
				))}
			</div>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={pending}
					onClick={saveDraft}
					className="app-button-secondary"
				>
					Salvar rascunho
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={commitDraft}
					className="app-button-primary"
				>
					Confirmar e salvar
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={discardDraft}
					className="app-button-ghost text-destructive hover:text-destructive"
				>
					Descartar
				</button>
			</div>
		</section>
	);
}
