"use client";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ScheduleItemFormState, ScheduleLeaderOption } from "../domain/schedule-settings.types";
import { ScheduleOccurrencesEditor } from "./schedule-occurrences-editor";

type Props = {
	weeklyCleaning: ScheduleItemFormState;
	generalCleaning: ScheduleItemFormState;
	pending: boolean;
	onSubmitSection: () => void;
	onWeeklyCleaningChange: (value: ScheduleItemFormState) => void;
	onGeneralCleaningChange: (value: ScheduleItemFormState) => void;
	leaders: ScheduleLeaderOption[];
};

function CleaningSection({
	item,
	pending,
	onSubmitSection,
	onChange,
	leaders,
}: {
	item: ScheduleItemFormState;
	pending: boolean;
	onSubmitSection: () => void;
	onChange: (value: ScheduleItemFormState) => void;
	leaders: ScheduleLeaderOption[];
}) {
	return (
		<section className="space-y-5 rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-6">
			<div className="space-y-1">
				<h3 className="text-lg font-semibold tracking-tight text-foreground">
					{item.title}
				</h3>
				<p className="text-sm leading-6 text-muted-foreground">
					{item.description}
				</p>
			</div>

			<div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4">
				<div className="space-y-1">
					<p className="text-sm font-medium text-foreground">Ativar seção</p>
					<p className="text-xs text-muted-foreground">
						Habilita esta configuração de limpeza.
					</p>
				</div>

				<Switch
					checked={item.isActive}
					onCheckedChange={(checked) =>
						onChange({
							...item,
							isActive: checked,
						})
					}
				/>
			</div>

			<ScheduleOccurrencesEditor
				type={item.type}
				value={item.occurrences}
				leaders={leaders}
				disabled={!item.isActive}
				onChange={(occurrences) =>
					onChange({
						...item,
						occurrences: occurrences.map((occurrence, sortOrder) => ({
							...occurrence,
							sortOrder,
						})),
					})
				}
			/>

			<div className="flex justify-end">
				<Button
					type="button"
					onClick={onSubmitSection}
					disabled={pending}
					className="rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8]"
				>
					<Save className="mr-2 size-4" />
					{pending ? "Salvando..." : "Salvar alterações"}
				</Button>
			</div>
		</section>
	);
}

export function ScheduleCleaningTab({
	weeklyCleaning,
	generalCleaning,
	pending,
	onSubmitSection,
	onWeeklyCleaningChange,
	onGeneralCleaningChange,
	leaders,
}: Props) {
	return (
		<div className="space-y-4">
			<CleaningSection
				item={weeklyCleaning}
				pending={pending}
				onSubmitSection={onSubmitSection}
				onChange={onWeeklyCleaningChange}
				leaders={leaders}
			/>
			<CleaningSection
				item={generalCleaning}
				pending={pending}
				onSubmitSection={onSubmitSection}
				onChange={onGeneralCleaningChange}
				leaders={leaders}
			/>
		</div>
	);
}
