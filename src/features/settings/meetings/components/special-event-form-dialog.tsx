"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
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
import { upsertSpecialTalkAction } from "@/features/settings/meetings/actions/dedicated-event-actions";
import { upsertSpecialEventAction } from "@/features/settings/meetings/actions/upsert-special-event-action";
import type { SpecialEventListItem } from "@/features/settings/meetings/components/settings-shell";
import type { SpeakerOption } from "@/features/settings/meetings/components/special-talk-form-dialog";
import {
	SPECIAL_EVENT_META,
	SPECIAL_EVENT_TYPES,
	type SpecialEventType,
} from "@/features/settings/meetings/lib/special-event-meta";

const initialState: SettingsActionState = { success: false, message: "" };

const fieldClassName =
	"h-11 w-full rounded-4xl border border-border bg-card px-3 text-sm outline-none ring-primary/30 focus:ring-4";

const PREFIXES = ["Viajante: ", "Superintendente: "] as const;

function parseTravelerName(notes: string | null | undefined): string {
	if (!notes) return "";
	for (const p of PREFIXES) {
		if (notes.startsWith(p)) {
			return notes.slice(p.length).split("\n")[0]?.split(" | ")[0] ?? "";
		}
	}
	return "";
}

function parseTravelerNotes(notes: string | null | undefined): string {
	if (!notes) return "";
	for (const p of PREFIXES) {
		if (notes.startsWith(p)) {
			if (!notes.includes(" | ")) return "";
			return notes.split(" | ").slice(1).join(" | ");
		}
	}
	return notes;
}

type SpecialEventFormDialogProps = {
	organizationSlug: string;
	event?: SpecialEventListItem;
	/** Oradores (pessoas com discurso público) para o form de discurso especial. */
	people?: SpeakerOption[];
};

