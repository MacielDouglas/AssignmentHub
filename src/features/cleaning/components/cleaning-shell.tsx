"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
	HiOutlineClipboardDocumentList,
	HiOutlineSparkles,
} from "react-icons/hi2";

import { CleaningBoard } from "@/features/cleaning/components/board/cleaning-board";
import { CleaningGeneratePanel } from "@/features/cleaning/components/generate/cleaning-generate-panel";
import type { CleaningPageData } from "@/features/cleaning/lib/cleaning-page-data";
import type { RosterDraft } from "@/features/cleaning/lib/roster-types";

type Tab = "gerar" | "tabela";

type Props = {
	data: CleaningPageData;
	initialTab: Tab;
};

export function CleaningShell({ data, initialTab }: Props) {
	const t = useTranslations("CleaningShell");

	const canGenerate = data.canManage;
	const tab: Tab =
		!canGenerate && initialTab === "gerar" ? "tabela" : initialTab;

	const [draft, setDraft] = useState<RosterDraft | null>(null);
	const [active, setActive] = useState<Tab>(tab);

	const base = `/org/${data.organizationSlug}/cleaning`;

	const tabs = useMemo(() => {
		const all: Array<{
			id: Tab;
			label: string;
			href: string;
			icon: typeof HiOutlineSparkles;
		}> = [];

		if (canGenerate) {
			all.push({
				id: "gerar",
				label: t("tabCreate"),
				href: `${base}?tab=gerar`,
				icon: HiOutlineSparkles,
			});
		}

		all.push({
			id: "tabela",
			label: t("tabBoard"),
			href: `${base}?tab=tabela`,
			icon: HiOutlineClipboardDocumentList,
		});

		return all;
	}, [base, canGenerate, t]);

	const subtitle = canGenerate
		? `${t("subtitleBase")}${t("subtitleCanGenerate")}`
		: `${t("subtitleBase")}${t("subtitleMemberOnly")}`;

	return (
		<main className="mx-auto max-w-3xl space-y-5 px-3 pb-24 pt-4 sm:px-4 sm:pb-10">
			<header className="space-y-2">
				<p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
					{t("eyebrow")}
				</p>
				<h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
					{t("title")}
				</h1>
				<p className="max-w-xl text-sm text-slate-500 dark:text-slate-400">
					{subtitle}
				</p>
			</header>

			<nav className="flex gap-1 rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
				{tabs.map((item) => {
					const Icon = item.icon;
					const on = active === item.id;
					return (
						<Link
							key={item.id}
							href={item.href}
							onClick={() => setActive(item.id)}
							className={`flex flex-1 items-center justify-center gap-2 rounded-[16px] px-3 py-2.5 text-sm font-medium transition ${
								on
									? "bg-linear-to-r from-blue-600 to-violet-600 text-white shadow"
									: "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
							}`}
						>
							<Icon className="h-4 w-4 shrink-0" />
							<span className="truncate">{item.label}</span>
						</Link>
					);
				})}
			</nav>

			{active === "gerar" && canGenerate ? (
				<CleaningGeneratePanel
					data={data}
					draft={draft}
					onDraftChange={setDraft}
					onSaved={() => {
						setDraft(null);
						setActive("tabela");
					}}
				/>
			) : (
				<CleaningBoard data={data} />
			)}
		</main>
	);
}
