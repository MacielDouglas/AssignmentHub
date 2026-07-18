"use client";

import { AlertCircle } from "lucide-react";

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

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validateWeekday(value: string): string | null {
	if (!value) return "Selecione um dia da semana";
	if (!WEEKDAY_OPTIONS.some((o) => o.value === value)) return "Dia da semana inválido";
	return null;
}

function validateTime(value: string): string | null {
	if (!value) return "Informe o horário";
	if (!TIME_REGEX.test(value)) return "Horário inválido (formato HH:MM)";
	return null;
}

type Props = {
	value: WeeklyRuleFormState[];
	disabled?: boolean;
	onChange: (value: WeeklyRuleFormState[]) => void;
};

export function ScheduleWeeklyRulesEditor({
	value,
	disabled,
	onChange,
}: Props) {
	function updateRule(index: number, next: Partial<WeeklyRuleFormState>) {
		onChange(
			value.map((rule, currentIndex) =>
				currentIndex === index
					? {
							...rule,
							...next,
						}
					: rule,
			),
		);
	}

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			{value.map((rule, index) => (
				<section
					key={rule.id ?? `weekly-rule-${index}`}
					className="space-y-4 rounded-2xl border border-border/60 bg-card p-4"
				>
					<div className="space-y-1">
						<h4 className="text-sm font-semibold text-foreground">
							Reunião {index + 1}
						</h4>
						<p className="text-xs text-muted-foreground">
							Defina o dia da semana e o horário.
						</p>
					</div>

					<div className="space-y-2">
						<Label>Dia da semana</Label>
						<Select
							value={rule.weekday}
							onValueChange={(weekday) =>
								updateRule(index, { weekday: weekday as ScheduleWeekday })
							}
							disabled={disabled}
						>
							<SelectTrigger className="rounded-2xl">
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
						{validateWeekday(rule.weekday) && !disabled ? (
							<p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" role="alert">
								<AlertCircle className="size-3" />
								{validateWeekday(rule.weekday)}
							</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label htmlFor={`weekly-rule-time-${index}`}>Horário</Label>
						<Input
							id={`weekly-rule-time-${index}`}
							type="time"
							value={rule.time}
							onChange={(event) =>
								updateRule(index, { time: event.target.value })
							}
							disabled={disabled}
						/>
						{validateTime(rule.time) && !disabled ? (
							<p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" role="alert">
								<AlertCircle className="size-3" />
								{validateTime(rule.time)}
							</p>
						) : null}
					</div>
				</section>
			))}
		</div>
	);
}
