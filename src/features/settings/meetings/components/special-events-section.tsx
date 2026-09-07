"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { HiOutlineSparkles, HiOutlineTrash } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { deleteSpecialEventOccurrenceAction } from "@/features/settings/meetings/actions/delete-special-event-occurrence-action";
import type { SpecialEventListItem } from "@/features/settings/meetings/components/settings-shell";
import { SpecialEventFormDialog } from "@/features/settings/meetings/components/special-event-form-dialog";
import {
	DeleteSpecialTalkButton,
	type SpeakerOption,
	SpecialTalkFormDialog,
} from "@/features/settings/meetings/components/special-talk-form-dialog";

// import { SPECIAL_EVENT_META } from "@/features/settings/lib/special-event-meta";

const initialState: SettingsActionState = { success: false, message: "" };

type SpecialEventsSectionProps = {
	organizationSlug: string;
	canEdit: boolean;
	events: SpecialEventListItem[];
	speakers: SpeakerOption[];
};

export function SpecialEventsSection({
	organizationSlug,
	canEdit,
	events,
	speakers,
}: SpecialEventsSectionProps) {
	const dedicatedTalks = events.filter((e) => e.source === "SPECIAL_TALK");
	const others = events.filter((e) => e.source !== "SPECIAL_TALK");
	return (
		<section className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<HiOutlineSparkles className="h-5 w-5 text-primary" />
						<h2 className="text-headline text-foreground">Eventos especiais</h2>
					</div>
					<p className="text-sm text-muted-foreground">
						Opcional. Comemoração e Congresso: no máximo um por ano. Durante a
						visita do Superintendente de Circuito, as reuniões semanais ficam
						ocultas na agenda.
					</p>
				</div>
				{canEdit ? (
					<SpecialEventFormDialog
						organizationSlug={organizationSlug}
						people={speakers}
					/>
				) : null}
			</header>

			{dedicatedTalks.length > 0 ? (
				<div className="space-y-3">
					<h3 className="text-title text-foreground">Discursos especiais</h3>
					<ul className="grid gap-3">
						{dedicatedTalks.map((event) => (
							<li
								key={event.id}
								className="flex flex-col gap-3 rounded-3xl border border-border bg-muted/80 p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium text-foreground">
											{event.theme ?? event.typeLabel}
										</p>
										<StatusBadge label="Discurso especial" tone="violet" />
									</div>
									<p className="text-sm text-muted-foreground">
										{event.startDate}
										{event.speakerName ? ` · ${event.speakerName}` : ""}
									</p>
									{event.notes ? (
										<p className="text-xs text-muted-foreground">
											{event.notes}
										</p>
									) : null}
								</div>
								{canEdit ? (
									<div className="flex gap-2">
										<SpecialTalkFormDialog
											organizationSlug={organizationSlug}
											event={event}
											people={speakers}
										/>
										<DeleteSpecialTalkButton
											organizationSlug={organizationSlug}
											eventId={event.id}
										/>
									</div>
								) : null}
							</li>
						))}
					</ul>
				</div>
			) : null}

			{others.length === 0 && dedicatedTalks.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
					Nenhum evento especial cadastrado.
				</div>
			) : (
				<ul className="grid gap-3">
					{others.map((event) => (
						<li
							key={`${event.source ?? "LEGACY"}:${event.id}`}
							className="flex flex-col gap-3 rounded-3xl border border-border bg-muted/80 p-4 sm:flex-row sm:items-center sm:justify-between"
						>
							<div className="space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<p className="font-medium text-foreground">
										{event.typeLabel}
									</p>
									<StatusBadge label={event.typeLabel} tone="violet" />
								</div>
								<p className="text-sm text-muted-foreground">
									{event.startDate}
									{event.endDate ? ` → ${event.endDate}` : ""}
									{event.time ? ` · ${event.time}` : ""}
									{event.location ? ` · ${event.location}` : ""}
								</p>
								{event.notes ? (
									<p className="text-xs text-muted-foreground">{event.notes}</p>
								) : null}
							</div>
							{canEdit && (event.source === "LEGACY" || !event.source) ? (
								<div className="flex gap-2">
									<SpecialEventFormDialog
										organizationSlug={organizationSlug}
										event={event}
										people={speakers}
									/>
									<DeleteOccurrenceButton
										organizationSlug={organizationSlug}
										occurrenceId={event.id}
									/>
								</div>
							) : null}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function DeleteOccurrenceButton({
	organizationSlug,
	occurrenceId,
}: {
	organizationSlug: string;
	occurrenceId: string;
}) {
	const router = useRouter();
	const [state, action, pending] = useActionState(
		deleteSpecialEventOccurrenceAction,
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
			<input type="hidden" name="occurrenceId" value={occurrenceId} />
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
