"use client";

import { useActionState, useState } from "react";

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
	const [formInstance, setFormInstance] = useState(0);

	const action =
		mode === "create" ? createPublicTalkAction : updatePublicTalkAction;

	const [state, formAction, pending] = useActionState(action, initialState);

	// useEffect(() => {
	//   if (!state.success) return;

	//   setOpen(false);
	// }, [state.success]);

	function handleOpenChange(nextOpen: boolean) {
		if (pending) return;

		if (nextOpen) {
			setFormInstance((current) => current + 1);
		}

		setOpen(nextOpen);
	}

	const formKey = [
		mode,
		talk?.id ?? "new",
		String(talk?.updatedAt ?? ""),
		formInstance,
	].join("-");

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent className="max-w-lg rounded-[28px] p-0">
				<DialogHeader className="border-b border-border px-5 py-4 text-left">
					<DialogTitle className="text-title text-foreground">
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
							<Label htmlFor={`scope-${formKey}`}>Destino do catálogo</Label>

							<select
								id={`scope-${formKey}`}
								name="scope"
								defaultValue="LOCAL"
								disabled={pending}
								className="min-h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
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
							<Label htmlFor={`locale-${formKey}`}>Idioma</Label>

							<select
								id={`locale-${formKey}`}
								name="locale"
								defaultValue={talk?.locale ?? "pt"}
								disabled={pending}
								className="min-h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
							>
								<option value="pt">Português</option>
								<option value="es">Español</option>
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`number-${formKey}`}>Número</Label>

							<Input
								id={`number-${formKey}`}
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
						<Label htmlFor={`title-${formKey}`}>Título</Label>

						<Input
							id={`title-${formKey}`}
							name="title"
							defaultValue={talk?.title ?? ""}
							disabled={pending}
							className="min-h-11 rounded-2xl"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`notes-${formKey}`}>Notas</Label>

						<Textarea
							id={`notes-${formKey}`}
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
