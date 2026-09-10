"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DutyRosterDraft } from "../lib/duty-types";
import type { DutiesPageData } from "../lib/load-duties-page";
import { DutiesBoard } from "./board/duties-board";
import { DutyRosterEditor } from "./editor/duty-roster-editor";
import { DutyGeneratePanel } from "./generate/duty-generate-panel";

export function DutiesShell({
	data,
	initialTab,
}: {
	data: DutiesPageData;
	initialTab: "gerar" | "tabela";
}) {
	const t = useTranslations("Duties");
	const [tab, setTab] = useState<"gerar" | "tabela">(initialTab);
	const [draft, setDraft] = useState<DutyRosterDraft | null>(null);
	const [boardVersion, setBoardVersion] = useState(0);

	function handleSaved() {
		setDraft(null);
		setBoardVersion((version) => version + 1);
		setTab("tabela");
	}

	function handleEditDraft(next: DutyRosterDraft) {
		setDraft(next);
		setTab("gerar");
	}

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{data.canManage ? (
					<button
						type="button"
						onClick={() => setTab("gerar")}
						className={cn(
							"min-h-11 rounded-2xl px-4 text-sm font-medium transition",
							tab === "gerar"
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:text-foreground",
						)}
					>
						{t("tabGenerate")}
					</button>
				) : null}

				<button
					type="button"
					onClick={() => setTab("tabela")}
					className={cn(
						"min-h-11 rounded-2xl px-4 text-sm font-medium transition",
						tab === "tabela"
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:text-foreground",
					)}
				>
					{t("tabBoard")}
				</button>
			</div>

			{tab === "gerar" && data.canManage ? (
				<div className="space-y-4">
					<DutyGeneratePanel
						slug={data.organizationSlug}
						sectors={data.sectors}
						hasActiveSectors={data.hasActiveSectors}
						onDraft={setDraft}
					/>

					{draft ? (
						<DutyRosterEditor
							slug={data.organizationSlug}
							organizationName={data.organizationName}
							draft={draft}
							people={data.people}
							onChange={setDraft}
							onSaved={handleSaved}
							onDiscard={() => setDraft(null)}
						/>
					) : null}
				</div>
			) : null}

			{tab === "tabela" ? (
				<DutiesBoard
					key={boardVersion}
					slug={data.organizationSlug}
					organizationName={data.organizationName}
					people={data.people}
					canManage={data.canManage}
					initialLists={data.savedLists}
					onEdit={handleEditDraft}
				/>
			) : null}
		</div>
	);
}
