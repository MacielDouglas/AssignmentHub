// src/features/cleaning/components/cleaning-type-panel.tsx
"use client";

import { Plus } from "lucide-react";

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
import type { CleaningTypeConfigFormState } from "../domain/cleaning-settings.types";
import { createEmptySector } from "../lib/cleaning-settings-defaults";
import { WEEKDAYS } from "../schemas/save-cleaning-settings.schema";
import { CleaningSectorEditor } from "./cleaning-sector-editor";

const WEEKDAY_LABEL: Record<(typeof WEEKDAYS)[number], string> = {
	MONDAY: "Segunda",
	TUESDAY: "Terça",
	WEDNESDAY: "Quarta",
	THURSDAY: "Quinta",
	FRIDAY: "Sexta",
	SATURDAY: "Sábado",
	SUNDAY: "Domingo",
};

type ModeOption = { value: string; label: string };

type Props = {
	prefix: "meeting" | "weekly" | "general";
	title: string;
	description: string;
	config: CleaningTypeConfigFormState;
	readOnly: boolean;
	modes: ModeOption[];
	showWeekday: boolean;
	showDates: boolean;
	onChange: (value: CleaningTypeConfigFormState) => void;
};

export function CleaningTypePanel({
	prefix,
	title,
	description,
	config,
	readOnly,
	modes,
	showWeekday,
	showDates,
	onChange,
}: Props) {
	function patch(partial: Partial<CleaningTypeConfigFormState>) {
		onChange({ ...config, ...partial });
	}

	function addSector() {
		patch({
			sectors: [...config.sectors, createEmptySector(config.sectors.length)],
		});
	}

	function removeSector(clientKey: string) {
		const sector = config.sectors.find((s) => s.clientKey === clientKey);
		if (!sector) return;

		if (sector.locked) {
			patch({
				sectors: config.sectors.map((s) =>
					s.clientKey === clientKey ? { ...s, isActive: false } : s,
				),
			});
			return;
		}

		patch({
			sectors: config.sectors.filter((s) => s.clientKey !== clientKey),
		});
	}

	function addDate(value: string) {
		if (!value || config.dates.includes(value)) return;
		patch({ dates: [...config.dates, value].sort() });
	}

	return (
		<div className="space-y-5">
			<input type="hidden" name={`${prefix}.id`} value={config.id ?? ""} />
			<input
				type="hidden"
				name={`${prefix}.enabled`}
				value={config.enabled ? "true" : "false"}
			/>
			<input
				type="hidden"
				name={`${prefix}.assignmentMode`}
				value={config.assignmentMode}
			/>
			{showWeekday ? (
				<input
					type="hidden"
					name={`${prefix}.weekday`}
					value={config.weekday}
				/>
			) : null}
			{showDates
				? config.dates.map((date) => (
						<input
							key={date}
							type="hidden"
							name={`${prefix}.dates`}
							value={date}
						/>
					))
				: null}

			<div className="rounded-3xl border border-border/60 bg-background/70 p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<h3 className="text-base font-semibold tracking-tight">{title}</h3>
						<p className="text-sm leading-6 text-muted-foreground">
							{description}
						</p>
					</div>
					<div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
						<div className="space-y-0.5">
							<p className="text-sm font-medium">Ativo</p>
							<p className="text-xs text-muted-foreground">
								{config.enabled ? "Tipo habilitado" : "Tipo desligado"}
							</p>
						</div>
						<Switch
							checked={config.enabled}
							disabled={readOnly}
							onCheckedChange={(enabled) => patch({ enabled })}
							aria-label={`Ativar ${title}`}
						/>
					</div>
				</div>

				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label>Modo de designação</Label>
						<Select
							value={config.assignmentMode || undefined}
							disabled={readOnly || !config.enabled}
							onValueChange={(assignmentMode) =>
								patch({ assignmentMode: assignmentMode as never })
							}
						>
							<SelectTrigger className="h-11 rounded-2xl">
								<SelectValue placeholder="Selecione" />
							</SelectTrigger>
							<SelectContent>
								{modes.map((mode) => (
									<SelectItem key={mode.value} value={mode.value}>
										{mode.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{showWeekday ? (
						<div className="space-y-2">
							<Label>Dia da semana (opcional)</Label>
							<Select
								value={config.weekday || "__none__"}
								disabled={readOnly || !config.enabled}
								onValueChange={(value) =>
									patch({
										weekday: value === "__none__" ? "" : (value as never),
									})
								}
							>
								<SelectTrigger className="h-11 rounded-2xl">
									<SelectValue placeholder="Nenhum" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">Nenhum</SelectItem>
									{WEEKDAYS.map((day) => (
										<SelectItem key={day} value={day}>
											{WEEKDAY_LABEL[day]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					) : null}

					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={`${prefix}-notes`}>Observações</Label>
						<Textarea
							id={`${prefix}-notes`}
							name={`${prefix}.notes`}
							value={config.notes}
							disabled={readOnly || !config.enabled}
							onChange={(e) => patch({ notes: e.target.value })}
							className="min-h-24 rounded-2xl"
							maxLength={1000}
						/>
					</div>
				</div>

				{showDates ? (
					<div className="mt-5 space-y-3 rounded-2xl border border-border/60 bg-card p-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
							<div className="flex-1 space-y-2">
								<Label htmlFor={`${prefix}-date`}>Adicionar data</Label>
								<Input
									id={`${prefix}-date`}
									type="date"
									disabled={readOnly || !config.enabled}
									className="h-11 rounded-2xl"
									onChange={(e) => {
										addDate(e.target.value);
										e.currentTarget.value = "";
									}}
								/>
							</div>
						</div>
						{config.dates.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Nenhuma data cadastrada.
							</p>
						) : (
							<ul className="flex flex-wrap gap-2">
								{config.dates.map((date) => (
									<li
										key={date}
										className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm"
									>
										{date.split("-").reverse().join("/")}
										<button
											type="button"
											disabled={readOnly || !config.enabled}
											className="text-muted-foreground hover:text-foreground"
											onClick={() =>
												patch({
													dates: config.dates.filter((d) => d !== date),
												})
											}
										>
											remover
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				) : null}
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<h4 className="text-sm font-semibold tracking-tight">Setores</h4>
					<Button
						type="button"
						variant="outline"
						disabled={readOnly || !config.enabled}
						onClick={addSector}
						className="h-10 rounded-2xl"
					>
						<Plus className="mr-2 size-4" />
						Adicionar setor
					</Button>
				</div>

				<div className="space-y-3">
					{config.sectors.map((sector, index) => (
						<CleaningSectorEditor
							key={sector.clientKey}
							prefix={`${prefix}.sectors.${index}`}
							type={config.type}
							assignmentMode={config.assignmentMode}
							sector={sector}
							readOnly={readOnly || !config.enabled}
							onChange={(next) =>
								patch({
									sectors: config.sectors.map((s) =>
										s.clientKey === sector.clientKey ? next : s,
									),
								})
							}
							onRemove={() => removeSector(sector.clientKey)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
