"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	type BuildPdfOpts,
	buildPdfInputFromDraft,
	buildPdfInputFromSavedList,
} from "@/features/cleaning/lib/build-cleaning-pdf-input";
import type {
	CleaningPdfI18n,
	SavedListDetailForPdf,
} from "@/features/cleaning/lib/cleaning-pdf-types";
import { downloadCleaningPdf } from "@/features/cleaning/lib/download-cleaning-pdf";
import type { RosterDraft } from "@/features/cleaning/lib/roster-types";

type Props = {
	organizationName: string;
	draft?: RosterDraft | null;
	savedList?: SavedListDetailForPdf | null;
	className?: string;
	label?: string;
};

function formatDateShort(iso: string): string {
	const parts = iso.split("-");
	if (parts.length < 3) return iso;
	const [y, m, d] = parts;
	return `${d}/${m}/${y}`;
}

export function DownloadCleaningPdfButton({
	organizationName,
	draft,
	savedList,
	className,
	label,
}: Props) {
	const t = useTranslations("CleaningPdf");
	const tTypes = useTranslations("CleaningTypes");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const resolvedLabel = label ?? t("downloadPdf");

	const typeLabel = (type: string): string => {
		if (type === "MEETING" || type === "WEEKLY" || type === "GENERAL") {
			return tTypes(type);
		}
		return tTypes("fallback");
	};

	const buildI18n = (
		periodFrom: string,
		periodTo: string,
	): CleaningPdfI18n => ({
		colDate: t("colDate"),
		periodLine: t("periodLine", {
			from: formatDateShort(periodFrom),
			to: formatDateShort(periodTo),
		}),
		tasksHeading: t("tasksHeading"),
		noDescription: t("noDescription"),
		emptyCell: t("emptyCell"),
		titleDefault: t("titleDefault"),
		orgFallback: t("orgFallback"),
		sectorFallback: t("sectorFallback"),
		weekdays: [
			t("weekday0"),
			t("weekday1"),
			t("weekday2"),
			t("weekday3"),
			t("weekday4"),
			t("weekday5"),
			t("weekday6"),
		],
		errNoSectors: t("errNoSectors"),
		errNoDays: t("errNoDays"),
	});

	const buildOpts = (
		cleaningType: string,
		periodFrom: string,
		periodTo: string,
	): BuildPdfOpts => {
		const tl = typeLabel(cleaningType);
		return {
			title: t("titleTemplate", { type: tl }),
			orgFallback: t("orgFallback"),
			sectorFallback: t("sectorFallback"),
			emptyName: t("emptyCell"),
			i18n: buildI18n(periodFrom, periodTo),
		};
	};

	const handleClick = () => {
		setError(null);
		setBusy(true);
		try {
			if (draft) {
				downloadCleaningPdf(
					buildPdfInputFromDraft(
						draft,
						organizationName,
						buildOpts(draft.cleaningType, draft.periodFrom, draft.periodTo),
					),
				);
			} else if (savedList) {
				downloadCleaningPdf(
					buildPdfInputFromSavedList(
						savedList,
						organizationName,
						buildOpts(
							savedList.cleaningType,
							savedList.periodFrom,
							savedList.periodTo,
						),
					),
				);
			} else {
				setError(t("errNoTable"));
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : t("errGenerate"));
		} finally {
			setBusy(false);
		}
	};

	const disabled = busy || (!draft && !savedList);

	return (
		<div className="flex flex-col items-end gap-1">
			<Button
				type="button"
				variant="outline"
				disabled={disabled}
				onClick={handleClick}
				className={className ?? "h-10 rounded-2xl"}
			>
				<HiOutlineArrowDownTray className="mr-2 h-4 w-4" />
				{busy ? t("generating") : resolvedLabel}
			</Button>
			{error ? (
				<p className="max-w-xs text-right text-xs text-red-600">{error}</p>
			) : null}
		</div>
	);
}
