"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
	HiOutlineCheckCircle,
	HiOutlinePlus,
	HiOutlineTrash,
	HiOutlineXMark,
} from "react-icons/hi2";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type WatchtowerExtract,
	WatchtowerExtractSchema,
} from "../../application/dto/watchtower-extract.dto";
import type { ContentImportJobEntity } from "../../domain/entities/watchtower-study";
import {
	commitWatchtowerImportAction,
	discardWatchtowerImportAction,
	updateWatchtowerImportDraftAction,
} from "../actions/watchtower.actions";
import { ContentBadge } from "./content-badge";

type Props = {
	slug: string;
	job: ContentImportJobEntity;
};

function parseDraft(job: ContentImportJobEntity): WatchtowerExtract | null {
	const raw = job.extractedJson;
	if (!raw || typeof raw !== "object") return null;

	// Migração leve: jobs antigos com aiNotes
	const patched = {
		...(raw as Record<string, unknown>),
		notes:
			(raw as { notes?: unknown }).notes ??
			(raw as { aiNotes?: unknown }).aiNotes ??
			null,
	};
	delete (patched as { aiNotes?: unknown }).aiNotes;

	const parsed = WatchtowerExtractSchema.safeParse(patched);
	return parsed.success ? parsed.data : null;
}

function songValue(n: number | null | undefined): string {
	if (n == null || !Number.isFinite(n)) return "";
	return String(n);
}


