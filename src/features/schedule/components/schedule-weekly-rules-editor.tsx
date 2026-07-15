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
import type { WeeklyRuleFormState } from "../domain/schedule-settings.types";
import type { ScheduleWeekday } from "../schemas/save-schedule-settings.schema";

const WEEKDAY_OPTIONS: Array<{ value: ScheduleWeekday; label: string }> = [
	{ value: "MONDAY", label: "Segunda" },
	{ value: "TUESDAY", label: "Terça" },
	{ value: "WEDNESDAY", label: "Quarta" },
	{ value: "THURSDAY", label: "Quinta" },
	{ value: "FRIDAY", label: "Sexta" },
	{ value: "SATURDAY", label: "Sábado" },
	{ value: "SUNDAY", label: "Domingo" },
];

type Props = {
	namePrefix: string;
	value: WeeklyRuleFormState[];
	disabled?: boolean;
	onChange: (value: WeeklyRuleFormState[]) => void;
};

export function ScheduleWeeklyRulesEditor({
	namePrefix,
	value,
	disabled,
	onChange,
}: Props) {
	function updateRule(index: number, next: Partial<WeeklyRuleFormState>) {
		onChange(
			value.map((rule, currentIndex) =>
				currentIndex === index ? { ...rule, ...next } : rule,
			),
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{value.map((rule, index) => (
				<section
					key={rule.sortOrder}
					className="space-y-3 rounded-2xl border p-4"
				>
					<div className="space-y-1">
						<h4 className="text-sm font-semibold">
							Reunião {index === 0 ? "1" : "2"}
						</h4>
						<p className="text-xs text-muted-foreground">
							Defina dia da semana e horário.
						</p>
					</div>

					<div className="space-y-2">
						<Label>Dia da semana</Label>
						<Select
							value={rule.weekday}
							onValueChange={(weekday) =>
								updateRule(index, {
									weekday: weekday as ScheduleWeekday,
								})
							}
							disabled={disabled}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecione" />
							</SelectTrigger>
							<SelectContent>
								{WEEKDAY_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${namePrefix}.weeklyRules.${index}.time`}>
							Horário
						</Label>
						<Input
							id={`${namePrefix}.weeklyRules.${index}.time`}
							type="time"
							value={rule.time}
							onChange={(event) =>
								updateRule(index, {
									time: event.target.value,
								})
							}
							disabled={disabled}
						/>
					</div>

					<input
						type="hidden"
						name={`${namePrefix}.weeklyRules.${index}.id`}
						value={rule.id ?? ""}
					/>
					<input
						type="hidden"
						name={`${namePrefix}.weeklyRules.${index}.weekday`}
						value={rule.weekday}
					/>
					<input
						type="hidden"
						name={`${namePrefix}.weeklyRules.${index}.time`}
						value={rule.time}
					/>
					<input
						type="hidden"
						name={`${namePrefix}.weeklyRules.${index}.sortOrder`}
						value={String(index)}
					/>
				</section>
			))}
		</div>
	);
}
