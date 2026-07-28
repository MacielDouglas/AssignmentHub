"use client";

import { useMemo, useState, useTransition } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

import type {
	ContentImportJobEntity,
	WatchtowerStudyEntity,
} from "@/features/meeting-content/domain/entities/watchtower-study";
import {
	type ContentLocale,
	contentLocaleLabel,
} from "@/features/meeting-content/domain/values-objects/content-locale";

import { WatchtowerImportForm } from "./watchtower-import-form";
import { WatchtowerReviewTable } from "./watchtower-review-table";
import { WatchtowerStudiesTable } from "./watchtower-studies-table";

type Props = {
	slug: string;
	canManage: boolean;
	studies: WatchtowerStudyEntity[];
	counts: { locale: ContentLocale; count: number }[];
	pendingJob: ContentImportJobEntity | null;
};

export function WatchtowerSection({
	slug,
	canManage,
	studies,
	counts,
	pendingJob,
}: Props) {
	const [locale, setLocale] = useState<ContentLocale>("pt");
	const [query, setQuery] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending] = useTransition();

	const draft = useMemo(() => {
		if (!pendingJob?.extractedJson) return null;
		return pendingJob.extractedJson;
	}, [pendingJob]);

	const filteredStudies = useMemo(() => {
		const normalized = query.trim().toLowerCase();

		return studies
			.filter((study) => study.locale === locale)
			.filter((study) => {
				if (!normalized) return true;
				return [
					study.title,
					study.weekLabelRaw,
					study.issueCode,
					study.highlightColor,
					study.weekStart,
					study.weekEnd,
				]
					.filter(Boolean)
					.some((value) => String(value).toLowerCase().includes(normalized));
			});
	}, [locale, query, studies]);

	const totalLocale =
		counts.find((count) => count.locale === locale)?.count ??
		studies.filter((study) => study.locale === locale).length;

	return (
		<section className="space-y-4">
			<header className="app-card app-card-body space-y-4">
				<div className="space-y-1">
					<p className="app-chip-brand">Fim de semana</p>
					<h2 className="text-headline text-foreground">A Sentinela</h2>
					<p className="text-body-sm text-muted-foreground">
						Importe, revise e mantenha o catálogo de estudos de A Sentinela por
						idioma.
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

						{canManage ? <WatchtowerImportForm slug={slug} /> : null}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<span className="app-chip">
							{totalLocale} estudo(s) em {contentLocaleLabel(locale)}
						</span>
					</div>
				</div>

				<div className="app-search">
					<HiOutlineMagnifyingGlass className="app-search-icon" />
					<input
						id="wt-search"
						value={query}
						disabled={pending}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por título, semana, código ou cor"
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

			{canManage && pendingJob && draft ? (
				<WatchtowerReviewTable
					slug={slug}
					job={pendingJob}
					onError={setError}
					onMessage={setMessage}
				/>
			) : null}

			{canManage && pendingJob?.status === "FAILED" ? (
				<section
					className="rounded-4xl border border-red-200 bg-red-50/80 p-4 sm:p-5"
					role="alert"
				>
					<h3 className="text-title text-foreground">Falha na importação</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{pendingJob.errorMessage ||
							"Não foi possível processar o arquivo enviado."}
					</p>
				</section>
			) : null}

			<WatchtowerStudiesTable
				slug={slug}
				canManage={canManage}
				studies={filteredStudies}
				counts={counts}
				filterLocale={locale}
				onError={setError}
				onMessage={setMessage}
			/>
		</section>
	);
}
