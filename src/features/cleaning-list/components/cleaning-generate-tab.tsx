// src/features/cleaning-list/components/cleaning-generate-tab.tsx
"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Shield, Sparkles, Wand2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
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
import {
	type CleaningGeneratedAssignmentRow,
	initialSaveCleaningListState,
} from "../domain/cleaning-list.types";
import { initialGenerateCleaningListState } from "../domain/generate-cleaning-list.types";
import {
	mapOrganizationPeopleToCandidates,
	serializeRows,
} from "../lib/cleaning-list.mappers";
import type { CleaningPageData } from "../queries/get-cleaning-page-data.query";
import { CleaningAssignmentTable } from "./cleaning-assignment-table";
import { CleaningRangeCalendar } from "./cleaning-range-calendar";

type Props = { data: CleaningPageData };

const TYPE_LABEL = {
	MEETING: "Por reunião",
	WEEKLY: "Semanal",
	GENERAL: "Geral",
} as const;

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

	const enabledTypes = useMemo(() => {
		const configs = data.organization.cleaningSettings?.configs ?? [];
		return {
			MEETING: configs.some((c) => c.type === "MEETING" && c.enabled),
			WEEKLY: configs.some((c) => c.type === "WEEKLY" && c.enabled),
			GENERAL: configs.some((c) => c.type === "GENERAL" && c.enabled),
		};
	}, [data.organization.cleaningSettings?.configs]);

	const generatedRows = generateState.result?.rows ?? [];
	const effectiveRows = editedRows.length > 0 ? editedRows : generatedRows;
	const canManage = data.canManage;

	return (
		<div className="space-y-6">
			{!canManage ? (
				<div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
					<Shield className="mt-0.5 size-4 shrink-0" />
					<p>Modo leitura. Apenas proprietário e administrador geram/salvam.</p>
				</div>
			) : null}

			<div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_1fr]">
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

					<div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
						<div className="mb-5 flex items-start gap-3">
							<div className="rounded-2xl bg-[#2563EB]/10 p-2 text-[#2563EB]">
								<Wand2 className="size-5" />
							</div>
							<div className="space-y-1">
								<h3 className="text-base font-semibold">
									Designação automática
								</h3>
								<p className="text-sm text-muted-foreground">
									Baseada no tipo, período e histórico de rotação.
								</p>
							</div>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Tipo de limpeza</Label>
								<Select
									value={cleaningType}
									disabled={!canManage}
									onValueChange={(value) => {
										setCleaningType(value as typeof cleaningType);
										setEditedRows([]);
									}}
								>
									<SelectTrigger className="h-11 w-full rounded-2xl">
										<SelectValue placeholder="Selecione o tipo" />
									</SelectTrigger>
									<SelectContent>
										{(
											Object.keys(TYPE_LABEL) as Array<keyof typeof TYPE_LABEL>
										).map((type) => (
											<SelectItem
												key={type}
												value={type}
												disabled={!enabledTypes[type]}
											>
												{TYPE_LABEL[type]}
												{!enabledTypes[type] ? " (inativo)" : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
								{range?.from && range?.to
									? `Período: ${format(range.from, "dd/MM/yyyy", { locale: ptBR })} → ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`
									: "Selecione o período no calendário."}
							</div>

							<Button
								type="submit"
								disabled={
									!canManage ||
									generatePending ||
									!range?.from ||
									!range?.to ||
									!enabledTypes[cleaningType]
								}
								className="h-11 w-full rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8]"
							>
								{generatePending ? "Gerando..." : "Criar lista automática"}
							</Button>

							{generateState.message ? (
								<div
									className={`rounded-2xl border px-4 py-3 text-sm ${
										generateState.success
											? "border-emerald-200 bg-emerald-50 text-emerald-900"
											: "border-amber-200 bg-amber-50 text-amber-900"
									}`}
								>
									{generateState.message}
								</div>
							) : null}
						</div>
					</div>
				</form>

				<div className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
					<CleaningRangeCalendar
						value={range}
						bookedDates={bookedDates}
						onChange={(value) => {
							setRange(value);
							setEditedRows([]);
						}}
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

					<div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
						<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div className="flex items-start gap-3">
								<div className="rounded-2xl bg-[#7C3AED]/10 p-2 text-[#7C3AED]">
									<Sparkles className="size-5" />
								</div>
								<div className="space-y-1">
									<h3 className="text-base font-semibold">Tabela gerada</h3>
									<p className="text-sm text-muted-foreground">
										Revise, ajuste manualmente se necessário e salve.
									</p>
								</div>
							</div>

							<Button
								type="submit"
								disabled={!canManage || savePending}
								className="h-11 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8]"
							>
								{savePending ? "Salvando..." : "Salvar lista"}
							</Button>
						</div>

						<CleaningAssignmentTable
							rows={effectiveRows}
							people={people}
							editable={canManage}
							onChange={setEditedRows}
						/>

						{generateState.result?.warnings?.length ? (
							<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
								<ul className="list-disc space-y-1 pl-5">
									{generateState.result.warnings.map((warning) => (
										<li key={warning}>{warning}</li>
									))}
								</ul>
							</div>
						) : null}

						{saveState.message ? (
							<div
								className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
									saveState.success
										? "border-emerald-200 bg-emerald-50 text-emerald-900"
										: "border-red-200 bg-red-50 text-red-900"
								}`}
							>
								{saveState.message}
							</div>
						) : null}
					</div>
				</form>
			) : null}
		</div>
	);
}