type IsoDateInputProps = {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
};

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function IsoDateInput({
  id,
  label,
  value,
  onChange,
}: IsoDateInputProps) {
  const [text, setText] = useState(value ?? "");
  const [invalid, setInvalid] = useState(false);

  function commit() {
    const next = text.trim();

    if (!next) {
      setInvalid(false);
      onChange(null);
      return;
    }

    if (!isIsoDate(next)) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="2026-09-28"
        className="h-11 rounded-2xl font-mono"
        value={text}
        maxLength={10}
        aria-invalid={invalid}
        onChange={(event) => {
          const next = event.target.value
            .replace(/[^\d-]/g, "")
            .slice(0, 10);

          setText(next);
          setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />

      {invalid ? (
        <p className="text-xs text-red-600 dark:text-red-400">
          Use uma data real no formato AAAA-MM-DD, por exemplo 2026-09-28.
        </p>
      ) : null}
    </div>
  );
}

export function WatchtowerReviewTable({ slug, job }: Props) {
	const router = useRouter();
	const initial = useMemo(() => parseDraft(job), [job]);
	const [draft, setDraft] = useState<WatchtowerExtract | null>(initial);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	if (!draft) {
		return (
			<Alert variant="destructive" className="rounded-2xl">
				<AlertTitle>
					Rascunho inválido (provavelmente importação antiga)
				</AlertTitle>
				<AlertDescription className="space-y-3">
					<p>
						{job.errorMessage ??
							"JSON incompatível com o novo fluxo .jwpub. Descarte e envie o arquivo novamente."}
					</p>
					<Button
						type="button"
						variant="destructive"
						className="rounded-xl"
						disabled={pending}
						onClick={() => {
							startTransition(async () => {
								const res = await discardWatchtowerImportAction(slug, job.id);
								if (!res.ok) {
									setError(res.error);
									return;
								}
								router.refresh();
							});
						}}
					>
						<HiOutlineXMark className="mr-2 h-4 w-4" />
						Descartar importação antiga
					</Button>
					{error ? <p className="text-sm">{error}</p> : null}
				</AlertDescription>
			</Alert>
		);
	}

	function updateArticle(
		index: number,
		patch: Partial<WatchtowerExtract["articles"][number]>,
	) {
		setDraft((current) => {
			if (!current) return current;
			return {
				...current,
				articles: current.articles.map((article, i) =>
					i === index ? { ...article, ...patch } : article,
				),
			};
		});
	}

	function addArticle() {
		setDraft((current) => {
			if (!current) return current;
			return {
				...current,
				articles: [
					...current.articles,
					{
						weekLabelRaw: "",
						weekStart: null,
						weekEnd: null,
						title: "",
						openingSong: 1,
						closingSong: 1,
						highlightColor: null,
					},
				],
			};
		});
	}

	function removeArticle(index: number) {
		setDraft((current) => {
			if (!current) return current;
			return {
				...current,
				articles: current.articles.filter((_, i) => i !== index),
			};
		});
	}

	function saveDraft() {
		if (!draft) return;
		setError(null);
		setInfo(null);
		startTransition(async () => {
			const result = await updateWatchtowerImportDraftAction(
				slug,
				job.id,
				draft,
			);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setInfo("Rascunho salvo.");
			router.refresh();
		});
	}

	function commit() {
		if (!draft) return;
		setError(null);
		setInfo(null);
		startTransition(async () => {
			const draftResult = await updateWatchtowerImportDraftAction(
				slug,
				job.id,
				draft,
			);
			if (!draftResult.ok) {
				setError(draftResult.error);
				return;
			}
			const result = await commitWatchtowerImportAction(slug, job.id);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setInfo(`${result.data.estudosSalvos} estudo(s) salvos no catálogo.`);
			router.refresh();
		});
	}

	function discardAll() {
		setError(null);
		setInfo(null);
		startTransition(async () => {
			const res = await discardWatchtowerImportAction(slug, job.id);
			if (!res.ok) {
				setError(res.error);
				return;
			}
			router.refresh();
		});
	}

	return (
		<section
			aria-labelledby="wt-review-title"
			className="space-y-4 rounded-[28px] border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-5"
		>
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3
							id="wt-review-title"
							className="text-lg font-semibold text-slate-900 dark:text-slate-50"
						>
							Revisão da importação
						</h3>
						<ContentBadge label="Aguardando confirmação" tone="amber" />
						<ContentBadge
							label={draft.locale === "pt" ? "Português" : "Español"}
							tone="blue"
						/>
					</div>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Arquivo: {job.fileNames.join(", ") || "—"}. Confira cada campo antes
						de gravar no banco.
					</p>
					{draft.notes ? (
						<p className="text-xs text-slate-500 dark:text-slate-400">
							{draft.notes}
						</p>
					) : null}
				</div>
				<Button
					type="button"
					variant="outline"
					className="h-11 shrink-0 rounded-2xl border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300"
					onClick={discardAll}
					disabled={pending}
				>
					<HiOutlineXMark className="mr-2 h-4 w-4" />
					Descartar importação
				</Button>
			</header>

			<div className="space-y-2">
				<Label htmlFor="issue-code">Código da revista</Label>
				<Input
					id="issue-code"
					className="h-11 max-w-sm rounded-2xl"
					value={draft.issueCode ?? ""}
					placeholder="w26.09-S"
					onChange={(e) =>
						setDraft({ ...draft, issueCode: e.target.value || null })
					}
				/>
			</div>

			<ul className="grid gap-4">
				{draft.articles.map((article, index) => {
					const rowKey = [
						article.weekStart ?? "no-start",
						article.weekEnd ?? "no-end",
						article.title || `novo-${index}`,
						index,
					].join("|");

					return (
						<li key={rowKey}>
							<article className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
								<header className="flex items-center justify-between gap-2">
									<h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
										Estudo {index + 1}
									</h4>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="rounded-xl text-red-600"
										onClick={() => removeArticle(index)}
									>
										<HiOutlineTrash className="mr-1 h-4 w-4" />
										Remover
									</Button>
								</header>

								<div className="grid gap-3 sm:grid-cols-2">
									<div className="space-y-2 sm:col-span-2">
										<Label>Semana (rótulo original)</Label>
										<Input
											className="h-11 rounded-2xl"
											value={article.weekLabelRaw}
											onChange={(e) =>
												updateArticle(index, { weekLabelRaw: e.target.value })
											}
										/>
									</div>
                  <IsoDateInput
  id={`week-start-${index}`}
  label="Início (segunda)"
  value={article.weekStart}
  onChange={(weekStart) => updateArticle(index, { weekStart })}
/>

                  <IsoDateInput
  id={`week-end-${index}`}
  label="Fim (domingo)"
  value={article.weekEnd}
  onChange={(weekEnd) => updateArticle(index, { weekEnd })}
/>
									<div className="space-y-2 sm:col-span-2">
										<Label>Título</Label>
										<Input
											className="h-11 rounded-2xl"
											value={article.title}
											onChange={(e) =>
												updateArticle(index, { title: e.target.value })
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Cântico inicial</Label>
										<Input
											type="number"
											min={1}
											className="h-11 rounded-2xl"
											value={songValue(article.openingSong)}
											onChange={(e) => {
												const v = e.target.value;
												updateArticle(index, {
													openingSong: v === "" ? null : Number(v),
												});
											}}
										/>
									</div>
									<div className="space-y-2">
										<Label>Cântico final</Label>
										<Input
											type="number"
											min={1}
											className="h-11 rounded-2xl"
											value={songValue(article.closingSong)}
											onChange={(e) => {
												const v = e.target.value;
												updateArticle(index, {
													closingSong: v === "" ? null : Number(v),
												});
											}}
										/>
									</div>
									<div className="space-y-2 sm:col-span-2">
										<Label>Cor de destaque</Label>
										<div className="flex items-center gap-3">
											<Input
												className="h-11 max-w-40 rounded-2xl font-mono text-sm"
												value={article.highlightColor ?? ""}
												placeholder="#4A6FA5"
												onChange={(e) =>
													updateArticle(index, {
														highlightColor: e.target.value || null,
													})
												}
											/>
											{article.highlightColor ? (
												<span
													aria-hidden
													className="h-10 w-10 rounded-2xl border border-slate-200 shadow-inner dark:border-slate-700"
													style={{ backgroundColor: article.highlightColor }}
												/>
											) : null}
										</div>
									</div>
								</div>
							</article>
						</li>
					);
				})}
			</ul>

			{error ? (
				<Alert variant="destructive" className="rounded-2xl">
					<AlertTitle>Erro</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{info ? (
				<Alert className="rounded-2xl border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
					<AlertTitle>OK</AlertTitle>
					<AlertDescription>{info}</AlertDescription>
				</Alert>
			) : null}

			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<Button
					type="button"
					variant="outline"
					className="h-11 rounded-2xl"
					onClick={addArticle}
					disabled={pending}
				>
					<HiOutlinePlus className="mr-2 h-4 w-4" />
					Adicionar artigo
				</Button>
				<Button
					type="button"
					variant="secondary"
					className="h-11 rounded-2xl"
					onClick={saveDraft}
					disabled={pending}
				>
					Salvar rascunho
				</Button>
				<Button
					type="button"
					className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20"
					onClick={commit}
					disabled={pending}
				>
					<HiOutlineCheckCircle className="mr-2 h-4 w-4" />
					{pending ? "Salvando…" : "Confirmar e salvar no banco"}
				</Button>
			</div>
		</section>
	);
}
