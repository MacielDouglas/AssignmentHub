"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type ContentLocale,
	contentLocaleLabel,
} from "@/features/meeting-content/domain/values-objects/content-locale";

import type { SongbookExtract } from "../../application/dto/songbook-extract.dto";
import type { SongEntity } from "../../domain/entities/song";
import type { ContentImportJobEntity } from "../../domain/entities/watchtower-study";
import {
	commitSongbookImportAction,
	createAndProcessSongbookImportAction,
	createSongAction,
	deleteAllSongsAction,
	deleteSongsAction,
	updateSongAction,
	updateSongbookImportDraftAction,
} from "../actions/song.actions";

type Props = {
	slug: string;
	canManage: boolean;
	songs: SongEntity[];
	counts: Array<{ locale: ContentLocale; count: number }>;
	pendingJob: ContentImportJobEntity | null;
};

type SongEditorState = {
	id: string | null;
	number: string;
	title: string;
	locale: ContentLocale;
};

function newSongState(locale: ContentLocale): SongEditorState {
	return {
		id: null,
		number: "",
		title: "",
		locale,
	};
}

function editSongState(song: SongEntity): SongEditorState {
	return {
		id: song.id,
		number: String(song.number),
		title: song.title,
		locale: song.locale,
	};
}

export function SongsSection({
	slug,
	canManage,
	songs,
	counts,
	pendingJob,
}: Props) {
	const [locale, setLocale] = useState<ContentLocale>("pt");
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const [editorOpen, setEditorOpen] = useState(false);
	const [editor, setEditor] = useState<SongEditorState>(() =>
		newSongState("pt"),
	);
	const [editorError, setEditorError] = useState<string | null>(null);

	const importedDraft = useMemo(() => {
		if (!pendingJob?.extractedJson) return null;
		return pendingJob.extractedJson as SongbookExtract;
	}, [pendingJob]);

	const [localDraft, setLocalDraft] = useState<{
		jobId: string;
		value: SongbookExtract;
	} | null>(null);

	const draft =
		localDraft && localDraft.jobId === pendingJob?.id
			? localDraft.value
			: importedDraft;

	function updateDraft(nextDraft: SongbookExtract) {
		if (!pendingJob) return;

		setLocalDraft({
			jobId: pendingJob.id,
			value: nextDraft,
		});
	}

	const filtered = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		return songs
			.filter((song) => song.locale === locale)
			.filter((song) => {
				if (!normalizedQuery) return true;

				return (
					String(song.number).includes(normalizedQuery) ||
					song.title.toLowerCase().includes(normalizedQuery)
				);
			});
	}, [songs, locale, query]);

	const totalLocale =
		counts.find((count) => count.locale === locale)?.count ??
		songs.filter((song) => song.locale === locale).length;

	const reviewDraft =
		draft ??
		(pendingJob?.extractedJson
			? (pendingJob.extractedJson as SongbookExtract)
			: null);

	function onUpload(fileList: FileList | null) {
		const file = fileList?.item(0);
		if (!file) return;

		const formData = new FormData();
		formData.set("locale", locale);
		formData.append("files", file);

		startTransition(async () => {
			setError(null);
			setMessage(null);

			const result = await createAndProcessSongbookImportAction(slug, formData);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage("Cânticos extraídos. Revise e confirme.");
		});
	}

	function saveDraft() {
		if (!pendingJob || !draft) return;

		startTransition(async () => {
			setError(null);

			const result = await updateSongbookImportDraftAction(
				slug,
				pendingJob.id,
				draft,
			);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setLocalDraft({
				jobId: pendingJob.id,
				value: draft,
			});
			setMessage("Rascunho salvo.");
		});
	}

	function commitImport() {
		if (!pendingJob) return;

		startTransition(async () => {
			setError(null);

			const result = await commitSongbookImportAction(slug, pendingJob.id);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage(`${result.data.upserted} cânticos salvos.`);
			setLocalDraft(null);
		});
	}

	function removeSelected() {
		if (selected.size === 0) return;

		startTransition(async () => {
			setError(null);

			const result = await deleteSongsAction(slug, [...selected]);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage(`${result.data.count} cântico(s) excluído(s).`);
			setSelected(new Set());
		});
	}

	function removeAllLocale() {
		const confirmed = confirm(
			`Excluir TODOS os cânticos em ${contentLocaleLabel(locale)}?`,
		);

		if (!confirmed) return;

		startTransition(async () => {
			setError(null);

			const result = await deleteAllSongsAction(slug, locale);

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setMessage(`${result.data.count} cântico(s) excluído(s).`);
			setSelected(new Set());
		});
	}

	function toggleSelected(songId: string) {
		setSelected((current) => {
			const next = new Set(current);

			if (next.has(songId)) {
				next.delete(songId);
			} else {
				next.add(songId);
			}

			return next;
		});
	}

	function openCreateDialog() {
		setEditor(newSongState(locale));
		setEditorError(null);
		setEditorOpen(true);
	}

	function openEditDialog(song: SongEntity) {
		setEditor(editSongState(song));
		setEditorError(null);
		setEditorOpen(true);
	}

	function closeEditor() {
		if (pending) return;
		setEditorOpen(false);
		setEditorError(null);
	}

	function saveSong() {
		const number = Number(editor.number);
		const title = editor.title.trim();

		if (!Number.isInteger(number) || number < 1 || number > 999) {
			setEditorError("Informe um número inteiro entre 1 e 999.");
			return;
		}

		if (!title) {
			setEditorError("Informe o título do cântico.");
			return;
		}

		startTransition(async () => {
			setEditorError(null);
			setError(null);

			const result = editor.id
				? await updateSongAction(slug, {
						id: editor.id,
						number,
						title,
						locale: editor.locale,
					})
				: await createSongAction(slug, {
						number,
						title,
						locale: editor.locale,
					});

			if (!result.ok) {
				setEditorError(result.error);
				return;
			}

			setEditorOpen(false);
			setMessage(
				editor.id
					? "Cântico atualizado com sucesso."
					: "Cântico adicionado com sucesso.",
			);
		});
	}

	return (
		<div className="space-y-4">
			<section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							Cânticos
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							{totalLocale} no catálogo · {contentLocaleLabel(locale)}
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<label className="sr-only" htmlFor="song-locale">
							Idioma
						</label>
						<select
							id="song-locale"
							value={locale}
							onChange={(event) =>
								setLocale(event.target.value as ContentLocale)
							}
							className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
						>
							<option value="pt">Português</option>
							<option value="es">Español</option>
						</select>

						{canManage ? (
							<>
								<Button
									type="button"
									variant="outline"
									className="min-h-11 rounded-2xl"
									disabled={pending}
									onClick={openCreateDialog}
								>
									<Plus className="size-4" />
									Adicionar
								</Button>

								<label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25">
									Importar .jwpub
									<input
										type="file"
										accept=".jwpub,application/octet-stream"
										className="sr-only"
										disabled={pending}
										onChange={(event) => {
											onUpload(event.target.files);
											event.target.value = "";
										}}
									/>
								</label>
							</>
						) : null}
					</div>
				</div>

				<div className="mt-4">
					<label className="sr-only" htmlFor="song-search">
						Buscar cântico
					</label>
					<input
						id="song-search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por número ou título"
						className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm dark:border-slate-700 dark:bg-slate-900"
					/>
				</div>

				{error ? (
					<p className="mt-3 text-sm text-red-600" role="alert">
						{error}
					</p>
				) : null}

				{message ? (
					<p className="mt-3 text-sm text-emerald-600" role="status">
						{message}
					</p>
				) : null}

				{pending ? (
					<p className="mt-3 text-sm text-slate-500" aria-live="polite">
						Processando…
					</p>
				) : null}
			</section>

			{canManage && pendingJob && reviewDraft ? (
				<SongbookReviewCard
					key={pendingJob.id}
					job={pendingJob}
					draft={reviewDraft}
					onChange={updateDraft}
					onSave={saveDraft}
					onCommit={commitImport}
					pending={pending}
				/>
			) : null}

			<section
				aria-label="Lista de cânticos"
				className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
			>
				{canManage && selected.size > 0 ? (
					<div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
						<span className="text-sm text-slate-600">
							{selected.size} selecionado(s)
						</span>

						<Button
							type="button"
							variant="destructive"
							size="sm"
							disabled={pending}
							onClick={removeSelected}
							className="rounded-xl"
						>
							Excluir selecionados
						</Button>
					</div>
				) : null}

				{filtered.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<p className="text-sm font-medium text-slate-700 dark:text-slate-200">
							Nenhum cântico neste idioma
						</p>
						<p className="mt-1 text-sm text-slate-500">
							Adicione manualmente ou importe o arquivo .jwpub do livro de
							cânticos (sjj).
						</p>
					</div>
				) : (
					<ul className="divide-y divide-slate-100 dark:divide-slate-900">
						{filtered.map((song) => {
							const checked = selected.has(song.id);
							const checkboxId = `song-select-${song.id}`;

							return (
								<li
									key={song.id}
									className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/60"
								>
									{canManage ? (
										<div className="flex shrink-0 items-center">
											<input
												id={checkboxId}
												type="checkbox"
												checked={checked}
												onChange={() => toggleSelected(song.id)}
												className="h-4 w-4 rounded border-slate-300"
											/>
											<label htmlFor={checkboxId} className="sr-only">
												Selecionar cântico {song.number}: {song.title}
											</label>
										</div>
									) : null}

									<span
										aria-hidden="true"
										className="inline-flex h-9 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
									>
										{song.number}
									</span>

									<span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
										{song.title}
									</span>

									{canManage ? (
										<Button
											type="button"
											size="icon"
											variant="ghost"
											className="size-10 shrink-0 rounded-xl"
											disabled={pending}
											onClick={() => openEditDialog(song)}
										>
											<Pencil className="size-4" />
											<span className="sr-only">
												Editar cântico {song.number}
											</span>
										</Button>
									) : null}
								</li>
							);
						})}
					</ul>
				)}

				{canManage && totalLocale > 0 ? (
					<div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
						<button
							type="button"
							onClick={removeAllLocale}
							disabled={pending}
							className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Excluir todos ({contentLocaleLabel(locale)})
						</button>
					</div>
				) : null}
			</section>

			<SongEditorDialog
				open={editorOpen}
				editor={editor}
				error={editorError}
				pending={pending}
				onOpenChange={(open) => {
					if (!open) closeEditor();
				}}
				onChange={setEditor}
				onSave={saveSong}
			/>
		</div>
	);
}

