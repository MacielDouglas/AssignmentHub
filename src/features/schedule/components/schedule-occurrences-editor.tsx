"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { OccurrenceFormState } from "../domain/schedule-settings.types";
import type { ScheduleType } from "../schemas/save-schedule-settings.schema";

type Props = {
	namePrefix: string;
	type: ScheduleType;
	value: OccurrenceFormState[];
	disabled?: boolean;
	onChange: (value: OccurrenceFormState[]) => void;
};

function createEmptyOccurrence(
	type: ScheduleType,
	index: number,
): OccurrenceFormState {
	return {
		clientKey: `occ-new-${type}-${index}-${crypto.randomUUID()}`,
		type,
		startDate: "",
		endDate: "",
		time: "",
		isAllDay: false,
		leaderPersonId: "",
		location: "",
		notes: "",
		sortOrder: index,
	};
}

export function ScheduleOccurrencesEditor({
	namePrefix,
	type,
	value,
	disabled,
	onChange,
}: Props) {
	const showEndDate =
		type === "CONVENTION" || type === "TRAVELING_OVERSEER_VISIT";

	const showTime =
		type === "CELEBRATION" ||
		type === "SPECIAL_MEETING" ||
		type === "WEEKLY_CLEANING" ||
		type === "GENERAL_CLEANING";

	const forceAllDay =
		type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
		type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER" ||
		type === "SPECIAL_TALK";

	function updateOccurrence(index: number, next: Partial<OccurrenceFormState>) {
		onChange(
			value.map((occurrence, currentIndex) =>
				currentIndex === index ? { ...occurrence, ...next } : occurrence,
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
				.map((occurrence, currentIndex) => ({
					...occurrence,
					sortOrder: currentIndex,
				})),
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h4 className="text-sm font-semibold">Ocorrências</h4>
					<p className="text-sm text-muted-foreground">
						Adicione, remova e altere as datas deste tipo.
					</p>
				</div>

				<Button
					type="button"
					variant="outline"
					onClick={addOccurrence}
					disabled={disabled}
				>
					Adicionar ocorrência
				</Button>
			</div>

			<div className="space-y-4">
				{value.map((occurrence, index) => (
					<section
						key={occurrence.id ?? occurrence.clientKey}
						className="space-y-4 rounded-2xl border p-4"
					>
						<div className="flex items-center justify-between gap-3">
							<h5 className="text-sm font-medium">Ocorrência {index + 1}</h5>

							<Button
								type="button"
								variant="ghost"
								onClick={() => removeOccurrence(index)}
								disabled={disabled}
							>
								Remover
							</Button>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>
									{occurrence.type === "CELEBRATION" ? "Data inicial" : "Data"}
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
										disabled={disabled}
									/>
								</div>

								<div className="flex items-center justify-between rounded-xl border p-3">
									<div className="space-y-1">
										<p className="text-sm font-medium">Dia inteiro</p>
										<p className="text-xs text-muted-foreground">
											Marque quando o evento não tiver horário exibido.
										</p>
									</div>

									<Switch
										checked={occurrence.isAllDay}
										onCheckedChange={(checked) =>
											updateOccurrence(index, {
												isAllDay: checked,
											})
										}
										disabled={disabled}
									/>
								</div>
							</div>
						) : null}

						{forceAllDay ? (
							<input
								type="hidden"
								name={`${namePrefix}.occurrences.${index}.isAllDay`}
								value="true"
							/>
						) : null}

						{type === "WEEKLY_CLEANING" || type === "GENERAL_CLEANING" ? (
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
									placeholder="Ex. Salão do Reino"
								/>
							</div>
						) : null}

						<div className="space-y-2">
							<Label>Observações</Label>
							<Textarea
								value={occurrence.notes}
								onChange={(event) =>
									updateOccurrence(index, {
										notes: event.target.value,
									})
								}
								disabled={disabled}
								placeholder="Informações adicionais."
								maxLength={1000}
							/>
						</div>

						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.id`}
							value={occurrence.id ?? ""}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.type`}
							value={occurrence.type}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.startDate`}
							value={occurrence.startDate}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.endDate`}
							value={occurrence.endDate}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.time`}
							value={showTime ? occurrence.time : ""}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.isAllDay`}
							value={String(forceAllDay ? true : occurrence.isAllDay)}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.leaderPersonId`}
							value=""
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.location`}
							value={
								type === "WEEKLY_CLEANING" || type === "GENERAL_CLEANING"
									? occurrence.location
									: ""
							}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.notes`}
							value={occurrence.notes}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.occurrences.${index}.sortOrder`}
							value={String(index)}
						/>
					</section>
				))}
			</div>
		</div>
	);
}
