"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { buildDutyPdfInput } from "../../lib/build-duty-pdf-input";
import type { DutyMeetingDraft } from "../../lib/duty-types";

function formatDateLabel(iso: string): string {
	const [year, month, day] = iso.split("-");

	return `${day}/${month}/${year}`;
}

export function DownloadDutyPdfButton({
	organizationName,
	periodFrom,
	periodTo,
	meetings,
}: {
	organizationName: string;
	periodFrom: string;
	periodTo: string;
	meetings: DutyMeetingDraft[];
}) {
	const t = useTranslations("Duties");
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handleDownload() {
		startTransition(async () => {
			try {
				const { downloadDutyPdf } = await import("../../lib/download-duty-pdf");

				const input = buildDutyPdfInput(meetings, periodFrom, periodTo, {
					title: t("pdfTitle"),
					periodLine: t("pdfPeriod", {
						from: formatDateLabel(periodFrom),
						to: formatDateLabel(periodTo),
					}),
					colDate: t("pdfColDate"),
					emptyCell: t("vacant"),
					organizationName,
					filePrefix: t("pdfFilePrefix"),
					sectorName: (sector) => t(`sector.${sector}`),
					externoLabel: t("sideExterno"),
					internoLabel: t("sideInterno"),
					weekdays: [
						t("weekday.0"),
						t("weekday.1"),
						t("weekday.2"),
						t("weekday.3"),
						t("weekday.4"),
						t("weekday.5"),
						t("weekday.6"),
					],
				});

				downloadDutyPdf(input);
				setError(null);
			} catch (cause) {
				setError(cause instanceof Error ? cause.message : t("pdfError"));
			}
		});
	}

	return (
		<span className="inline-flex flex-col gap-1">
			<Button
				type="button"
				variant="outline"
				disabled={pending || meetings.length === 0}
				onClick={handleDownload}
				className="h-11 rounded-4xl"
			>
				{pending ? t("generatingPdf") : t("createPdf")}
			</Button>

			{error ? (
				<span role="alert" className="text-xs text-destructive">
					{error}
				</span>
			) : null}
		</span>
	);
}
