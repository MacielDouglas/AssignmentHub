// src/features/cleaning-list/components/cleaning-assignment-table.tsx
"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type {
	CleaningCandidatePerson,
	CleaningGeneratedAssignmentRow,
} from "../domain/cleaning-list.types";
import { CleaningAssignmentEditorCell } from "./cleaning-assignment-editor-cell";

type Props = {
	rows: CleaningGeneratedAssignmentRow[];
	people: CleaningCandidatePerson[];
	editable?: boolean;
	onChange?: (rows: CleaningGeneratedAssignmentRow[]) => void;
};

export function CleaningAssignmentTable({
	rows,
	people,
	editable = false,
	onChange,
}: Props) {
	const sectorHeaders = rows[0]?.cells ?? [];

	if (rows.length === 0) {
		return (
			<div className="rounded-2xl border p-6 text-sm text-muted-foreground">
				Nenhum dado disponível para exibição.
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-3xl border border-border/60 bg-background shadow-sm">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-28 sticky left-0 z-10 bg-background">
							Data
						</TableHead>
						{sectorHeaders.map((cell) => (
							<TableHead key={cell.sectorId} className="min-w-40">
								{cell.sectorName}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => {
						const rowKey = row.date.toISOString();
						const usedPersonIds = row.cells.flatMap((cell) =>
							cell.assigned.map((person) => person.personId),
						);

						return (
							<TableRow key={rowKey}>
								<TableCell className="sticky left-0 z-10 bg-background font-medium">
									{format(row.date, "dd/MM", { locale: ptBR })}
								</TableCell>
								{row.cells.map((cell) => (
									<TableCell
										key={`${rowKey}-${cell.sectorId}`}
										className="align-top"
									>
										{editable && onChange ? (
											<CleaningAssignmentEditorCell
												cell={cell}
												allPeople={people}
												usedPersonIds={usedPersonIds.filter(
													(personId) =>
														!cell.assigned.some(
															(assigned) => assigned.personId === personId,
														),
												)}
												onChange={(nextCell) => {
													const nextRows = rows.map((currentRow) =>
														currentRow.date.toISOString() !== rowKey
															? currentRow
															: {
																	...currentRow,
																	cells: currentRow.cells.map((currentCell) =>
																		currentCell.sectorId === cell.sectorId
																			? nextCell
																			: currentCell,
																	),
																},
													);
													onChange(nextRows);
												}}
											/>
										) : (
											<div className="text-sm">
												{cell.assigned.length > 0
													? cell.assigned
															.map((person) => person.personName)
															.join(", ")
													: "—"}
											</div>
										)}
									</TableCell>
								))}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
