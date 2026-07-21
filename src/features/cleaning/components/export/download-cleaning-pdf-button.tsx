"use client";

import { useState } from "react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	buildPdfInputFromDraft,
	buildPdfInputFromSavedList,
} from "@/features/cleaning/lib/build-cleaning-pdf-input";
import type { SavedListDetailForPdf } from "@/features/cleaning/lib/cleaning-pdf-types";
import { downloadCleaningPdf } from "@/features/cleaning/lib/download-cleaning-pdf";
import type { RosterDraft } from "@/features/cleaning/lib/roster-types";

type Props = {
	organizationName: string;
	draft?: RosterDraft | null;
	savedList?: SavedListDetailForPdf | null;
	className?: string;
	label?: string;
};

export function DownloadCleaningPdfButton({
	organizationName,
	draft,
	savedList,
	className,
	label = "Baixar PDF",
}: Props) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClick = () => {
		setError(null);
		setBusy(true);
		try {
			if (draft) {
				downloadCleaningPdf(buildPdfInputFromDraft(draft, organizationName));
			} else if (savedList) {
				downloadCleaningPdf(
					buildPdfInputFromSavedList(savedList, organizationName),
				);
			} else {
				setError("Nenhuma tabela selecionada.");
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Falha ao gerar PDF.");
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
				{busy ? "Gerando..." : label}
			</Button>
			{error ? (
				<p className="max-w-xs text-right text-xs text-red-600">{error}</p>
			) : null}
		</div>
	);
}
