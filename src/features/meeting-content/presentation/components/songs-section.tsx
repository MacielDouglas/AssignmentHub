"use client";

import { Pencil, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	discardSongbookImportAction,
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
	return { id: null, number: "", title: "", locale };
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
	const [editor, setEditor] = useState<SongEditorState>(newSongState("pt"));
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
		setLocalDraft({ jobId: pendingJob.id, value: nextDraft });
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
			setLocalDraft({ jobId: pendingJob.id, value: draft });
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

	function discardImport() {
		if (!pendingJob) return;
		if (!confirm("Descartar esta importação de cânticos?")) return;

		startTransition(async () => {
			setError(null);
			const result = await discardSongbookImportAction(slug, pendingJob.id);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setLocalDraft(null);
			setMessage("Importação descartada.");
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
		if (!confirm(`Excluir TODOS os cânticos em ${contentLocaleLabel(locale)}?`))
			return;
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
			if (next.has(songId)) next.delete(songId);
			else next.add(songId);
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
		<section className="space-y-4">
			<header className="app-card app-card-body space-y-4">
				<div className="space-y-1">
					<p className="app-chip-brand">Cânticos</p>
					<h2 className="text-headline text-foreground">Cânticos</h2>
					<p className="text-body-sm text-muted-foreground">
						Gerencie o catálogo de cânticos por idioma, importe arquivos .jwpub
						(sjj) e mantenha os números e títulos organizados.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div className="app-segmented">
						<button
							type="button"
							disabled={pending}
							data-state={locale === "pt" ? "active" : "inactive"}
							onClick={() => setLocale("pt")}
							className="app-segmented-item"
						>
							Português
						</button>
						<button
							type="button"
							disabled={pending}
							data-state={locale === "es" ? "active" : "inactive"}
							onClick={() => setLocale("es")}
							className="app-segmented-item"
						>
							Español
						</button>
					</div>

					<span className="app-chip">
						{totalLocale} cântico(s) em {contentLocaleLabel(locale)}
					</span>
				</div>

				{canManage ? (
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							disabled={pending}
							onClick={openCreateDialog}
							className="app-button-secondary"
						>
							<Plus className="mr-2 size-4" />
							Adicionar
						</button>

						<label className="app-button-primary inline-flex cursor-pointer items-center justify-center">
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
					</div>
				) : null}

				<div className="app-search">
					<HiOutlineMagnifyingGlass className="app-search-icon" />
					<input
						id="song-search"
						value={query}
						disabled={pending}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Buscar por número ou título"
						className="app-input app-search-input w-full"
					/>
				</div>

				{error ? (
					<p className="app-status-error" role="alert">
						{error}
					</p>
				) : null}

				{message ? (
					<p className="app-status-success" role="status">
						{message}
					</p>
				) : null}

				{pending ? (
					<p className="app-status-info" aria-live="polite">
						Processando…
					</p>
				) : null}
			</header>

			{canManage && pendingJob && reviewDraft ? (
				<SongbookReviewCard
					key={pendingJob.id}
					job={pendingJob}
					draft={reviewDraft}
					onChange={updateDraft}
					onSave={saveDraft}
					onCommit={commitImport}
					onDiscard={discardImport}
					pending={pending}
				/>
			) : null}

			<section
				aria-label="Lista de cânticos"
				className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm"
			>
				{canManage && selected.size > 0 ? (
					<div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
						<span className="text-sm text-muted-foreground">
							{selected.size} selecionado(s)
						</span>
						<button
							type="button"
							disabled={pending}
							onClick={removeSelected}
							className="app-button-danger min-h-10 rounded-xl px-3"
						>
							Excluir selecionados
						</button>
					</div>
				) : null}

				{filtered.length === 0 ? (
					<div className="app-list-empty m-4 text-center sm:m-5">
						Nenhum cântico encontrado para esse filtro.
					</div>
				) : (
					<ul className="grid gap-4 p-4 sm:p-5">
						{filtered.map((song) => {
							const checked = selected.has(song.id);

							return (
								<li
									key={song.id}
									className="rounded-4xl border border-border bg-card p-4 shadow-sm sm:p-5"
								>
									<div className="flex items-start gap-3">
										{canManage ? (
											<input
												type="checkbox"
												checked={checked}
												disabled={pending}
												onChange={() => toggleSelected(song.id)}
												className="mt-1 h-4 w-4 rounded border-border"
												aria-label={`Selecionar ${song.title}`}
											/>
										) : null}

										<div className="min-w-0 flex-1 space-y-3">
											<div className="flex flex-wrap items-center gap-2">
												<span className="app-chip">Nº {song.number}</span>
												<span className="app-chip">
													{song.locale === "pt" ? "Português" : "Español"}
												</span>
											</div>

											<div className="space-y-1">
												<h3 className="text-title text-foreground">
													{song.title}
												</h3>
											</div>

											{canManage ? (
												<div className="flex flex-wrap gap-2">
													<button
														type="button"
														disabled={pending}
														onClick={() => openEditDialog(song)}
														className="app-button-secondary min-h-10 rounded-2xl"
													>
														<Pencil className="mr-2 size-4" />
														Editar
													</button>
												</div>
											) : null}
										</div>
									</div>
								</li>
							);
						})}
					</ul>
				)}

				{canManage && totalLocale > 0 ? (
					<div className="border-t border-border px-4 py-3 sm:px-5">
						<button
							type="button"
							disabled={pending}
							onClick={removeAllLocale}
							className="min-h-10 text-sm font-medium text-destructive disabled:cursor-not-allowed disabled:opacity-60"
						>
							Excluir todos · {contentLocaleLabel(locale)}
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
		</section>
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
			<DialogContent className="app-dialog-content sm:max-w-md">
				<DialogHeader className="app-dialog-header">
					<DialogTitle>
						{editing ? "Editar cântico" : "Adicionar cântico"}
					</DialogTitle>
					<DialogDescription>
						O número deve ser único para cada idioma.
					</DialogDescription>
				</DialogHeader>

				<div className="app-dialog-body">
					<div className="grid gap-2">
						<label
							htmlFor="song-editor-locale"
							className="text-label text-muted-foreground"
						>
							Idioma
						</label>
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
							className="app-input w-full"
						>
							<option value="pt">Português</option>
							<option value="es">Español</option>
						</select>
					</div>

					<div className="grid gap-2">
						<label
							htmlFor="song-editor-number"
							className="text-label text-muted-foreground"
						>
							Número
						</label>
						<input
							id="song-editor-number"
							type="number"
							inputMode="numeric"
							min={1}
							max={999}
							value={editor.number}
							disabled={pending}
							onChange={(event) =>
								onChange({ ...editor, number: event.target.value })
							}
							className="app-input w-full"
						/>
					</div>

					<div className="grid gap-2">
						<label
							htmlFor="song-editor-title"
							className="text-label text-muted-foreground"
						>
							Título
						</label>
						<input
							id="song-editor-title"
							value={editor.title}
							disabled={pending}
							maxLength={300}
							onChange={(event) =>
								onChange({ ...editor, title: event.target.value })
							}
							className="app-input w-full"
						/>
					</div>

					{error ? (
						<p
							role="alert"
							className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
						>
							{error}
						</p>
					) : null}
				</div>

				<div className="app-dialog-footer px-5 py-4">
					<button
						type="button"
						disabled={pending}
						onClick={() => onOpenChange(false)}
						className="app-button-secondary"
					>
						Cancelar
					</button>

					<button
						type="button"
						disabled={pending}
						onClick={onSave}
						className="app-button-primary"
					>
						{editing ? "Salvar alterações" : "Adicionar cântico"}
					</button>
				</div>
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
	onDiscard,
	pending,
}: {
	job: ContentImportJobEntity;
	draft: SongbookExtract;
	onChange: (draft: SongbookExtract) => void;
	onSave: () => void;
	onCommit: () => void;
	onDiscard: () => void;
	pending: boolean;
}) {
	return (
		<section
			aria-labelledby="song-review-title"
			className="space-y-3 rounded-4xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5"
		>
			<div>
				<h3 id="song-review-title" className="text-title text-foreground">
					Revisar importação
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					{draft.songs.length} cânticos · {job.fileNames.join(", ")}
					{job.notes ? ` · ${job.notes}` : ""}
				</p>
			</div>

			<ul className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-border bg-card p-3">
				{draft.songs.map((song, idx) => (
					<li
						key={song.number}
						className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2"
					>
						<input
							type="number"
							min={1}
							max={999}
							value={song.number}
							aria-label={`Número do cântico ${idx + 1}`}
							disabled={pending}
							onChange={(event) => {
								const number = Number(event.target.value);
								const songs = draft.songs.map((current, currentIndex) =>
									currentIndex === idx ? { ...current, number } : current,
								);
								onChange({ ...draft, songs });
							}}
							className="min-h-10 rounded-xl border border-border px-2 text-sm"
						/>

						<input
							type="text"
							value={song.title}
							aria-label={`Título do cântico ${idx + 1}`}
							disabled={pending}
							onChange={(event) => {
								const title = event.target.value;
								const songs = draft.songs.map((current, currentIndex) =>
									currentIndex === idx ? { ...current, title } : current,
								);
								onChange({ ...draft, songs });
							}}
							className="min-h-10 rounded-xl border border-border px-3 text-sm"
						/>

						<button
							type="button"
							disabled={pending}
							onClick={() => {
								onChange({
									...draft,
									songs: draft.songs.filter(
										(_, currentIndex) => currentIndex !== idx,
									),
								});
							}}
							className="min-h-10 rounded-xl px-2 text-sm text-red-600"
						>
							Remover
						</button>
					</li>
				))}
			</ul>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={pending}
					onClick={onSave}
					className="app-button-secondary"
				>
					Salvar rascunho
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={onCommit}
					className="app-button-primary"
				>
					Confirmar e salvar no catálogo
				</button>

				<button
					type="button"
					disabled={pending}
					onClick={onDiscard}
					className="app-button-ghost text-destructive hover:text-destructive"
				>
					Descartar
				</button>
			</div>
		</section>
	);
}
