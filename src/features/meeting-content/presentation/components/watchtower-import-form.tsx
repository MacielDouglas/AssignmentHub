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
		<section className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5">
			<header className="mb-4 space-y-1">
				<h2 className="text-headline text-foreground">
					Importar arquivo .jwpub
				</h2>
				<p className="text-sm text-muted-foreground">
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
							"rounded-4xl border border-dashed border-border bg-muted px-4 py-6",
							"transition",
							blocked
								? "cursor-not-allowed opacity-50"
								: "cursor-pointer hover:border-primary hover:bg-primary/10",
						].join(" ")}
					>
						<HiOutlineArrowUpTray className="h-7 w-7 text-primary" />

						<span className="text-center text-sm font-medium text-foreground">
							{file
								? file.name
								: "Clique aqui para selecionar um arquivo .jwpub"}
						</span>

						<span className="text-center text-xs text-muted-foreground">
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
					<div className="rounded-4xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
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
					className="h-11 rounded-4xl bg-primary px-5 text-primary-foreground shadow-md"
					disabled={blocked || !file}
				>
					<HiOutlineArrowUpTray className="mr-2 h-4 w-4" />
					{pending ? "Extraindo estudos…" : "Extrair estudos"}
				</Button>
			</form>
		</section>
	);
}
