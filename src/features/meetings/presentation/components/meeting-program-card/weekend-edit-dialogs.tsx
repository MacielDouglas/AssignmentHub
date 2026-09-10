"use client";

import { useState, useTransition } from "react";
import { HiOutlineMusicalNote, HiOutlinePencil } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	createWeekendPublicTalkAction,
	searchWeekendSongsAction,
	searchWeekendTalksAction,
	updateWeekendPublicTalkAction,
	updateWeekendSongAction,
	updateWeekendStudyThemeAction,
	type WeekendSongOption,
	type WeekendTalkOption,
} from "../../../application/actions/update-weekend-part.action";

function useSongSearch(slug: string) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<WeekendSongOption[]>([]);
	const [searched, setSearched] = useState(false);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function search(nextQuery: string) {
		setQuery(nextQuery);
		startTransition(async () => {
			const result = await searchWeekendSongsAction({
				slug,
				search: nextQuery,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setError(null);
			setResults(result.data);
			setSearched(true);
		});
	}

	return { query, results, searched, pending, error, search };
}

export function WeekendSongDialog({
	slug,
	partId,
	currentNumber,
	label,
	disabled,
}: {
	slug: string;
	partId: string;
	currentNumber: number | null;
	label: string;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [number, setNumber] = useState(currentNumber?.toString() ?? "");
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const songSearch = useSongSearch(slug);

	function handleSave() {
		const parsed = Number(number);

		if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
			setError("Informe o número do cântico (1 a 999).");
			return;
		}

		startTransition(async () => {
			const result = await updateWeekendSongAction({
				slug,
				partId,
				songNumber: parsed,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
			setError(null);
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={disabled}
					className="min-h-9 rounded-xl px-2 text-caption font-medium text-primary hover:bg-primary/10"
				>
					<HiOutlineMusicalNote aria-hidden="true" className="mr-1 size-3.5" />
					{currentNumber ? `Cântico ${currentNumber}` : "Escolher cântico"}
				</Button>
			</DialogTrigger>

			<DialogContent className="rounded-3xl sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{label}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 px-1 py-2">
					<div className="space-y-2">
						<Label htmlFor={`weekend-song-${partId}`}>Número do cântico</Label>
						<Input
							id={`weekend-song-${partId}`}
							inputMode="numeric"
							value={number}
							onChange={(event) => setNumber(event.target.value)}
							placeholder="Ex.: 12"
							className="min-h-11 rounded-xl"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`weekend-song-search-${partId}`}>
							Buscar pelo tema
						</Label>
						<Input
							id={`weekend-song-search-${partId}`}
							value={songSearch.query}
							onChange={(event) => songSearch.search(event.target.value)}
							placeholder="Digite parte do tema…"
							className="min-h-11 rounded-xl"
						/>

						{songSearch.searched ? (
							<ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
								{songSearch.results.length === 0 ? (
									<li className="px-2 py-1.5 text-caption text-muted-foreground">
										Nenhum cântico encontrado.
									</li>
								) : (
									songSearch.results.map((song) => (
										<li key={song.number}>
											<button
												type="button"
												onClick={() => setNumber(String(song.number))}
												className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm hover:bg-muted"
											>
												<span className="font-medium">{song.number}</span>
												<span className="min-w-0 flex-1 truncate text-muted-foreground">
													{song.title}
												</span>
											</button>
										</li>
									))
								)}
							</ul>
						) : null}
					</div>

					{error ? (
						<p role="alert" className="text-body-sm text-destructive">
							{error}
						</p>
					) : null}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						className="min-h-11 rounded-xl"
					>
						Fechar
					</Button>
					<Button
						type="button"
						disabled={pending}
						onClick={handleSave}
						className="min-h-11 rounded-xl"
					>
						Salvar cântico
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function useTalkSearch(slug: string) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<WeekendTalkOption[]>([]);
	const [searched, setSearched] = useState(false);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function search(nextQuery: string) {
		setQuery(nextQuery);
		startTransition(async () => {
			const result = await searchWeekendTalksAction({
				slug,
				search: nextQuery,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setError(null);
			setResults(result.data);
			setSearched(true);
		});
	}

	return { query, results, searched, pending, error, search };
}

export function WeekendTalkDialog({
	slug,
	partId,
	currentNumber,
	disabled,
}: {
	slug: string;
	partId: string;
	currentNumber: number | null;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [number, setNumber] = useState(currentNumber?.toString() ?? "");
	const [newTitle, setNewTitle] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const talkSearch = useTalkSearch(slug);

	function handleSelect(talkNumber: number) {
		startTransition(async () => {
			const result = await updateWeekendPublicTalkAction({
				slug,
				partId,
				talkNumber,
			});

			if (!result.ok) {
				setError(result.error);
				setShowCreate(true);
				setNumber(String(talkNumber));
				return;
			}

			setOpen(false);
			setError(null);
			setShowCreate(false);
		});
	}

	function handleCreate() {
		const parsed = Number(number);

		if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
			setError("Informe o número do discurso (1 a 999).");
			return;
		}

		if (newTitle.trim().length < 2) {
			setError("Informe o tema do discurso para cadastrar.");
			return;
		}

		startTransition(async () => {
			const result = await createWeekendPublicTalkAction({
				slug,
				partId,
				talkNumber: parsed,
				title: newTitle.trim(),
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
			setError(null);
			setShowCreate(false);
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={disabled}
					className="min-h-9 rounded-xl px-2 text-caption font-medium text-primary hover:bg-primary/10"
				>
					<HiOutlinePencil aria-hidden="true" className="mr-1 size-3.5" />
					{currentNumber ? `Discurso ${currentNumber}` : "Escolher discurso"}
				</Button>
			</DialogTrigger>

			<DialogContent className="rounded-3xl sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Discurso público</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 px-1 py-2">
					<div className="space-y-2">
						<Label htmlFor={`weekend-talk-search-${partId}`}>
							Buscar por número ou tema
						</Label>
						<Input
							id={`weekend-talk-search-${partId}`}
							value={talkSearch.query}
							onChange={(event) => talkSearch.search(event.target.value)}
							placeholder="Ex.: 12 ou tema…"
							className="min-h-11 rounded-xl"
						/>

						{talkSearch.searched ? (
							<ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
								{talkSearch.results.length === 0 ? (
									<li className="px-2 py-1.5 text-caption text-muted-foreground">
										Nenhum discurso encontrado. Cadastre abaixo.
									</li>
								) : (
									talkSearch.results.map((talk) => (
										<li key={talk.id}>
											<button
												type="button"
												onClick={() => handleSelect(talk.number)}
												className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm hover:bg-muted"
											>
												<span className="font-medium">{talk.number}</span>
												<span className="min-w-0 flex-1 truncate text-muted-foreground">
													{talk.title}
												</span>
											</button>
										</li>
									))
								)}
							</ul>
						) : null}
					</div>

					{showCreate ? (
						<div className="space-y-2 rounded-2xl border border-dashed border-border p-3">
							<Label htmlFor={`weekend-talk-new-${partId}`}>
								Cadastrar discurso {number}
							</Label>
							<Input
								id={`weekend-talk-new-${partId}`}
								value={newTitle}
								onChange={(event) => setNewTitle(event.target.value)}
								placeholder="Tema do discurso…"
								className="min-h-11 rounded-xl"
							/>
							<Button
								type="button"
								disabled={pending}
								onClick={handleCreate}
								className="min-h-11 w-full rounded-xl"
							>
								Cadastrar e usar
							</Button>
						</div>
					) : null}

					{error ? (
						<p role="alert" className="text-body-sm text-destructive">
							{error}
						</p>
					) : null}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						className="min-h-11 rounded-xl"
					>
						Fechar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function WeekendStudyThemeDialog({
	slug,
	partId,
	currentTitle,
	disabled,
}: {
	slug: string;
	partId: string;
	currentTitle: string;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState(currentTitle);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handleSave() {
		if (title.trim().length < 2) {
			setError("Informe o tema do estudo.");
			return;
		}

		startTransition(async () => {
			const result = await updateWeekendStudyThemeAction({
				slug,
				partId,
				title: title.trim(),
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
			setError(null);
		});
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={disabled}
					className="min-h-9 rounded-xl px-2 text-caption font-medium text-primary hover:bg-primary/10"
				>
					<HiOutlinePencil aria-hidden="true" className="mr-1 size-3.5" />
					Editar tema
				</Button>
			</DialogTrigger>

			<DialogContent className="rounded-3xl sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Tema do estudo</DialogTitle>
				</DialogHeader>

				<div className="space-y-3 px-1 py-2">
					<div className="space-y-2">
						<Label htmlFor={`weekend-study-${partId}`}>Tema</Label>
						<Input
							id={`weekend-study-${partId}`}
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							className="min-h-11 rounded-xl"
						/>
					</div>

					{error ? (
						<p role="alert" className="text-body-sm text-destructive">
							{error}
						</p>
					) : null}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						className="min-h-11 rounded-xl"
					>
						Fechar
					</Button>
					<Button
						type="button"
						disabled={pending}
						onClick={handleSave}
						className="min-h-11 rounded-xl"
					>
						Salvar tema
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
