"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { WatchtowerStudyEntity } from "@/features/meeting-content/domain/entities/watchtower-study";

import { updateWatchtowerStudyAction } from "../actions/watchtower.actions";

type Props = {
	slug: string;
	study: WatchtowerStudyEntity;
	disabled?: boolean;
	onError?: (message: string | null) => void;
	onMessage?: (message: string | null) => void;
};

type EditorState = {
	title: string;
	weekStart: string;
	weekEnd: string;
	weekLabelRaw: string;
	issueCode: string;
	openingSongNum: string;
	closingSongNum: string;
	highlightColor: string;
};

function createEditor(study: WatchtowerStudyEntity): EditorState {
	return {
		title: study.title ?? "",
		weekStart: study.weekStart ?? "",
		weekEnd: study.weekEnd ?? "",
		weekLabelRaw: study.weekLabelRaw ?? "",
		issueCode: study.issueCode ?? "",
		openingSongNum: study.openingSongNum ? String(study.openingSongNum) : "",
		closingSongNum: study.closingSongNum ? String(study.closingSongNum) : "",
		highlightColor: study.highlightColor ?? "",
	};
}

function normalizeColor(value: string) {
	const normalized = value.trim().toUpperCase();
	if (!normalized) return null;
	const finalValue = normalized.startsWith("#") ? normalized : `#${normalized}`;
	return /^#[0-9A-F]{6}$/.test(finalValue) ? finalValue : null;
}

