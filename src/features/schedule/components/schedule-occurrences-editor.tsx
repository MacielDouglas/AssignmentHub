"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
	OccurrenceFormState,
	ScheduleLeaderOption,
} from "../domain/schedule-settings.types";
import type { ScheduleType } from "../schemas/save-schedule-settings.schema";

type Props = {
	type: ScheduleType;
	value: OccurrenceFormState[];
	disabled?: boolean;
	onChange: (value: OccurrenceFormState[]) => void;
	leaders?: ScheduleLeaderOption[];
};

function createEmptyOccurrence(
	type: ScheduleType,
	index: number,
): OccurrenceFormState {
	const forceAllDay =
		type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
		type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER";

	return {
		clientKey: `occ-new-${type}-${index}-${crypto.randomUUID()}`,
		type,
		startDate: "",
		endDate: "",
		time: "",
		isAllDay: forceAllDay,
		leaderPersonId: "",
		location: "",
		notes: "",
		sortOrder: index,
	};
}

function getOccurrenceBehavior(type: ScheduleType) {
	const showEndDate =
		type === "CONVENTION" || type === "TRAVELING_OVERSEER_VISIT";

	const showTime =
		type === "SPECIAL_MEETING" ||
		type === "CELEBRATION" ||
		type === "WEEKLY_CLEANING" ||
		type === "GENERAL_CLEANING";

	const forceAllDay =
		type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
		type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER";

	const canToggleAllDay = type === "SPECIAL_MEETING";

	const showLocation =
		type === "WEEKLY_CLEANING" || type === "GENERAL_CLEANING";

	const showLeader =
		type === "SPECIAL_MEETING" ||
		type === "CELEBRATION" ||
		type === "SPECIAL_TALK" ||
		type === "TRAVELING_OVERSEER_VISIT" ||
		type === "CONVENTION" ||
		type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER" ||
		type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE";

	return {
		showEndDate,
		showTime,
		forceAllDay,
		canToggleAllDay,
		showLocation,
		showLeader,
	};
}

function isValidDate(dateString: string): boolean {
	const date = new Date(dateString);
	return !Number.isNaN(date.getTime());
}

