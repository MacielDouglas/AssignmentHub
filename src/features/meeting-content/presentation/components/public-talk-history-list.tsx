"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deletePublicTalkHistoryAction } from "../actions/public-talk.actions";

type HistoryItem = {
	id: string;
	performedAt: Date;
	speakerNameSnapshot: string;
	notes: string | null;
	speakerPersonId: string | null;
	speakerSubPersonId: string | null;
	speakerPerson: { id: string; name: string } | null;
	speakerSubPerson: {
		id: string;
		name: string;
		subOrganization?: { name: string };
		subOrganizationName?: string;
	} | null;
};

type PublicTalkHistoryListProps = {
	history: HistoryItem[];
	slug?: string;
	organizationId?: string;
	canDelete?: boolean;
};

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "medium",
	}).format(new Date(date));
}

function resolveSpeaker(history: HistoryItem) {
	if (history.speakerPersonId && history.speakerPerson) {
		return history.speakerPerson.name;
	}

	if (history.speakerSubPersonId && history.speakerSubPerson) {
		const orgName =
			history.speakerSubPerson.subOrganization?.name ??
			history.speakerSubPerson.subOrganizationName;

		return orgName
			? `${history.speakerSubPerson.name} · ${orgName}`
			: history.speakerSubPerson.name;
	}

	return history.speakerNameSnapshot || "Orador não informado";
}

export function PublicTalkHistoryList({
	history,
	slug,
	organizationId,
	canDelete = false,
}: PublicTalkHistoryListProps) {
	const router = useRouter();
	const [historyPendingDeletion, setHistoryPendingDeletion] =
		useState<HistoryItem | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const canShowDelete = Boolean(canDelete && slug && organizationId);

	function requestDelete(item: HistoryItem) {
		setError(null);
		setHistoryPendingDeletion(item);
	}

	function cancelDelete() {
		if (pending) return;
		setHistoryPendingDeletion(null);
	}

	function confirmDelete() {
		if (!historyPendingDeletion || !slug || !organizationId) return;

		const formData = new FormData();
		formData.set("id", historyPendingDeletion.id);
		formData.set("organizationId", organizationId);
		formData.set("slug", slug);

		startTransition(async () => {
			setError(null);

			try {
				const result = await deletePublicTalkHistoryAction(formData);

				if (!result.success) {
					setError(result.error ?? "Não foi possível remover o histórico.");
					return;
				}

				setHistoryPendingDeletion(null);
				router.refresh();
			} catch {
				setError("Não foi possível remover o histórico. Tente novamente.");
			}
		});
	}

	if (history.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
				Ainda não há histórico para este discurso nesta organização.
			</div>
		);
	}

	return (
		<>
			<div className="space-y-3">
				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<ul className="space-y-3">
					{history.map((item) => (
						<li
							key={item.id}
							className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div className="min-w-0 space-y-1">
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
										{resolveSpeaker(item)}
									</p>

									<p className="text-xs text-slate-500 dark:text-slate-400">
										{formatDate(item.performedAt)}
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<span className="inline-flex min-h-8 items-center rounded-full bg-slate-200 px-3 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
										Histórico
									</span>

									{canShowDelete ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={pending}
											onClick={() => requestDelete(item)}
											className="min-h-9 rounded-xl border-red-200 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:hover:bg-red-950/30"
										>
											Remover
										</Button>
									) : null}
								</div>
							</div>

							{item.notes ? (
								<p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
									{item.notes}
								</p>
							) : null}
						</li>
					))}
				</ul>
			</div>

			<AlertDialog
				open={historyPendingDeletion !== null}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) cancelDelete();
				}}
			>
				<AlertDialogContent className="rounded-[28px]">
					<AlertDialogHeader>
						<AlertDialogTitle>Remover este histórico?</AlertDialogTitle>

						<AlertDialogDescription>
							O registro de{" "}
							{historyPendingDeletion
								? `${resolveSpeaker(historyPendingDeletion)} em ${formatDate(
										historyPendingDeletion.performedAt,
									)}`
								: "histórico"}{" "}
							será removido permanentemente. Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<AlertDialogCancel
							disabled={pending}
							onClick={cancelDelete}
							className="min-h-11 rounded-2xl"
						>
							Cancelar
						</AlertDialogCancel>

						<AlertDialogAction
							disabled={pending}
							onClick={(event) => {
								event.preventDefault();
								confirmDelete();
							}}
							className="min-h-11 rounded-2xl bg-red-600 text-white hover:bg-red-700"
						>
							{pending ? "Removendo..." : "Remover histórico"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
