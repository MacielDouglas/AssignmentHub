"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { mapSavedListToRows } from "../lib/cleaning-list.mappers";
import type { CleaningPageData } from "../queries/get-cleaning-page-data.query";
import { CleaningAssignmentTable } from "./cleaning-assignment-table";

type Props = {
	data: CleaningPageData;
};

export function CleaningSavedListTab({ data }: Props) {
	const savedList = data.organization.cleaningLists[0];

	if (!savedList) {
		return (
			<div className="rounded-2xl border p-6 text-sm text-muted-foreground">
				Nenhuma lista salva foi encontrada.
			</div>
		);
	}

	const rows = mapSavedListToRows(savedList);

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border p-4 text-sm">
				<p>
					<strong>Tipo:</strong> {savedList.cleaningType}
				</p>
				<p>
					<strong>Período:</strong>{" "}
					{format(savedList.periodFrom, "dd/MM/yyyy", { locale: ptBR })} até{" "}
					{format(savedList.periodTo, "dd/MM/yyyy", { locale: ptBR })}
				</p>
			</div>

			<CleaningAssignmentTable rows={rows} people={[]} />
		</div>
	);
}