function getOccurrenceWarnings(
	type: ScheduleType,
	occurrence: OccurrenceFormState,
): string[] {
	const warnings: string[] = [];

	if (!occurrence.startDate) {
		warnings.push("Data inicial é obrigatória");
	}

	if (occurrence.startDate && !isValidDate(occurrence.startDate)) {
		warnings.push("Data inicial inválida");
	}

	if (occurrence.endDate && !isValidDate(occurrence.endDate)) {
		warnings.push("Data final inválida");
	}

	if (type === "SPECIAL_MEETING" && !occurrence.isAllDay && !occurrence.time) {
		warnings.push("Horário é obrigatório quando não é dia inteiro");
	}

	if (
		(type === "WEEKLY_CLEANING" || type === "GENERAL_CLEANING") &&
		!occurrence.time
	) {
		warnings.push("Horário é obrigatório");
	}

	if (
		(type === "WEEKLY_CLEANING" || type === "GENERAL_CLEANING") &&
		!occurrence.location
	) {
		warnings.push("Local é obrigatório");
	}

	if (
		(type === "WEEKLY_CLEANING" || type === "GENERAL_CLEANING") &&
		occurrence.isAllDay
	) {
		warnings.push("Limpeza não pode ser dia inteiro");
	}

	if (
		type === "TRAVELING_OVERSEER_VISIT" &&
		occurrence.startDate &&
		!occurrence.endDate
	) {
		warnings.push("Data final é obrigatória para visita do viajante");
	}

	if (type === "SPECIAL_TALK" && occurrence.endDate) {
		warnings.push("Discurso especial não deve ter data final");
	}

	if (
		(type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
			type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER") &&
		!occurrence.isAllDay
	) {
		warnings.push("Assembleias devem ser marcadas como dia inteiro");
	}

	if (type === "CONVENTION" && occurrence.startDate && !occurrence.endDate) {
		warnings.push("Congresso deve ter data final");
	}

	if (type === "CELEBRATION" && occurrence.startDate && !occurrence.time) {
		warnings.push("Celebração deve ter horário");
	}

	if (occurrence.notes.length > 1000) {
		warnings.push("Observações devem ter no máximo 1000 caracteres");
	}

	return warnings;
}

export function ScheduleOccurrencesEditor({
	type,
	value,
	disabled,
	onChange,
	leaders = [],
}: Props) {
	const {
		showEndDate,
		showTime,
		forceAllDay,
		canToggleAllDay,
		showLocation,
		showLeader,
	} = getOccurrenceBehavior(type);

	function updateOccurrence(index: number, next: Partial<OccurrenceFormState>) {
		onChange(
			value.map((occurrence, currentIndex) =>
				currentIndex === index
					? {
							...occurrence,
							...next,
						}
					: occurrence,
			),
		);
	}

	function addOccurrence() {
		onChange([...value, createEmptyOccurrence(type, value.length)]);
	}

	function removeOccurrence(index: number) {
		onChange(
			value
				.filter((_, currentIndex) => currentIndex !== index)
				.map((occurrence, sortOrder) => ({
					...occurrence,
					sortOrder,
				})),
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h4 className="text-sm font-semibold text-foreground">Ocorrências</h4>
					<p className="text-sm text-muted-foreground">
						Adicione e edite as datas deste item.
					</p>
				</div>

				<Button
					type="button"
					variant="outline"
					onClick={addOccurrence}
					disabled={disabled}
					className="rounded-2xl"
				>
					Adicionar ocorrência
				</Button>
			</div>

			{value.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
					Nenhuma ocorrência adicionada.
				</div>
			) : null}

			<div className="space-y-4">
				{value.map((occurrence, index) => {
					const warnings = getOccurrenceWarnings(type, occurrence);

					return (
						<section
							key={occurrence.id ?? occurrence.clientKey}
							className="space-y-4 rounded-2xl border border-border/60 bg-card p-4"
						>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<h5 className="text-sm font-medium text-foreground">
									Ocorrência {index + 1}
								</h5>

								<Button
									type="button"
									variant="ghost"
									onClick={() => removeOccurrence(index)}
									disabled={disabled}
									className="justify-start rounded-xl text-muted-foreground hover:text-destructive"
								>
									<Trash2 className="mr-2 size-4" />
									Remover
								</Button>
							</div>

							{warnings.length > 0 ? (
								<div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
									<ul className="list-disc space-y-1 pl-5">
										{warnings.map((warning) => (
											<li key={`${occurrence.clientKey}:${warning}`}>
												{warning}
											</li>
										))}
									</ul>
								</div>
							) : null}

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label>
										{type === "CELEBRATION" || showEndDate
											? "Data inicial"
											: "Data"}
									</Label>
									<Input
										type="date"
										value={occurrence.startDate}
										onChange={(event) =>
											updateOccurrence(index, {
												startDate: event.target.value,
											})
										}
										disabled={disabled}
									/>
								</div>

								{showEndDate ? (
									<div className="space-y-2">
										<Label>Data final</Label>
										<Input
											type="date"
											value={occurrence.endDate}
											onChange={(event) =>
												updateOccurrence(index, {
													endDate: event.target.value,
												})
											}
											disabled={disabled}
										/>
									</div>
								) : null}
							</div>

							{showTime ? (
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label>Horário</Label>
										<Input
											type="time"
											value={occurrence.time}
											onChange={(event) =>
												updateOccurrence(index, {
													time: event.target.value,
												})
											}
											disabled={disabled || occurrence.isAllDay}
										/>
									</div>

									{canToggleAllDay ? (
										<div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4">
											<div className="space-y-1">
												<p className="text-sm font-medium text-foreground">
													Dia inteiro
												</p>
												<p className="text-xs text-muted-foreground">
													Use quando não houver horário definido.
												</p>
											</div>

											<Switch
												checked={occurrence.isAllDay}
												onCheckedChange={(checked) =>
													updateOccurrence(index, {
														isAllDay: checked,
														time: checked ? "" : occurrence.time,
													})
												}
												disabled={disabled}
											/>
										</div>
									) : null}
								</div>
							) : null}

							{showLocation ? (
								<div className="space-y-2">
									<Label>Local</Label>
									<Input
										value={occurrence.location}
										onChange={(event) =>
											updateOccurrence(index, {
												location: event.target.value,
											})
										}
										disabled={disabled}
										placeholder="Ex.: Salão do Reino"
									/>
								</div>
							) : null}

							{showLeader && leaders.length > 0 ? (
								<div className="space-y-2">
									<Label>Responsável</Label>
									<Select
										value={occurrence.leaderPersonId || "__EMPTY__"}
										onValueChange={(value) =>
											updateOccurrence(index, {
												leaderPersonId: value === "__EMPTY__" ? "" : value,
											})
										}
										disabled={disabled}
									>
										<SelectTrigger className="rounded-2xl">
											<SelectValue placeholder="Selecione um responsável" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__EMPTY__">Nenhum</SelectItem>
											{leaders.map((leader) => (
												<SelectItem key={leader.id} value={leader.id}>
													{leader.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							) : null}

							<div className="space-y-2">
								<Label>Observações</Label>
								<Textarea
									value={occurrence.notes}
									onChange={(event) =>
										updateOccurrence(index, { notes: event.target.value })
									}
									disabled={disabled}
									placeholder="Informações adicionais."
									maxLength={1000}
								/>
							</div>

							{forceAllDay ? (
								<p className="text-xs text-muted-foreground">
									Este tipo de evento é sempre tratado como dia inteiro.
								</p>
							) : null}
						</section>
					);
				})}
			</div>
		</div>
	);
}
