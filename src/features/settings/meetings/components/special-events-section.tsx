"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { HiOutlineSparkles, HiOutlineTrash } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { deleteSpecialEventOccurrenceAction } from "@/features/settings/meetings/actions/delete-special-event-occurrence-action";
import type { SpecialEventListItem } from "@/features/settings/meetings/components/settings-shell";
import { SpecialEventFormDialog } from "@/features/settings/meetings/components/special-event-form-dialog";

// import { SPECIAL_EVENT_META } from "@/features/settings/lib/special-event-meta";

const initialState: SettingsActionState = { success: false, message: "" };

type SpecialEventsSectionProps = {
	organizationSlug: string;
	canEdit: boolean;
	events: SpecialEventListItem[];
};

export function SpecialEventsSection({
	organizationSlug,
	canEdit,
	events,
}: SpecialEventsSectionProps) {
	return (
		<section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<HiOutlineSparkles className="h-5 w-5 text-violet-600" />
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							Eventos especiais
						</h2>
					</div>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						Opcional. Comemoração e Congresso: no máximo um por ano. Durante a
						visita do viajante, as reuniões semanais ficam ocultas na agenda.
					</p>
				</div>
				{canEdit ? (
					<SpecialEventFormDialog organizationSlug={organizationSlug} />
				) : null}
			</header>

			{events.length === 0 ? (
				<div className="rounded-[20px] border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
					Nenhum evento especial cadastrado.
				</div>
			) : (
				<ul className="grid gap-3">
					{events.map((event) => (
						<li
							key={event.id}
							className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between"
						>
							<div className="space-y-2">
								<div className="flex flex-wrap items-center gap-2">
									<p className="font-medium text-slate-900 dark:text-slate-50">
										{event.typeLabel}
									</p>
									<StatusBadge label={event.typeLabel} tone="violet" />
								</div>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									{event.startDate}
									{event.endDate ? ` → ${event.endDate}` : ""}
									{event.time
										? ` · ${event.time}`
										: event.isAllDay
											? " · dia inteiro"
											: ""}
									{event.location ? ` · ${event.location}` : ""}
								</p>
								{event.notes ? (
									<p className="text-xs text-slate-500">{event.notes}</p>
								) : null}
							</div>

							{canEdit ? (
								<div className="flex gap-2">
									<SpecialEventFormDialog
										organizationSlug={organizationSlug}
										event={event}
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
	if (state.success && !handled) {
		setHandled(true);
		router.refresh();
	}

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
