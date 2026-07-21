"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { HiOutlinePlus } from "react-icons/hi2";

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
import { upsertSpecialEventAction } from "@/features/settings/meetings/actions/upsert-special-event-action";
import type { SpecialEventListItem } from "@/features/settings/meetings/components/settings-shell";
import {
	SPECIAL_EVENT_META,
	SPECIAL_EVENT_TYPES,
	type SpecialEventType,
} from "@/features/settings/meetings/lib/special-event-meta";

const initialState: SettingsActionState = { success: false, message: "" };

const fieldClassName =
	"h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-slate-800 dark:bg-slate-950";

type SpecialEventFormDialogProps = {
	organizationSlug: string;
	event?: SpecialEventListItem;
};

function parseTravelerName(notes: string | null | undefined) {
	if (!notes?.startsWith("Viajante: ")) return "";
	return notes.replace(/^Viajante:\s*/, "").split(" | ")[0] ?? "";
}

function parseTravelerNotes(notes: string | null | undefined) {
	if (!notes?.startsWith("Viajante: ")) return notes ?? "";
	if (!notes.includes(" | ")) return "";
	return notes.split(" | ").slice(1).join(" | ");
}

export function SpecialEventFormDialog({
	organizationSlug,
	event,
}: SpecialEventFormDialogProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	/** Remonta o form (e o useActionState) a cada abertura — limpa success anterior */
	const [formInstance, setFormInstance] = useState(0);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (next) {
			setFormInstance((n) => n + 1);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				{event ? (
					<Button variant="outline" className="h-10 rounded-2xl">
						Editar
					</Button>
				) : (
					<Button className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white">
						<HiOutlinePlus className="mr-2 h-4 w-4" />
						Novo evento
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{event ? "Editar evento especial" : "Novo evento especial"}
					</DialogTitle>
				</DialogHeader>

				{open ? (
					<SpecialEventFormFields
						key={formInstance}
						organizationSlug={organizationSlug}
						event={event}
						onCancel={() => setOpen(false)}
						onSuccess={() => {
							setOpen(false);
							router.refresh();
						}}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

type FormFieldsProps = {
	organizationSlug: string;
	event?: SpecialEventListItem;
	onCancel: () => void;
	onSuccess: () => void;
};

function SpecialEventFormFields({
	organizationSlug,
	event,
	onCancel,
	onSuccess,
}: FormFieldsProps) {
	const [type, setType] = useState<SpecialEventType>(
		event?.type ?? "CELEBRATION",
	);

	const [state, formAction, pending] = useActionState(
		upsertSpecialEventAction,
		initialState,
	);

	// Fecha + refresh quando a action termina com sucesso (padrão React: ajustar estado no render)
	const [handledSuccess, setHandledSuccess] = useState(false);
	if (state.success && !handledSuccess) {
		setHandledSuccess(true);
		onSuccess();
	}

	const meta = SPECIAL_EVENT_META[type];
	const travelerName = parseTravelerName(event?.notes ?? null);
	const notesDefault =
		event?.type === "TRAVELING_OVERSEER_VISIT"
			? parseTravelerNotes(event.notes)
			: (event?.notes ?? "");

	return (
		<form action={formAction} className="space-y-4">
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			{event ? (
				<input type="hidden" name="occurrenceId" value={event.id} />
			) : null}

			<div className="space-y-2">
				<Label className="text-sm font-medium">Tipo</Label>
				<select
					name="type"
					value={type}
					disabled={Boolean(event)}
					onChange={(e) => setType(e.target.value as SpecialEventType)}
					className={fieldClassName}
				>
					{SPECIAL_EVENT_TYPES.map((t) => (
						<option key={t} value={t}>
							{SPECIAL_EVENT_META[t].label}
						</option>
					))}
				</select>
			</div>

			{meta.fields.includes("title") ? (
				<div className="space-y-2">
					<Label className="text-sm font-medium">
						{meta.titleLabel ?? "Título"}
					</Label>
					<input
						name="title"
						defaultValue={travelerName}
						className={fieldClassName}
						required
					/>
				</div>
			) : null}

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label className="text-sm font-medium">Data inicial</Label>
					<input
						type="date"
						name="startDate"
						defaultValue={event?.startDate ?? ""}
						required
						className={fieldClassName}
					/>
				</div>
				{meta.fields.includes("endDate") ? (
					<div className="space-y-2">
						<Label className="text-sm font-medium">Data final</Label>
						<input
							type="date"
							name="endDate"
							defaultValue={event?.endDate ?? ""}
							required
							className={fieldClassName}
						/>
					</div>
				) : null}
			</div>

			{meta.fields.includes("time") && !meta.allDay ? (
				<div className="space-y-2">
					<Label className="text-sm font-medium">Horário</Label>
					<input
						type="time"
						name="time"
						defaultValue={event?.time ?? ""}
						required
						className={fieldClassName}
					/>
				</div>
			) : null}

			{meta.fields.includes("location") ? (
				<div className="space-y-2">
					<Label className="text-sm font-medium">Local</Label>
					<input
						name="location"
						defaultValue={event?.location ?? ""}
						className={fieldClassName}
					/>
				</div>
			) : null}

			{meta.fields.includes("notes") ? (
				<div className="space-y-2">
					<Label className="text-sm font-medium">Observações (opcional)</Label>
					<textarea
						name="notes"
						defaultValue={notesDefault}
						rows={3}
						className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-slate-800 dark:bg-slate-950"
					/>
				</div>
			) : null}

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
					className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white"
				>
					{pending ? "Salvando..." : "Salvar"}
				</Button>
			</div>
		</form>
	);
}