export function SpecialEventFormDialog({
	organizationSlug,
	event,
	people = [],
}: SpecialEventFormDialogProps) {
	const t = useTranslations("SettingsSpecialEvents");
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [formInstance, setFormInstance] = useState(0);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (next) setFormInstance((n) => n + 1);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				{event ? (
					<Button variant="outline" className="h-10 rounded-2xl">
						{t("edit")}
					</Button>
				) : (
					<Button className="h-11 rounded-4xl bg-primary text-primary-foreground">
						<HiOutlinePlus className="mr-2 h-4 w-4" />
						{t("newEvent")}
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className="max-h-[90vh] overflow-y-auto rounded-4xl sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{event ? t("editTitle") : t("newTitle")}</DialogTitle>
				</DialogHeader>

				{open ? (
					<SpecialEventFormFields
						key={formInstance}
						organizationSlug={organizationSlug}
						event={event}
						people={people}
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
	people?: SpeakerOption[];
	onCancel: () => void;
	onSuccess: () => void;
};

/** Client component síncrono — NÃO async */
function SpecialEventFormFields({
	organizationSlug,
	event,
	people = [],
	onCancel,
	onSuccess,
}: FormFieldsProps) {
	const t = useTranslations("SettingsSpecialEvents");
	const tTypes = useTranslations("SpecialEventTypes");

	const [type, setType] = useState<SpecialEventType>(
		event?.type ?? "CELEBRATION",
	);

	const [legacyState, legacyAction, legacyPending] = useActionState(
		upsertSpecialEventAction,
		initialState,
	);
	const [talkState, talkAction, talkPending] = useActionState(
		upsertSpecialTalkAction,
		initialState,
	);

	// Criação de discurso especial vai para a tabela dedicada (sem horário,
	// com tema + orador). Edição de linha legada segue o fluxo legado.
	const isNewTalk = !event && type === "SPECIAL_TALK";
	const activeState = isNewTalk ? talkState : legacyState;

	const [handledSuccess, setHandledSuccess] = useState(false);
	useEffect(() => {
		if (activeState.success && !handledSuccess) {
			setHandledSuccess(true);
			onSuccess();
		}
	}, [activeState.success, handledSuccess, onSuccess]);

	const meta = SPECIAL_EVENT_META[type];
	const travelerName = parseTravelerName(event?.notes ?? null);
	const notesDefault =
		event?.type === "TRAVELING_OVERSEER_VISIT"
			? parseTravelerNotes(event.notes)
			: (event?.notes ?? "");

	const titleLabel =
		type === "TRAVELING_OVERSEER_VISIT" ? t("travelerName") : t("titleField");

	if (isNewTalk) {
		return (
			<form action={talkAction} className="space-y-4">
				<input type="hidden" name="organizationSlug" value={organizationSlug} />

				<div className="space-y-2">
					<Label className="text-sm font-medium">{t("type")}</Label>
					<select
						name="type"
						value={type}
						onChange={(e) => setType(e.target.value as SpecialEventType)}
						className={fieldClassName}
					>
						{SPECIAL_EVENT_TYPES.map((eventType) => (
							<option key={eventType} value={eventType}>
								{tTypes(eventType)}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium">{t("startDate")} *</Label>
					<input type="date" name="date" required className={fieldClassName} />
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium">Tema (opcional)</Label>
					<input
						name="theme"
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
						className={fieldClassName}
						defaultValue=""
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
						maxLength={200}
						placeholder="Ex.: Orador visitante"
						className={fieldClassName}
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium">{t("notes")}</Label>
					<textarea
						name="notes"
						rows={3}
						className="w-full rounded-4xl border border-border bg-card px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-4"
					/>
				</div>

				{talkState.message && !talkState.success ? (
					<p className="text-sm text-red-600">{talkState.message}</p>
				) : null}

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						className="h-11 rounded-2xl"
						onClick={onCancel}
					>
						{t("cancel")}
					</Button>
					<Button
						type="submit"
						disabled={talkPending}
						className="h-11 rounded-4xl bg-primary text-primary-foreground"
					>
						{talkPending ? t("saving") : t("save")}
					</Button>
				</div>
			</form>
		);
	}

	return (
		<form action={legacyAction} className="space-y-4">
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			{event ? (
				<input type="hidden" name="occurrenceId" value={event.id} />
			) : null}

			<div className="space-y-2">
				<Label className="text-sm font-medium">{t("type")}</Label>
				<select
					name="type"
					value={type}
					disabled={Boolean(event)}
					onChange={(e) => setType(e.target.value as SpecialEventType)}
					className={fieldClassName}
				>
					{SPECIAL_EVENT_TYPES.map((eventType) => (
						<option key={eventType} value={eventType}>
							{tTypes(eventType)}
						</option>
					))}
				</select>
			</div>

			{meta.fields.includes("title") ? (
				<div className="space-y-2">
					<Label className="text-sm font-medium">{titleLabel}</Label>
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
					<Label className="text-sm font-medium">{t("startDate")}</Label>
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
						<Label className="text-sm font-medium">{t("endDate")}</Label>
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
					<Label className="text-sm font-medium">{t("time")}</Label>
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
					<Label className="text-sm font-medium">{t("location")}</Label>
					<input
						name="location"
						defaultValue={event?.location ?? ""}
						className={fieldClassName}
					/>
				</div>
			) : null}

			{meta.fields.includes("notes") ? (
				<div className="space-y-2">
					<Label className="text-sm font-medium">{t("notes")}</Label>
					<textarea
						name="notes"
						defaultValue={notesDefault}
						rows={3}
						className="w-full rounded-4xl border border-border bg-card px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-4"
					/>
				</div>
			) : null}

			{legacyState.message && !legacyState.success ? (
				<p className="text-sm text-red-600">{legacyState.message}</p>
			) : null}

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					className="h-11 rounded-2xl"
					onClick={onCancel}
				>
					{t("cancel")}
				</Button>
				<Button
					type="submit"
					disabled={legacyPending}
					className="h-11 rounded-4xl bg-primary text-primary-foreground"
				>
					{legacyPending ? t("saving") : t("save")}
				</Button>
			</div>
		</form>
	);
}
