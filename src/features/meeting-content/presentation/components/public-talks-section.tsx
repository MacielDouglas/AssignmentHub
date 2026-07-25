"use client";

import { useMemo, useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlinePlus } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { PublicTalksSectionData } from "../../queries/get-public-talks-section-data.query";
import { PublicTalkDialog } from "./public-talk-dialog";
import { PublicTalkHistoryDialog } from "./public-talk-history-dialog";
import { PublicTalkHistoryList } from "./public-talk-history-list";

type PublicTalksSectionProps = {
	slug: string;
	organizationId: string;
	data: PublicTalksSectionData;
	canManage: boolean;
	isSuperAdmin: boolean;
	initialLocale?: "pt" | "es";
};

export function PublicTalksSection({
	slug,
	organizationId,
	data,
	canManage,
	isSuperAdmin,
	initialLocale = "pt",
}: PublicTalksSectionProps) {
	const [locale, setLocale] = useState<"pt" | "es">(initialLocale);
	const [search, setSearch] = useState("");

	const filteredTalks = useMemo(() => {
		const normalized = search.trim().toLowerCase();

		return data.talks.filter((talk) => {
			if (talk.locale !== locale) {
				return false;
			}

			if (!normalized) {
				return true;
			}

			return (
				talk.title.toLowerCase().includes(normalized) ||
				String(talk.number).includes(normalized)
			);
		});
	}, [data.talks, locale, search]);

	return (
		<section className="space-y-4">
			<header className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
								Discursos públicos
							</h2>
							<p className="text-sm text-slate-600 dark:text-slate-400">
								Gerencie o catálogo global e o histórico dos últimos discursos
								por organização.
							</p>
						</div>

						<div className="flex flex-wrap gap-2">
							<PublicTalkDialog
								slug={slug}
								mode="create"
								trigger={
									<Button className="min-h-11 rounded-2xl">
										<HiOutlinePlus className="mr-2 h-4 w-4" />
										Novo discurso
									</Button>
								}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
							<button
								type="button"
								onClick={() => setLocale("pt")}
								className={[
									"min-h-10 rounded-xl px-4 text-sm font-medium transition",
									locale === "pt"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
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
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
								].join(" ")}
							>
								Español
							</button>
						</div>

						<div className="relative flex-1">
							<HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Buscar por número ou título"
								className="min-h-11 rounded-2xl pl-9"
							/>
						</div>
					</div>
				</div>
			</header>

			<div className="grid gap-4">
				{filteredTalks.length === 0 ? (
					<div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
						Nenhum discurso encontrado para esse filtro.
					</div>
				) : (
					filteredTalks.map((talk) => (
						<article
							key={talk.id}
							className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5"
						>
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
									<div className="min-w-0 space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<span className="inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
												{talk.locale === "pt" ? "PT" : "ES"}
											</span>
											<span className="inline-flex min-h-8 items-center rounded-full bg-teal-50 px-3 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
												Nº {talk.number}
											</span>
											<span className="inline-flex min-h-8 items-center rounded-full bg-violet-50 px-3 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
												{talk._count.histories} registros
											</span>
										</div>

										<div className="space-y-1">
											<h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
												{talk.title}
											</h3>
											{talk.notes ? (
												<p className="text-sm text-slate-600 dark:text-slate-400">
													{talk.notes}
												</p>
											) : null}
										</div>
									</div>

									<div className="flex flex-wrap gap-2">
										{canManage && (talk.scope === "LOCAL" || isSuperAdmin) ? (
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

								<PublicTalkHistoryList history={talk.latestHistory} />
							</div>
						</article>
					))
				)}
			</div>
		</section>
	);
}
