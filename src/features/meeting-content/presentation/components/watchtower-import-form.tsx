"use client";

import { useRef, useTransition } from "react";

import { createAndProcessWatchtowerImportAction } from "../actions/watchtower.actions";

type Props = {
	slug: string;
	disabled?: boolean;
	onError?: (message: string | null) => void;
	onMessage?: (message: string | null) => void;
};

export function WatchtowerImportForm({
	slug,
	disabled = false,
	onError,
	onMessage,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [pending, startTransition] = useTransition();

	function handleFile(fileList: FileList | null) {
		const file = fileList?.item(0);
		if (!file) return;

		onError?.(null);
		onMessage?.(null);

		const formData = new FormData();
		formData.set("file", file);

		startTransition(async () => {
			const result = await createAndProcessWatchtowerImportAction(
				slug,
				formData,
			);

			if (!result.ok) {
				onError?.(result.error);
				return;
			}

			if (inputRef.current) inputRef.current.value = "";
			onMessage?.("Estudos extraídos. Revise e confirme.");
		});
	}

	return (
		<label className="app-button-primary inline-flex cursor-pointer items-center justify-center">
			{pending ? "Importando…" : "Importar .jwpub"}
			<input
				ref={inputRef}
				type="file"
				accept=".jwpub,application/octet-stream,application/zip"
				className="sr-only"
				disabled={disabled || pending}
				onChange={(event) => {
					handleFile(event.target.files);
					event.target.value = "";
				}}
			/>
		</label>
	);
}
