"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
	CleaningSettingsStateErrors,
	TypeFormState,
} from "../domain/cleaning-settings.types";
import { CleaningSettingsErrorText } from "./cleaning-settings-error-text";
import { CleaningSettingsGeneralDates } from "./cleaning-settings-general-dates";
import { CleaningSettingsSectorList } from "./cleaning-settings-sector-list";
import { CleaningSettingsWeekdayPicker } from "./cleaning-settings-weekday-picker";

const ASSIGNMENT_MODE_EMPTY = "__NONE__";

type Props = {
	type: "MEETING" | "WEEKLY" | "GENERAL";
	title: string;
	description: string;
	value: TypeFormState;
	errors?: CleaningSettingsStateErrors;
	onChange: (value: TypeFormState) => void;
	onReset: () => void;
};

export function CleaningSettingsTypePanel({
	type,
	title,
	description,
	value,
	errors,
	onChange,
	onReset,
}: Props) {
	const namePrefix = `configs.${type}`;
	const isWeeklyMode = type === "MEETING" || type === "WEEKLY";
	const isGeneralMode = type === "GENERAL";
	const formKey =
		type === "MEETING" ? "meeting" : type === "WEEKLY" ? "weekly" : "general";

	const parsedTimesPerWeek = value.timesPerWeek.trim()
		? Number(value.timesPerWeek)
		: null;

	return (
		<section className="space-y-6 rounded-2xl border p-4 md:p-6">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<h3 className="text-base font-semibold">{title}</h3>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>

				<button
					type="button"
					onClick={onReset}
					className="text-sm font-medium text-primary"
				>
					Resetar padrão
				</button>
			</div>

			<input type="hidden" name={`${namePrefix}.id`} value={value.id ?? ""} />
			<input
				type="hidden"
				name={`${namePrefix}.enabled`}
				value={String(value.enabled)}
			/>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor={`${namePrefix}-assignment-mode`}>
						Modo de designação
					</Label>

					<Select
						value={value.assignmentMode ?? ASSIGNMENT_MODE_EMPTY}
						onValueChange={(next) =>
							onChange({
								...value,
								assignmentMode:
									next === ASSIGNMENT_MODE_EMPTY
										? null
										: (next as TypeFormState["assignmentMode"]),
							})
						}
					>
						<SelectTrigger id={`${namePrefix}-assignment-mode`}>
							<SelectValue placeholder="Selecione" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ASSIGNMENT_MODE_EMPTY}>Selecione</SelectItem>
							<SelectItem value="GROUP">Grupo</SelectItem>
							<SelectItem value="FAMILY">Família</SelectItem>
							<SelectItem value="PERSON">Pessoa</SelectItem>
						</SelectContent>
					</Select>

					<input
						type="hidden"
						name={`${namePrefix}.assignmentMode`}
						value={value.assignmentMode ?? ""}
					/>

					<CleaningSettingsErrorText
						errors={errors}
						field={`${formKey}.assignmentMode`}
					/>
				</div>

				{isWeeklyMode ? (
					<div className="space-y-2">
						<Label htmlFor={`${namePrefix}-timesPerWeek`}>
							Vezes por semana
						</Label>
						<Input
							id={`${namePrefix}-timesPerWeek`}
							type="number"
							min={1}
							max={7}
							value={value.timesPerWeek}
							onChange={(event) =>
								onChange({
									...value,
									timesPerWeek: event.target.value,
								})
							}
						/>
						<input
							type="hidden"
							name={`${namePrefix}.timesPerWeek`}
							value={value.timesPerWeek}
						/>
						<CleaningSettingsErrorText
							errors={errors}
							field={`${formKey}.timesPerWeek`}
						/>
					</div>
				) : (
					<input type="hidden" name={`${namePrefix}.timesPerWeek`} value="" />
				)}
			</div>

			{isWeeklyMode ? (
				<div className="space-y-2">
					<Label>Dias da semana</Label>
					<CleaningSettingsWeekdayPicker
						namePrefix={namePrefix}
						value={value.weekdays}
						timesPerWeek={
							parsedTimesPerWeek !== null && Number.isFinite(parsedTimesPerWeek)
								? parsedTimesPerWeek
								: null
						}
						onChange={(weekdays) =>
							onChange({
								...value,
								weekdays,
							})
						}
					/>
					<CleaningSettingsErrorText
						errors={errors}
						field={`${formKey}.weekdays`}
					/>
				</div>
			) : null}

			{isGeneralMode ? (
				<div className="space-y-2">
					<Label>Datas da limpeza geral</Label>
					<CleaningSettingsGeneralDates
						namePrefix={namePrefix}
						value={value.dates}
						onChange={(dates) =>
							onChange({
								...value,
								dates,
							})
						}
					/>
					<CleaningSettingsErrorText
						errors={errors}
						field={`${formKey}.dates`}
					/>
				</div>
			) : null}

			<div className="space-y-2">
				<Label htmlFor={`${namePrefix}-notes`}>Observações</Label>
				<Textarea
					id={`${namePrefix}-notes`}
					value={value.notes}
					onChange={(event) =>
						onChange({
							...value,
							notes: event.target.value,
						})
					}
					maxLength={500}
					placeholder="Observações opcionais."
				/>
				<input type="hidden" name={`${namePrefix}.notes`} value={value.notes} />
			</div>

			<CleaningSettingsSectorList
				namePrefix={namePrefix}
				value={value.sectors}
				showAllowYoung={type === "MEETING"}
				onChange={(sectors) =>
					onChange({
						...value,
						sectors: sectors.map((sector, index) => ({
							...sector,
							sortOrder: index,
						})),
					})
				}
			/>
		</section>
	);
}
