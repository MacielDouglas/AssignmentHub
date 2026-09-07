"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import {
	deleteDedicatedEventAction,
	upsertSpecialTalkAction,
} from "@/features/settings/meetings/actions/dedicated-event-actions";
import type { SpecialEventListItem } from "@/features/settings/meetings/components/settings-shell";

const initialState: SettingsActionState = { success: false, message: "" };

const fieldClassName =
	"h-11 w-full rounded-4xl border border-border bg-card px-3 text-sm outline-none ring-primary/30 focus:ring-4";

export type SpeakerOption = { id: string; name: string };

/** Discurso especial (tabela dedicada): data obrigatória; tema e orador opcionais. Sem horário. */
export function SpecialTalkFormDialog({
	organizationSlug,
	event,
	people,
}: {
	organizationSlug: string;
	event?: SpecialEventListItem;
	people: SpeakerOption[];
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{event ? (
					<Button variant="outline" className="h-10 rounded-2xl">
						Editar
					</Button>
				) : (
					<Button className="h-11 rounded-4xl bg-primary text-primary-foreground">
						<HiOutlinePlus className="mr-2 h-4 w-4" />
						Novo discurso especial
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto rounded-4xl sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{event ? "Editar discurso especial" : "Novo discurso especial"}
					</DialogTitle>
				</DialogHeader>
				<SpecialTalkFormFields
					organizationSlug={organizationSlug}
					event={event}
					people={people}
					onCancel={() => setOpen(false)}
					onSuccess={() => {
						setOpen(false);
						router.refresh();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

function SpecialTalkFormFields({
	organizationSlug,
	event,
	people,
	onCancel,
	onSuccess,
}: {
	organizationSlug: string;
	event?: SpecialEventListItem;
	people: SpeakerOption[];
	onCancel: () => void;
	onSuccess: () => void;
}) {
	const [state, formAction, pending] = useActionState(
		upsertSpecialTalkAction,
		initialState,
	);
	const [handledSuccess, setHandledSuccess] = useState(false);
	useEffect(() => {
		if (state.success && !handledSuccess) {
			setHandledSuccess(true);
			onSuccess();
		}
	}, [state.success, handledSuccess, onSuccess]);

	return (
		<form action={formAction} className="space-y-4">
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			{event ? <input type="hidden" name="id" value={event.id} /> : null}

			<div className="space-y-2">
				<Label className="text-sm font-medium">Data *</Label>
				<input
					type="date"
					name="date"
					defaultValue={event?.startDate ?? ""}
					required
					className={fieldClassName}
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-sm font-medium">Tema (opcional)</Label>
				<input
					name="theme"
					defaultValue={event?.theme ?? ""}
					maxLength={200}
					placeholder="Ex.: Seja paciente"
					className={fieldClassName}
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-sm font-medium">
					Orador — pessoa da organização (opcional)
				</Label>
				<select
					name="speakerPersonId"
					defaultValue={event?.speakerPersonId ?? ""}
					className={fieldClassName}
				>
					<option value="">Nenhum / externo</option>
					{people.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
			</div>

			<div className="space-y-2">
				<Label className="text-sm font-medium">
					Orador — nome livre (opcional)
				</Label>
				<input
					name="speakerName"
					defaultValue={event?.speakerName ?? ""}
					maxLength={200}
					placeholder="Ex.: Orador visitante"
					className={fieldClassName}
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-sm font-medium">Observações (opcional)</Label>
				<textarea
					name="notes"
					defaultValue={event?.notes ?? ""}
					rows={3}
					className="w-full rounded-4xl border border-border bg-card px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-4"
				/>
			</div>

			{state.message && !state.success ? (
				<p className="text-sm text-red-600">{state.message}</p>
			) : null}

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					className="h-11 rounded-2xl"
					onClick={onCancel}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					disabled={pending}
					className="h-11 rounded-4xl bg-primary text-primary-foreground"
				>
					{pending ? "Salvando..." : "Salvar"}
				</Button>
			</div>
		</form>
	);
}

export function DeleteSpecialTalkButton({
	organizationSlug,
	eventId,
}: {
	organizationSlug: string;
	eventId: string;
}) {
	const router = useRouter();
	const [state, action, pending] = useActionState(
		deleteDedicatedEventAction,
		initialState,
	);
	const [handled, setHandled] = useState(false);
	useEffect(() => {
		if (state.success && !handled) {
			setHandled(true);
			router.refresh();
		}
	}, [state.success, handled, router]);
	return (
		<form action={action}>
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			<input type="hidden" name="source" value="SPECIAL_TALK" />
			<input type="hidden" name="id" value={eventId} />
			<Button
				type="submit"
				variant="outline"
				disabled={pending}
				className="h-10 rounded-2xl text-red-600"
			>
				<HiOutlineTrash className="mr-1 h-4 w-4" />
				{pending ? "..." : "Excluir"}
			</Button>
			{state.message && !state.success ? (
				<p className="mt-1 text-xs text-red-600">{state.message}</p>
			) : null}
		</form>
	);
}