export function WatchtowerEditStudyDialog({
	slug,
	study,
	disabled = false,
	onError,
	onMessage,
}: Props) {
	const [open, setOpen] = useState(false);
	const [editor, setEditor] = useState<EditorState>(() => createEditor(study));
	const [editorError, setEditorError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const formDisabled = disabled || pending;

	function resetState() {
		setEditor(createEditor(study));
		setEditorError(null);
	}

	function handleOpenChange(nextOpen: boolean) {
		if (pending) return;
		setOpen(nextOpen);
		if (nextOpen) resetState();
	}

	function save() {
		const title = editor.title.trim();
		const weekStart = editor.weekStart.trim();
		const weekEnd = editor.weekEnd.trim();
		const openingSongNum = editor.openingSongNum
			? Number(editor.openingSongNum)
			: study.openingSongNum;
		const closingSongNum = editor.closingSongNum
			? Number(editor.closingSongNum)
			: study.closingSongNum;
		const highlightColor = editor.highlightColor.trim()
			? normalizeColor(editor.highlightColor)
			: null;

		if (!title) {
			setEditorError("Informe o título do estudo.");
			return;
		}

		if (
			!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) ||
			!/^\d{4}-\d{2}-\d{2}$/.test(weekEnd)
		) {
			setEditorError("Informe datas válidas para início e fim.");
			return;
		}

		if (weekEnd < weekStart) {
			setEditorError("A data final não pode ser anterior ao início.");
			return;
		}

		if (
			openingSongNum !== null &&
			(!Number.isInteger(openingSongNum) ||
				openingSongNum < 1 ||
				openingSongNum > 999)
		) {
			setEditorError("O cântico inicial deve estar entre 1 e 999.");
			return;
		}

		if (
			closingSongNum !== null &&
			(!Number.isInteger(closingSongNum) ||
				closingSongNum < 1 ||
				closingSongNum > 999)
		) {
			setEditorError("O cântico final deve estar entre 1 e 999.");
			return;
		}

		if (editor.highlightColor.trim() && !highlightColor) {
			setEditorError("A cor deve estar no formato #RRGGBB.");
			return;
		}

		onError?.(null);
		onMessage?.(null);

		startTransition(async () => {
			const result = await updateWatchtowerStudyAction(slug, {
				id: study.id,
				title,
				locale: study.locale,
				weekStart,
				weekEnd,
				weekLabelRaw: editor.weekLabelRaw.trim(),
				issueCode: editor.issueCode.trim() || null,
				openingSong: openingSongNum ?? 0,
				closingSong: closingSongNum ?? 0,
				highlightColor,
			});

			if (!result.ok) {
				setEditorError(result.error);
				onError?.(result.error);
				return;
			}

			setOpen(false);
			setEditorError(null);
			onMessage?.("Estudo atualizado com sucesso.");
		});
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<button
					type="button"
					disabled={disabled}
					className="app-button-secondary inline-flex items-center gap-2 min-h-10 rounded-2xl"
				>
					<Pencil className="size-4 shrink-0" />
					Editar
				</button>
			</DialogTrigger>

			<DialogContent className="app-dialog-content sm:max-w-lg">
				<DialogHeader className="app-dialog-header">
					<DialogTitle>Editar estudo</DialogTitle>
					<DialogDescription>
						Atualize as informações principais mantendo consistência entre
						datas, cânticos e cor de destaque.
					</DialogDescription>
				</DialogHeader>

				<div className="app-dialog-body">
					<div className="grid gap-2">
						<label
							htmlFor="watchtower-title"
							className="text-label text-muted-foreground"
						>
							Título
						</label>
						<input
							id="watchtower-title"
							value={editor.title}
							disabled={formDisabled}
							maxLength={300}
							onChange={(event) =>
								setEditor((current) => ({
									...current,
									title: event.target.value,
								}))
							}
							className="app-input w-full"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label
								htmlFor="watchtower-week-start"
								className="text-label text-muted-foreground"
							>
								Início
							</label>
							<input
								id="watchtower-week-start"
								type="date"
								value={editor.weekStart}
								disabled={formDisabled}
								onChange={(event) =>
									setEditor((current) => ({
										...current,
										weekStart: event.target.value,
									}))
								}
								className="app-input w-full"
							/>
						</div>

						<div className="grid gap-2">
							<label
								htmlFor="watchtower-week-end"
								className="text-label text-muted-foreground"
							>
								Fim
							</label>
							<input
								id="watchtower-week-end"
								type="date"
								value={editor.weekEnd}
								disabled={formDisabled}
								onChange={(event) =>
									setEditor((current) => ({
										...current,
										weekEnd: event.target.value,
									}))
								}
								className="app-input w-full"
							/>
						</div>
					</div>

					<div className="grid gap-2">
						<label
							htmlFor="watchtower-week-label"
							className="text-label text-muted-foreground"
						>
							Rótulo da semana
						</label>
						<input
							id="watchtower-week-label"
							value={editor.weekLabelRaw}
							disabled={formDisabled}
							maxLength={150}
							onChange={(event) =>
								setEditor((current) => ({
									...current,
									weekLabelRaw: event.target.value,
								}))
							}
							className="app-input w-full"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label
								htmlFor="watchtower-issue-code"
								className="text-label text-muted-foreground"
							>
								Código da edição
							</label>
							<input
								id="watchtower-issue-code"
								value={editor.issueCode}
								disabled={formDisabled}
								maxLength={40}
								onChange={(event) =>
									setEditor((current) => ({
										...current,
										issueCode: event.target.value,
									}))
								}
								className="app-input w-full"
							/>
						</div>

						<div className="grid gap-2">
							<label
								htmlFor="watchtower-highlight-color"
								className="text-label text-muted-foreground"
							>
								Cor de destaque
							</label>
							<input
								id="watchtower-highlight-color"
								value={editor.highlightColor}
								disabled={formDisabled}
								placeholder="#2563EB"
								maxLength={7}
								onChange={(event) =>
									setEditor((current) => ({
										...current,
										highlightColor: event.target.value.toUpperCase(),
									}))
								}
								className="app-input w-full uppercase"
							/>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label
								htmlFor="watchtower-opening-song"
								className="text-label text-muted-foreground"
							>
								Cântico inicial
							</label>
							<input
								id="watchtower-opening-song"
								type="number"
								inputMode="numeric"
								min={1}
								max={999}
								value={editor.openingSongNum}
								disabled={formDisabled}
								onChange={(event) =>
									setEditor((current) => ({
										...current,
										openingSongNum: event.target.value,
									}))
								}
								className="app-input w-full"
							/>
						</div>

						<div className="grid gap-2">
							<label
								htmlFor="watchtower-closing-song"
								className="text-label text-muted-foreground"
							>
								Cântico final
							</label>
							<input
								id="watchtower-closing-song"
								type="number"
								inputMode="numeric"
								min={1}
								max={999}
								value={editor.closingSongNum}
								disabled={formDisabled}
								onChange={(event) =>
									setEditor((current) => ({
										...current,
										closingSongNum: event.target.value,
									}))
								}
								className="app-input w-full"
							/>
						</div>
					</div>

					{editorError ? (
						<p
							role="alert"
							className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
						>
							{editorError}
						</p>
					) : null}
				</div>

				<div className="app-dialog-footer px-5 py-4">
					<button
						type="button"
						disabled={formDisabled}
						onClick={() => handleOpenChange(false)}
						className="app-button-secondary"
					>
						Cancelar
					</button>

					<button
						type="button"
						disabled={formDisabled}
						onClick={save}
						className="app-button-primary"
					>
						Salvar alterações
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