function SongEditorDialog({
	open,
	editor,
	error,
	pending,
	onOpenChange,
	onChange,
	onSave,
}: {
	open: boolean;
	editor: SongEditorState;
	error: string | null;
	pending: boolean;
	onOpenChange: (open: boolean) => void;
	onChange: (next: SongEditorState) => void;
	onSave: () => void;
}) {
	const editing = Boolean(editor.id);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-3xl sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{editing ? "Editar cântico" : "Adicionar cântico"}
					</DialogTitle>
					<DialogDescription>
						O número deve ser único para cada idioma.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-2">
					<div className="grid gap-2">
						<Label htmlFor="song-editor-locale">Idioma</Label>
						<select
							id="song-editor-locale"
							value={editor.locale}
							disabled={pending}
							onChange={(event) =>
								onChange({
									...editor,
									locale: event.target.value as ContentLocale,
								})
							}
							className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
						>
							<option value="pt">Português</option>
							<option value="es">Español</option>
						</select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="song-editor-number">Número</Label>
						<Input
							id="song-editor-number"
							type="number"
							inputMode="numeric"
							min={1}
							max={999}
							value={editor.number}
							disabled={pending}
							onChange={(event) =>
								onChange({
									...editor,
									number: event.target.value,
								})
							}
							className="rounded-xl"
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="song-editor-title">Título</Label>
						<Input
							id="song-editor-title"
							value={editor.title}
							disabled={pending}
							maxLength={300}
							onChange={(event) =>
								onChange({
									...editor,
									title: event.target.value,
								})
							}
							className="rounded-xl"
						/>
					</div>

					{error ? (
						<p
							role="alert"
							className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300"
						>
							{error}
						</p>
					) : null}
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						type="button"
						variant="outline"
						disabled={pending}
						onClick={() => onOpenChange(false)}
						className="rounded-xl"
					>
						<X className="size-4" />
						Cancelar
					</Button>

					<Button
						type="button"
						disabled={pending}
						onClick={onSave}
						className="rounded-xl"
					>
						{editing ? "Salvar alterações" : "Adicionar cântico"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function SongbookReviewCard({
	job,
	draft,
	onChange,
	onSave,
	onCommit,
	pending,
}: {
	job: ContentImportJobEntity;
	draft: SongbookExtract;
	onChange: (draft: SongbookExtract) => void;
	onSave: () => void;
	onCommit: () => void;
	pending: boolean;
}) {
	return (
		<section
			aria-labelledby="song-review-title"
			className="space-y-3 rounded-[28px] border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-5"
		>
			<div>
				<h3
					id="song-review-title"
					className="text-base font-semibold text-slate-900 dark:text-slate-50"
				>
					Revisar importação
				</h3>
				<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
					{draft.songs.length} cânticos · {job.fileNames.join(", ")}
					{job.notes ? ` · ${job.notes}` : ""}
				</p>
			</div>

			<ul className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
				{draft.songs.map((song, index) => (
					<li
						key={song.number}
						className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2"
					>
						<label className="sr-only" htmlFor={`draft-number-${index}`}>
							Número do cântico {index + 1}
						</label>
						<input
							id={`draft-number-${index}`}
							type="number"
							min={1}
							max={999}
							value={song.number}
							disabled={pending}
							onChange={(event) => {
								const number = Number(event.target.value);
								const songs = draft.songs.map((current, currentIndex) =>
									currentIndex === index ? { ...current, number } : current,
								);
								onChange({ ...draft, songs });
							}}
							className="min-h-10 rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
						/>

						<label className="sr-only" htmlFor={`draft-title-${index}`}>
							Título do cântico {index + 1}
						</label>
						<input
							id={`draft-title-${index}`}
							type="text"
							value={song.title}
							disabled={pending}
							onChange={(event) => {
								const title = event.target.value;
								const songs = draft.songs.map((current, currentIndex) =>
									currentIndex === index ? { ...current, title } : current,
								);
								onChange({ ...draft, songs });
							}}
							className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
						/>

						<Button
							type="button"
							variant="ghost"
							disabled={pending}
							onClick={() => {
								onChange({
									...draft,
									songs: draft.songs.filter(
										(_, currentIndex) => currentIndex !== index,
									),
								});
							}}
							className="min-h-10 rounded-xl px-2 text-sm text-red-600 hover:text-red-700"
						>
							Remover
						</Button>
					</li>
				))}
			</ul>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={pending}
					onClick={onSave}
					className="rounded-2xl"
				>
					Salvar rascunho
				</Button>

				<Button
					type="button"
					disabled={pending}
					onClick={onCommit}
					className="rounded-2xl"
				>
					Confirmar e salvar no catálogo
				</Button>
			</div>
		</section>
	);
}
