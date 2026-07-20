// src/features/cleaning-list/components/cleaning-saved-list-tab.tsx
"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteCleaningListAction } from "../actions/delete-cleaning-list.action";
import { initialDeleteCleaningListState } from "../domain/cleaning-list.types";
import { mapSavedListToRows } from "../lib/cleaning-list.mappers";
import type { CleaningPageData } from "../queries/get-cleaning-page-data.query";
import { CleaningAssignmentTable } from "./cleaning-assignment-table";

type Props = { data: CleaningPageData };

const TYPE_LABEL: Record<string, string> = {
	MEETING: "Por reunião",
	WEEKLY: "Semanal",
	GENERAL: "Geral",
};

export function CleaningSavedListTab({ data }: Props) {
	const lists = data.lists;
	const [selectedId, setSelectedId] = useState(lists[0]?.id ?? "");
	const [deleteState, deleteAction, deletePending] = useActionState(
		deleteCleaningListAction,
		initialDeleteCleaningListState,
	);

	const selectedList = useMemo(
		() =>
			data.organization.cleaningLists.find((list) => list.id === selectedId) ??
			data.organization.cleaningLists[0] ??
			null,
		[data.organization.cleaningLists, selectedId],
	);

	const summary = lists.find((item) => item.id === selectedList?.id);

	if (lists.length === 0) {
		return (
			<div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
				Nenhuma lista salva ainda. Gere uma designação na aba ao lado.
			</div>
		);
	}

	const rows = mapSavedListToRows(selectedList);

	return (
		<div className="space-y-5">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{lists.map((list) => {
					const active = list.id === selectedList?.id;
					return (
						<button
							key={list.id}
							type="button"
							onClick={() => setSelectedId(list.id)}
							className={`rounded-3xl border p-4 text-left transition ${
								active
									? "border-[#2563EB]/40 bg-[#2563EB]/5 shadow-sm"
									: "border-border/60 bg-card hover:border-border"
							}`}
						>
							<div className="flex items-start justify-between gap-2">
								<p className="font-semibold">
									{TYPE_LABEL[list.cleaningType] ?? list.cleaningType}
								</p>
								{list.canDelete ? (
									<Badge className="border-0 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
										Futura
									</Badge>
								) : (
									<Badge variant="outline">Histórico</Badge>
								)}
							</div>
							<p className="mt-2 text-sm text-muted-foreground">
								{format(list.periodFrom, "dd/MM/yyyy", { locale: ptBR })} →{" "}
								{format(list.periodTo, "dd/MM/yyyy", { locale: ptBR })}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{list.datesCount} data(s) ·{" "}
								{format(list.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
							</p>
						</button>
					);
				})}
			</div>

			{selectedList ? (
				<div className="space-y-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h3 className="text-base font-semibold">
								{TYPE_LABEL[selectedList.cleaningType]}
							</h3>
							<p className="text-sm text-muted-foreground">
								{format(selectedList.periodFrom, "dd/MM/yyyy", {
									locale: ptBR,
								})}{" "}
								→{" "}
								{format(selectedList.periodTo, "dd/MM/yyyy", { locale: ptBR })}
							</p>
						</div>

						{summary?.canDelete ? (
							<form action={deleteAction}>
								<input
									type="hidden"
									name="organizationId"
									value={data.organization.id}
								/>
								<input type="hidden" name="listId" value={selectedList.id} />
								<Button
									type="submit"
									variant="outline"
									disabled={deletePending || !data.canManage}
									className="h-11 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
								>
									<Trash2 className="mr-2 size-4" />
									{deletePending ? "Apagando..." : "Apagar lista"}
								</Button>
							</form>
						) : (
							<p className="text-xs text-muted-foreground">
								Histórico protegido (contém datas passadas).
							</p>
						)}
					</div>

					{deleteState.message ? (
						<div
							className={`rounded-2xl border px-4 py-3 text-sm ${
								deleteState.success
									? "border-emerald-200 bg-emerald-50 text-emerald-900"
									: "border-red-200 bg-red-50 text-red-900"
							}`}
						>
							{deleteState.message}
						</div>
					) : null}

					<CleaningAssignmentTable rows={rows} people={[]} editable={false} />
				</div>
			) : null}
		</div>
	);
}
