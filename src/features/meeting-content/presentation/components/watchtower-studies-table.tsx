"use client";

import { useState, useTransition } from "react";

import type { WatchtowerStudyEntity } from "@/features/meeting-content/domain/entities/watchtower-study";
import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";
import { contentLocaleLabel } from "@/features/meeting-content/domain/values-objects/content-locale";

import {
	deleteAllWatchtowerStudiesAction,
	deleteWatchtowerStudiesAction,
} from "../actions/watchtower.actions";
import { ContentBadge } from "./content-badge";
import { WatchtowerEditStudyDialog } from "./watchtower-edit-study-dialog";

type Props = {
	slug: string;
	canManage: boolean;
	studies: WatchtowerStudyEntity[];
	filterLocale: ContentLocale;
	counts?: { locale: ContentLocale; count: number }[];
	onError?: (message: string | null) => void;
	onMessage?: (message: string | null) => void;
	onPendingChange?: (pending: boolean) => void;
};

export function WatchtowerStudiesTable({
	slug,
	canManage,
	studies,
	filterLocale,
	counts,
	onError,
	onMessage,
	onPendingChange,
}: Props) {
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [pending, startTransition] = useTransition();

	const filtered = studies.filter((item) => item.locale === filterLocale);

	const totalLocale =
		counts?.find((count) => count.locale === filterLocale)?.count ??
		filtered.length;

	function toggle(id: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	function deleteSelected() {
		if (selected.size === 0) return;

		onError?.(null);
		onMessage?.(null);
		onPendingChange?.(true);

		startTransition(async () => {
			const result = await deleteWatchtowerStudiesAction(slug, [...selected]);
			onPendingChange?.(false);

			if (!result.ok) {
				onError?.(result.error);
				return;
			}

			setSelected(new Set());
			onMessage?.(`${result.data.count} estudo(s) excluído(s).`);
		});
	}

	function deleteAll() {
		if (
			!window.confirm(
				`Excluir TODOS os estudos em ${contentLocaleLabel(filterLocale)}?`,
			)
		)
			return;

		onError?.(null);
		onMessage?.(null);
		onPendingChange?.(true);

		startTransition(async () => {
			const result = await deleteAllWatchtowerStudiesAction(slug, filterLocale);
			onPendingChange?.(false);

			if (!result.ok) {
				onError?.(result.error);
				return;
			}

			setSelected(new Set());
			onMessage?.(`${result.data.count} estudo(s) excluído(s).`);
		});
	}

	return (
		<section
			aria-label="Lista de estudos"
			className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm"
		>
			{canManage && selected.size > 0 ? (
				<div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
					<span className="text-sm text-muted-foreground">
						{selected.size} selecionado(s)
					</span>
					<button
						type="button"
						disabled={pending}
						onClick={deleteSelected}
						className="app-button-danger min-h-10 rounded-xl px-3"
					>
						Excluir selecionados
					</button>
				</div>
			) : null}

			{filtered.length === 0 ? (
				<div className="app-list-empty m-4 text-center sm:m-5">
					Nenhum estudo encontrado para esse filtro.
				</div>
			) : (
				<ul className="grid gap-4 p-4 sm:p-5">
					{filtered.map((study) => {
						const checked = selected.has(study.id);

						return (
							<li
								key={study.id}
								className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5"
							>
								<div className="flex items-start gap-3">
									{canManage ? (
										<input
											type="checkbox"
											checked={checked}
											disabled={pending}
											onChange={() => toggle(study.id)}
											className="mt-1 h-4 w-4 rounded border-border"
											aria-label={`Selecionar ${study.title}`}
										/>
									) : null}

									<div className="min-w-0 flex-1 space-y-3">
										<div className="flex flex-wrap gap-2">
											<ContentBadge
												label={`${study.weekStart} → ${study.weekEnd}`}
											/>
											<ContentBadge
												label={`Cânticos ${study.openingSongNum ?? "—"} / ${study.closingSongNum ?? "—"}`}
											/>
											{study.issueCode ? (
												<ContentBadge label={study.issueCode} />
											) : null}
											{study.highlightColor ? (
												<ContentBadge label={study.highlightColor} />
											) : null}
										</div>

										<div className="space-y-1">
											<h3 className="text-title text-foreground">
												{study.title}
											</h3>
											<p className="text-body-sm text-muted-foreground">
												{study.weekLabelRaw ||
													`${study.weekStart} → ${study.weekEnd}`}
											</p>
										</div>

										<div className="flex flex-wrap gap-2">
											{canManage ? (
												<WatchtowerEditStudyDialog
													slug={slug}
													study={study}
													disabled={pending}
													onError={onError}
													onMessage={onMessage}
												/>
											) : null}
										</div>
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
						onClick={deleteAll}
						className="min-h-10 text-sm font-medium text-destructive disabled:cursor-not-allowed disabled:opacity-60"
					>
						Excluir todas · {contentLocaleLabel(filterLocale)}
					</button>
				</div>
			) : null}
		</section>
	);
}
