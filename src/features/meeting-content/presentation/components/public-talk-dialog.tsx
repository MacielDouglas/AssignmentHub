"use client";

import { useActionState, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
	createPublicTalkAction,
	updatePublicTalkAction,
} from "../actions/public-talk.actions";

type TalkData = {
	id: string;
	organizationId: string | null;
	scope: "GLOBAL" | "LOCAL";
	locale: "pt" | "es";
	number: number;
	title: string;
	notes: string | null;
	updatedAt: Date | string;
};

type PublicTalkDialogProps = {
	slug: string;
	mode: "create" | "edit";
	talk?: TalkData;
	isSuperAdmin?: boolean;
	trigger: React.ReactNode;
};

const initialState = {
	success: false,
	error: null as string | null,
};

export function PublicTalkDialog({
	slug,
	mode,
	talk,
	isSuperAdmin = false,
	trigger,
}: PublicTalkDialogProps) {
	const [open, setOpen] = useState(false);
	const action =
		mode === "create" ? createPublicTalkAction : updatePublicTalkAction;
	const [state, formAction, pending] = useActionState(action, initialState);

	// Fecha ao sucesso; reabre só se o usuário abrir de novo após um novo ciclo
	const dialogOpen = open && !state.success;

	const formKey = useMemo(() => {
		if (mode === "edit" && talk) {
			return `edit-${talk.id}-${String(talk.updatedAt ?? "")}`;
		}
		return `create-${dialogOpen ? "open" : "closed"}`;
	}, [mode, dialogOpen, talk]);

	function handleOpenChange(next: boolean) {
		// Ao abrir de novo, precisamos “consumir” o success anterior.
		// Como useActionState não tem reset nativo fácil, forçamos remount do form
		// via formKey e só controlamos o open local.
		if (next) {
			setOpen(true);
			return;
		}
		setOpen(false);
	}

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent className="max-w-lg rounded-[28px] p-0">
				<DialogHeader className="border-b border-slate-200 px-5 py-4 text-left dark:border-slate-800">
					<DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
						{mode === "create" ? "Novo discurso" : "Editar discurso"}
					</DialogTitle>
				</DialogHeader>

				<form key={formKey} action={formAction} className="space-y-4 px-5 py-5">
					<input type="hidden" name="slug" value={slug} />

					{mode === "edit" && talk ? (
						<>
							<input type="hidden" name="id" value={talk.id} />
							<input type="hidden" name="scope" value={talk.scope} />
						</>
					) : null}

					{isSuperAdmin && mode === "create" ? (
						<div className="space-y-2">
							<Label htmlFor={`scope-${mode}`}>Destino do catálogo</Label>
							<select
								id={`scope-${mode}`}
								name="scope"
								defaultValue="LOCAL"
								disabled={pending}
								className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
							>
								<option value="LOCAL">Somente esta organização</option>
								<option value="GLOBAL">Catálogo global</option>
							</select>
						</div>
					) : mode === "create" ? (
						<input type="hidden" name="scope" value="LOCAL" />
					) : null}

					<div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
						<div className="space-y-2">
							<Label htmlFor={`locale-${mode}`}>Idioma</Label>
							<select
								id={`locale-${mode}`}
								name="locale"
								defaultValue={talk?.locale ?? "pt"}
								disabled={pending}
								className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
							>
								<option value="pt">Português</option>
								<option value="es">Español</option>
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`number-${mode}`}>Número</Label>
							<Input
								id={`number-${mode}`}
								name="number"
								type="number"
								min={1}
								max={999}
								defaultValue={talk?.number ?? ""}
								disabled={pending}
								className="min-h-11 rounded-2xl"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`title-${mode}`}>Título</Label>
						<Input
							id={`title-${mode}`}
							name="title"
							defaultValue={talk?.title ?? ""}
							disabled={pending}
							className="min-h-11 rounded-2xl"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`notes-${mode}`}>Notas</Label>
						<Textarea
							id={`notes-${mode}`}
							name="notes"
							defaultValue={talk?.notes ?? ""}
							disabled={pending}
							rows={4}
							className="rounded-2xl"
						/>
					</div>

					{state.error ? (
						<Alert variant="destructive">
							<AlertDescription>{state.error}</AlertDescription>
						</Alert>
					) : null}

					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							className="min-h-11 rounded-2xl"
							disabled={pending}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							className="min-h-11 rounded-2xl"
							disabled={pending}
						>
							{pending
								? mode === "create"
									? "Salvando..."
									: "Atualizando..."
								: mode === "create"
									? "Salvar discurso"
									: "Salvar alterações"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
