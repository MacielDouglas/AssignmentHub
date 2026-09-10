"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateDutyRosterAction } from "../../actions/generate-duty-roster-action";
import type { DutyRosterDraft } from "../../lib/duty-types";
import type { DutiesPageData } from "../../lib/load-duties-page";

function toDateOnlyString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function defaultRange(): { from: string; to: string } {
	const from = new Date();
	const to = new Date();
	to.setDate(to.getDate() + 28);

	return { from: toDateOnlyString(from), to: toDateOnlyString(to) };
}

export function DutyGeneratePanel({
	slug,
	sectors,
	hasActiveSectors,
	onDraft,
}: {
	slug: string;
	sectors: DutiesPageData["sectors"];
	hasActiveSectors: boolean;
	onDraft: (draft: DutyRosterDraft) => void;
}) {
	const t = useTranslations("Duties");
	const [range, setRange] = useState(defaultRange);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const activeSectors = sectors.filter((sector) => sector.active);

	function handleGenerate() {
		if (!range.from || !range.to) {
			setError(t("invalidPeriod"));
			return;
		}

		startTransition(async () => {
			const result = await generateDutyRosterAction({
				slug,
				from: range.from,
				to: range.to,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setError(null);
			onDraft(result.draft);
		});
	}

	return (
		<section className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
			<header className="space-y-1">
				<h2 className="text-headline text-foreground">{t("generateTitle")}</h2>
				<p className="text-sm text-muted-foreground">{t("generateHint")}</p>
			</header>

			{!hasActiveSectors ? (
				<p className="rounded-2xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
					{t("noActiveSectors")}{" "}
					<Link
						href={`/org/${slug}/settings?tab=assignments`}
						className="font-medium text-primary underline underline-offset-4"
					>
						{t("goToSettings")}
					</Link>
				</p>
			) : (
				<p className="text-sm text-muted-foreground">
					{t("sectorsInUse")}:{" "}
					{activeSectors.map((sector) => t(`sector.${sector.key}`)).join(" · ")}
				</p>
			)}

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="duty-from">{t("periodFrom")}</Label>
					<Input
						id="duty-from"
						type="date"
						value={range.from}
						onChange={(event) =>
							setRange((current) => ({ ...current, from: event.target.value }))
						}
						className="h-11 rounded-2xl"
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="duty-to">{t("periodTo")}</Label>
					<Input
						id="duty-to"
						type="date"
						value={range.to}
						onChange={(event) =>
							setRange((current) => ({ ...current, to: event.target.value }))
						}
						className="h-11 rounded-2xl"
					/>
				</div>
			</div>

			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}

			<Button
				type="button"
				disabled={pending || !hasActiveSectors}
				onClick={handleGenerate}
				className="h-11 rounded-4xl bg-primary text-primary-foreground"
			>
				{pending ? t("generating") : t("createDuties")}
			</Button>
		</section>
	);
}
