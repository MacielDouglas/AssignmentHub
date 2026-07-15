"use client";

import { Switch } from "@/components/ui/switch";
import type { ScheduleItemFormState } from "../domain/schedule-settings.types";
import { ScheduleOccurrencesEditor } from "./schedule-occurrences-editor";

type Props = {
	weeklyCleaning: ScheduleItemFormState;
	generalCleaning: ScheduleItemFormState;
	onWeeklyCleaningChange: (value: ScheduleItemFormState) => void;
	onGeneralCleaningChange: (value: ScheduleItemFormState) => void;
};

function CleaningSection({
	index,
	item,
	onChange,
}: {
	index: number;
	item: ScheduleItemFormState;
	onChange: (value: ScheduleItemFormState) => void;
}) {
	return (
		<section className="space-y-6 rounded-2xl border p-4 md:p-6">
			<div className="space-y-1">
				<h3 className="text-base font-semibold">{item.title}</h3>
				<p className="text-sm text-muted-foreground">{item.description}</p>
			</div>

			<div className="flex items-center justify-between rounded-xl border p-3">
				<div className="space-y-1">
					<p className="text-sm font-medium">Ativa</p>
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

			<input type="hidden" name={`items.${index}.id`} value={item.id ?? ""} />
			<input type="hidden" name={`items.${index}.type`} value={item.type} />
			<input type="hidden" name={`items.${index}.mode`} value={item.mode} />
			<input type="hidden" name={`items.${index}.title`} value={item.title} />
			<input
				type="hidden"
				name={`items.${index}.description`}
				value={item.description}
			/>
			<input
				type="hidden"
				name={`items.${index}.isActive`}
				value={String(item.isActive)}
			/>

			<ScheduleOccurrencesEditor
				namePrefix={`items.${index}`}
				type={item.type}
				value={item.occurrences}
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
		</section>
	);
}

export function ScheduleCleaningTab({
	weeklyCleaning,
	generalCleaning,
	onWeeklyCleaningChange,
	onGeneralCleaningChange,
}: Props) {
	return (
		<div className="space-y-6">
			<CleaningSection
				index={3}
				item={weeklyCleaning}
				onChange={onWeeklyCleaningChange}
			/>
			<CleaningSection
				index={4}
				item={generalCleaning}
				onChange={onGeneralCleaningChange}
			/>
		</div>
	);
}
