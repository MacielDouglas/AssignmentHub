"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Wand2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { generateCleaningListAction } from "../actions/generate-cleaning-list.action";
import { saveCleaningListAction } from "../actions/save-cleaning-list.action";
import type { CleaningGeneratedAssignmentRow } from "../domain/cleaning-list.types";
import { initialSaveCleaningListState } from "../domain/cleaning-list.types";
import { initialGenerateCleaningListState } from "../domain/generate-cleaning-list.types";
import {
	mapOrganizationPeopleToCandidates,
	serializeRows,
} from "../lib/cleaning-list.mappers";
import type { CleaningPageData } from "../queries/get-cleaning-page-data.query";
import { CleaningAssignmentTable } from "./cleaning-assignment-table";
import { CleaningRangeCalendar } from "./cleaning-range-calendar";

type Props = {
	data: CleaningPageData;
};

export function CleaningGenerateTab({ data }: Props) {
	const [range, setRange] = useState<DateRange | undefined>();
	const [cleaningType, setCleaningType] = useState<
		"MEETING" | "WEEKLY" | "GENERAL"
	>("MEETING");
	const [editedRows, setEditedRows] = useState<
		CleaningGeneratedAssignmentRow[]
	>([]);

	const [generateState, generateAction, generatePending] = useActionState(
		generateCleaningListAction,
		initialGenerateCleaningListState,
	);

	const [saveState, saveAction, savePending] = useActionState(
		saveCleaningListAction,
		initialSaveCleaningListState,
	);

	const bookedDates = useMemo(
		() => data.bookedDates.map((item) => new Date(item.date)),
		[data.bookedDates],
	);

	const people = useMemo(
		() => mapOrganizationPeopleToCandidates(data.organization.people),
		[data.organization.people],
	);

	const generatedResultRows = generateState.result?.rows ?? [];

	const effectiveRows =
		editedRows.length > 0 ? editedRows : generatedResultRows;

	function handleRowsChange(rows: CleaningGeneratedAssignmentRow[]) {
		setEditedRows(rows);
	}

	function handleTypeChange(value: string) {
		setCleaningType(value as "MEETING" | "WEEKLY" | "GENERAL");
		setEditedRows([]);
	}

	function handleRangeChange(value: DateRange | undefined) {
		setRange(value);
		setEditedRows([]);
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-6 xl:grid-cols-[340px_1fr]">
				<form action={generateAction} className="space-y-5">
					<input
						type="hidden"
						name="organizationId"
						value={data.organization.id}
					/>
					<input type="hidden" name="cleaningType" value={cleaningType} />
					<input
						type="hidden"
						name="periodFrom"
						value={range?.from?.toISOString() ?? ""}
					/>
					<input
						type="hidden"
						name="periodTo"
						value={range?.to?.toISOString() ?? ""}
					/>

					<div className="rounded-3xl border bg-card p-5 shadow-sm">
						<div className="mb-5 flex items-start gap-3">
							<div className="rounded-2xl bg-primary/10 p-2 text-primary">
								<Wand2 className="size-5" />
							</div>

							<div className="space-y-1">
								<h3 className="text-base font-semibold">
									Designação automática
								</h3>
								<p className="text-sm text-muted-foreground">
									Gere a tabela com base no tipo de limpeza, período e histórico
									de rotação.
								</p>
							</div>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Tipo de limpeza</Label>
								<Select value={cleaningType} onValueChange={handleTypeChange}>
									<SelectTrigger className="w-full rounded-2xl">
										<SelectValue placeholder="Selecione o tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="MEETING">Por reunião</SelectItem>
										<SelectItem value="WEEKLY">Semanal</SelectItem>
										<SelectItem value="GENERAL">Geral</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
								{range?.from && range?.to ? (
									<>
										Período selecionado:{" "}
										{format(range.from, "dd/MM/yyyy", { locale: ptBR })} até{" "}
										{format(range.to, "dd/MM/yyyy", { locale: ptBR })}
									</>
								) : (
									<>Selecione o período no calendário.</>
								)}
							</div>

							<button
								className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
								type="submit"
								disabled={generatePending || !range?.from || !range?.to}
							>
								{generatePending
									? "Gerando lista..."
									: "Criar lista automática"}
							</button>

							{generateState.message ? (
								<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
									{generateState.message}
								</div>
							) : null}
						</div>
					</div>
				</form>

				<div className="rounded-3xl border bg-card p-4 shadow-sm">
					<CleaningRangeCalendar
						value={range}
						bookedDates={bookedDates}
						onChange={handleRangeChange}
					/>
				</div>
			</div>

			{effectiveRows.length > 0 ? (
				<form action={saveAction} className="space-y-4">
					<input
						type="hidden"
						name="organizationId"
						value={data.organization.id}
					/>
					<input type="hidden" name="cleaningType" value={cleaningType} />
					<input
						type="hidden"
						name="periodFrom"
						value={range?.from?.toISOString() ?? ""}
					/>
					<input
						type="hidden"
						name="periodTo"
						value={range?.to?.toISOString() ?? ""}
					/>
					<input
						type="hidden"
						name="rowsJson"
						value={serializeRows(effectiveRows)}
					/>

					<div className="rounded-3xl border bg-card p-5 shadow-sm">
						<div className="mb-4 flex items-start gap-3">
							<div className="rounded-2xl bg-primary/10 p-2 text-primary">
								<Sparkles className="size-5" />
							</div>

							<div className="space-y-1">
								<h3 className="text-base font-semibold">Tabela gerada</h3>
								<p className="text-sm text-muted-foreground">
									Revise, ajuste manualmente se necessário e depois salve.
								</p>
							</div>
						</div>

						<CleaningAssignmentTable
							rows={effectiveRows}
							people={people}
							editable
							onChange={handleRowsChange}
						/>
					</div>

					{generateState.result?.warnings?.length ? (
						<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
							<ul className="list-disc space-y-1 pl-5">
								{generateState.result.warnings.map((warning) => (
									<li key={warning}>{warning}</li>
								))}
							</ul>
						</div>
					) : null}

					{saveState.message ? (
						<div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
							{saveState.message}
						</div>
					) : null}

					<div className="flex justify-end">
						<button
							className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
							type="submit"
							disabled={savePending}
						>
							{savePending ? "Salvando..." : "Salvar lista"}
						</button>
					</div>
				</form>
			) : null}
		</div>
	);
}
