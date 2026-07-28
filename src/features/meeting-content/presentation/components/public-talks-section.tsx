"use client";

import { useMemo, useState, useTransition } from "react";
import { HiOutlineMagnifyingGlass, HiOutlinePlus } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { PublicTalksExtract } from "../../application/dto/public-talks-extract.dto";
import type { ContentImportJobEntity } from "../../domain/entities/watchtower-study";
import type { PublicTalksSectionData } from "../../queries/get-public-talks-section-data.query";
import {
	commitPublicTalksImportAction,
	createAndProcessPublicTalksImportAction,
	discardPublicTalksImportAction,
	updatePublicTalksImportDraftAction,
} from "../actions/public-talk.actions";
import { PublicTalkDialog } from "./public-talk-dialog";
import { PublicTalkHistoryDialog } from "./public-talk-history-dialog";
import { PublicTalkHistoryList } from "./public-talk-history-list";

const MAX_BYTES = 80 * 1024 * 1024;

type PublicTalksSectionProps = {
	slug: string;
	organizationId: string;
	data: PublicTalksSectionData;
	initialLocale?: "pt" | "es";
	canManage: boolean;
	isSuperAdmin?: boolean;
	pendingJob: ContentImportJobEntity | null;
};

export function PublicTalksSection({
	slug,
	organizationId,
	data,
	initialLocale = "pt",
	canManage,
	isSuperAdmin = false,
	pendingJob,
}: PublicTalksSectionProps) {
	const [locale, setLocale] = useState<"pt" | "es">(initialLocale);
	const [search, setSearch] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const [draft, setDraft] = useState<PublicTalksExtract | null>(null);
	const [draftJobId, setDraftJobId] = useState<string | null>(null);

	const activeDraft: PublicTalksExtract | null = (() => {
		if (!pendingJob?.extractedJson) return null;
		if (draft && draftJobId === pendingJob.id) return draft;
		return pendingJob.extractedJson as PublicTalksExtract;
	})();

	const filteredTalks = useMemo(() => {
		const normalized = search.trim().toLowerCase();
		return data.talks.filter((talk) => {
			if (talk.locale !== locale) return false;
			if (!normalized) return true;
			return (
				talk.title.toLowerCase().includes(normalized) ||
				String(talk.number).includes(normalized)
			);
		});
	}, [data.talks, locale, search]);

	function updateDraft(next: PublicTalksExtract) {
		if (!pendingJob) return;
		setDraftJobId(pendingJob.id);
		setDraft(next);
	}

	function clearDraft() {
		setDraft(null);
		setDraftJobId(null);
	}

	function onUpload(fileList: FileList | null) {
		const file = fileList?.[0];
		if (!file) return;

		if (!file.name.toLowerCase().endsWith(".jwpub")) {
			setError("Use um arquivo .jwpub (S-34).");
			return;
		}
		if (file.size > MAX_BYTES) {
			setError(
				`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máx. ${MAX_BYTES / 1024 / 1024} MB.`,
			);
			return;
		}

		const fd = new FormData();
		fd.set("file", file);

		startTransition(async () => {
			setError(null);
			setMessage(null);
			try {
				const res = await createAndProcessPublicTalksImportAction(slug, fd);
				if (!res.ok) {
					setError(res.error);
					return;
				}
				clearDraft();
				setMessage("Discursos extraídos. Revise e confirme.");
			} catch {
				setError(
					"Falha no upload (arquivo grande ou conexão). Confira bodySizeLimit no next.config e reinicie o dev server.",
				);
			}
		});
	}

	function saveDraft() {
		if (!pendingJob || !activeDraft) return;
		startTransition(async () => {
			setError(null);
			const res = await updatePublicTalksImportDraftAction(
				slug,
				pendingJob.id,
				activeDraft,
			);
			if (!res.ok) setError(res.error);
			else setMessage("Rascunho salvo.");
		});
	}

	function commit() {
		if (!pendingJob) return;
		startTransition(async () => {
			setError(null);
			const res = await commitPublicTalksImportAction(slug, pendingJob.id);
			if (!res.ok) {
				setError(res.error);
				return;
			}
			setMessage(`${res.data.upserted} discursos salvos.`);
			clearDraft();
		});
	}

	function discard() {
		if (!pendingJob) return;
		startTransition(async () => {
			setError(null);
			const res = await discardPublicTalksImportAction(slug, pendingJob.id);
			if (!res.ok) {
				setError(res.error);
				return;
			}
			setMessage("Importação descartada.");
			clearDraft();
		});
	}

	return (
		<section className="space-y-4">
			<header className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<h2 className="text-headline text-foreground">
								Discursos públicos
							</h2>
							<p className="text-sm text-muted-foreground">
								Gerencie o catálogo e o histórico dos últimos discursos por
								organização.
							</p>
						</div>

						<div className="flex flex-wrap gap-2">
							{canManage ? (
								<>
									<label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-4xl border border-border bg-card px-4 text-sm font-semibold">
										Importar S-34 .jwpub
										<input
											type="file"
											accept=".jwpub,application/octet-stream"
											className="sr-only"
											disabled={pending}
											onChange={(e) => {
												onUpload(e.target.files);
												e.target.value = "";
											}}
										/>
									</label>

									<PublicTalkDialog
										slug={slug}
										mode="create"
										isSuperAdmin={isSuperAdmin}
										trigger={
											<Button type="button" className="min-h-11 rounded-2xl">
												<HiOutlinePlus className="mr-2 h-4 w-4" />
												Novo discurso
											</Button>
										}
									/>
								</>
							) : null}
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="inline-flex rounded-4xl border border-border bg-muted p-1">
							<button
								type="button"
								onClick={() => setLocale("pt")}
								className={[
									"min-h-10 rounded-xl px-4 text-sm font-medium transition",
									locale === "pt"
										? "bg-card text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								].join(" ")}
							>
								Português
							</button>
							<button
								type="button"
								onClick={() => setLocale("es")}
								className={[
									"min-h-10 rounded-xl px-4 text-sm font-medium transition",
									locale === "es"
										? "bg-card text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								].join(" ")}
							>
								Español
							</button>
						</div>

						<div className="relative flex-1">
							<HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Buscar por número ou título"
								className="min-h-11 rounded-2xl pl-9"
							/>
						</div>
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
						<p className="text-sm text-muted-foreground" aria-live="polite">
							Processando…
						</p>
					) : null}
				</div>
			</header>

			{canManage && pendingJob && activeDraft ? (
				<PublicTalksReviewCard
					key={pendingJob.id}
					job={pendingJob}
					draft={activeDraft}
					pending={pending}
					onChange={updateDraft}
					onSave={saveDraft}
					onCommit={commit}
					onDiscard={discard}
				/>
			) : null}

			<div className="grid gap-4">
				{filteredTalks.length === 0 ? (
					<div className="rounded-4xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
						Nenhum discurso encontrado para esse filtro.
					</div>
				) : (
					filteredTalks.map((talk) => {
						const historyCount =
							talk._count?.histories ?? talk.latestHistory?.length ?? 0;

						const canEdit =
							canManage &&
							(isSuperAdmin ||
								talk.organizationId == null ||
								talk.organizationId === organizationId);

						return (
							<article
								key={talk.id}
								className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5"
							>
								<div className="flex flex-col gap-4">
									<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
										<div className="min-w-0 space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<span className="inline-flex min-h-8 items-center rounded-full bg-muted px-3 text-label uppercase text-muted-foreground">
													{talk.locale === "pt" ? "PT" : "ES"}
												</span>
												<span className="inline-flex min-h-8 items-center rounded-full bg-muted px-3 text-label text-muted-foreground">
													Nº {talk.number}
												</span>
												<span className="inline-flex min-h-8 items-center rounded-full bg-muted px-3 text-label text-muted-foreground">
													{historyCount} registros
												</span>
											</div>

											<div className="space-y-1">
												<h3 className="text-title text-foreground">
													{talk.title}
												</h3>
												{talk.notes ? (
													<p className="text-sm text-muted-foreground">
														{talk.notes}
													</p>
												) : null}
											</div>
										</div>

										<div className="flex flex-wrap gap-2">
											{canEdit ? (
												<PublicTalkDialog
													slug={slug}
													mode="edit"
													talk={talk}
													isSuperAdmin={isSuperAdmin}
													trigger={
														<Button
															type="button"
															variant="outline"
															className="min-h-10 rounded-2xl"
														>
															Editar
														</Button>
													}
												/>
											) : null}

											{canManage ? (
												<PublicTalkHistoryDialog
													slug={slug}
													organizationId={organizationId}
													talk={talk}
													eligibleSpeakers={data.eligibleSpeakers}
													trigger={
														<Button
															type="button"
															className="min-h-10 rounded-2xl"
														>
															Histórico
														</Button>
													}
												/>
											) : null}
										</div>
									</div>

									<PublicTalkHistoryList
										history={talk.latestHistory}
										slug={slug}
										organizationId={organizationId}
										canDelete={canManage}
									/>
								</div>
							</article>
						);
					})
				)}
			</div>
		</section>
	);
}

function PublicTalksReviewCard({
	job,
	draft,
	pending,
	onChange,
	onSave,
	onCommit,
	onDiscard,
}: {
	job: ContentImportJobEntity;
	draft: PublicTalksExtract;
	pending: boolean;
	onChange: (d: PublicTalksExtract) => void;
	onSave: () => void;
	onCommit: () => void;
	onDiscard: () => void;
}) {
	return (
		<section
			aria-labelledby="talks-review-title"
			className="space-y-3 rounded-4xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-5"
		>
			<div>
				<h3 id="talks-review-title" className="text-title text-foreground">
					Revisar importação S-34
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					{draft.talks.length} discursos
					{job.fileNames?.length ? ` · ${job.fileNames.join(", ")}` : ""}
					{job.notes ? ` · ${job.notes}` : ""}
				</p>
			</div>

			<ul className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-border bg-card p-3">
				{draft.talks.map((talk) => {
					const rowKey = `${draft.locale}-${talk.number}-${talk.title}`;
					return (
						<li
							key={rowKey}
							className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2"
						>
							<input
								type="number"
								min={1}
								max={999}
								value={talk.number}
								aria-label={`Número do discurso ${talk.number}`}
								disabled={pending}
								onChange={(e) => {
									const number = Number(e.target.value);
									const talks = draft.talks.map((t) =>
										t.number === talk.number && t.title === talk.title
											? { ...t, number }
											: t,
									);
									onChange({ ...draft, talks });
								}}
								className="min-h-10 rounded-xl border border-border px-2 text-sm"
							/>
							<input
								type="text"
								value={talk.title}
								aria-label={`Título do discurso ${talk.number}`}
								disabled={pending}
								onChange={(e) => {
									const title = e.target.value;
									const talks = draft.talks.map((t) =>
										t.number === talk.number && t.title === talk.title
											? { ...t, title }
											: t,
									);
									onChange({ ...draft, talks });
								}}
								className="min-h-10 rounded-xl border border-border px-3 text-sm"
							/>
							<button
								type="button"
								disabled={pending}
								className="min-h-10 rounded-xl px-2 text-sm text-red-600"
								onClick={() =>
									onChange({
										...draft,
										talks: draft.talks.filter(
											(t) =>
												!(t.number === talk.number && t.title === talk.title),
										),
									})
								}
							>
								Remover
							</button>
						</li>
					);
				})}
			</ul>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={pending}
					onClick={onSave}
					className="min-h-11 rounded-4xl border border-border px-4 text-sm font-medium"
				>
					Salvar rascunho
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onCommit}
					className="min-h-11 rounded-4xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
				>
					Confirmar e salvar no catálogo
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onDiscard}
					className="min-h-11 rounded-4xl px-4 text-sm font-medium text-destructive"
				>
					Descartar
				</button>
			</div>
		</section>
	);
}
