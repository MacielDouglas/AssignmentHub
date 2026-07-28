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

	const handleEditList = (next: RosterDraft) => {
		if (!canGenerate) return;
		setDraft(next);
		setActive("gerar");
	};

	return (
		<main className="mx-auto max-w-3xl space-y-5 px-3 pb-24 pt-4 sm:px-4 sm:pb-10">
			<header className="space-y-2">
				<p className="text-label uppercase text-primary">{t("eyebrow")}</p>
				<h1 className="text-display text-foreground sm:text-3xl">
					{t("title")}
				</h1>
				<p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p>
			</header>

			<nav className="flex gap-1 rounded-3xl border border-border bg-card p-1.5 shadow-sm">
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
									? "bg-primary text-primary-foreground shadow"
									: "text-muted-foreground hover:bg-muted"
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
				<CleaningBoard
					data={data}
					onEditList={canGenerate ? handleEditList : undefined}
				/>
			)}
		</main>
	);
}
