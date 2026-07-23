"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { HiOutlineArrowUpTray } from "react-icons/hi2";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAndProcessWatchtowerImportAction } from "../actions/watchtower.actions";

type Props = {
	slug: string;
	disabled?: boolean;
};

export function WatchtowerImportForm({ slug, disabled = false }: Props) {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const blocked = disabled || pending;

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (!file) {
			setError("Selecione um arquivo .jwpub.");
			return;
		}

		const formData = new FormData();
		formData.set("file", file);

		startTransition(async () => {
			const result = await createAndProcessWatchtowerImportAction(
				slug,
				formData,
			);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setFile(null);
			if (inputRef.current) {
				inputRef.current.value = "";
			}
			router.refresh();
		});
	}

	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
			<header className="mb-4 space-y-1">
				<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
					Importar arquivo .jwpub
				</h2>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					Envie a edição de estudo de A Sentinela ou La Atalaya. O idioma será
					identificado automaticamente pelo arquivo.
				</p>
			</header>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="watchtower-jwpub">Arquivo .jwpub</Label>

					<label
						htmlFor="watchtower-jwpub"
						className={[
							"flex min-h-32 flex-col items-center justify-center gap-2",
							"rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6",
							"transition dark:border-slate-700 dark:bg-slate-900",
							blocked
								? "cursor-not-allowed opacity-50"
								: "cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30",
						].join(" ")}
					>
						<HiOutlineArrowUpTray className="h-7 w-7 text-blue-600 dark:text-blue-300" />

						<span className="text-center text-sm font-medium text-slate-800 dark:text-slate-100">
							{file
								? file.name
								: "Clique aqui para selecionar um arquivo .jwpub"}
						</span>

						<span className="text-center text-xs text-slate-500 dark:text-slate-400">
							Um arquivo por vez, máximo de 40 MB
						</span>

						<input
							ref={inputRef}
							id="watchtower-jwpub"
							name="file"
							type="file"
							accept=".jwpub,application/octet-stream,application/zip"
							className="sr-only"
							// disabled={blocked}
							onChange={(event) => {
								const selected = event.target.files?.[0] ?? null;
								setFile(selected);
								setError(null);
							}}
						/>
					</label>
				</div>

				{file ? (
					<div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
						Arquivo selecionado: <strong>{file.name}</strong>
					</div>
				) : null}

				{error ? (
					<Alert variant="destructive" className="rounded-2xl">
						<AlertTitle>Falha na importação</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<Button
					type="submit"
					className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 px-5 text-white shadow-lg shadow-blue-600/20"
					disabled={blocked || !file}
				>
					<HiOutlineArrowUpTray className="mr-2 h-4 w-4" />
					{pending ? "Extraindo estudos…" : "Extrair estudos"}
				</Button>
			</form>
		</section>
	);
}
