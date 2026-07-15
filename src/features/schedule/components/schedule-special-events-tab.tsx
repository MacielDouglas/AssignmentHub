"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	OccurrenceFormState,
	ScheduleItemFormState,
} from "../domain/schedule-settings.types";
import type { ScheduleType } from "../schemas/save-schedule-settings.schema";
import { ScheduleOccurrencesEditor } from "./schedule-occurrences-editor";

const SPECIAL_EVENT_OPTIONS: Array<{ type: ScheduleType; label: string }> = [
	{
		type: "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
		label: "Assembleia com representante",
	},
	{
		type: "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
		label: "Assembleia com viajante",
	},
	{ type: "CELEBRATION", label: "Celebração" },
	{ type: "CONVENTION", label: "Congresso" },
	{ type: "SPECIAL_TALK", label: "Discurso especial" },
	{
		type: "TRAVELING_OVERSEER_VISIT",
		label: "Visita do viajante",
	},
];

const EMPTY_SELECT_VALUE = "__EMPTY__";

type SpecialEventOption = (typeof SPECIAL_EVENT_OPTIONS)[number];

type OrderedSpecialEventItem = {
	option: SpecialEventOption;
	index: number;
	item: ScheduleItemFormState;
};

type Props = {
	items: ScheduleItemFormState[];
	onItemChange: (type: ScheduleType, value: ScheduleItemFormState) => void;
};

function buildOccurrence(
	type: ScheduleType,
	index: number,
): OccurrenceFormState {
	const isAllDay =
		type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
		type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER" ||
		type === "SPECIAL_TALK";

	return {
		clientKey: `special-${type}-${index}-${crypto.randomUUID()}`,
		type,
		startDate: "",
		endDate: "",
		time: "",
		isAllDay,
		leaderPersonId: "",
		location: "",
		notes: "",
		sortOrder: index,
	};
}

function isOrderedSpecialEventItem(value: {
	option: SpecialEventOption;
	index: number;
	item: ScheduleItemFormState | undefined;
}): value is OrderedSpecialEventItem {
	return Boolean(value.item);
}

function normalizeOccurrences(
	type: ScheduleType,
	occurrences: OccurrenceFormState[],
): OccurrenceFormState[] {
	return occurrences.map((occurrence, sortOrder) => ({
		...occurrence,
		type,
		isAllDay:
			type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
			type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER" ||
			type === "SPECIAL_TALK"
				? true
				: occurrence.isAllDay,
		sortOrder,
	}));
}

export function ScheduleSpecialEventsTab({ items, onItemChange }: Props) {
	const [selectedType, setSelectedType] = useState<ScheduleType | "">("");

	const orderedItems = useMemo(
		() =>
			SPECIAL_EVENT_OPTIONS.map((option, offset) => ({
				option,
				index: 5 + offset,
				item: items.find((entry) => entry.type === option.type),
			})).filter(isOrderedSpecialEventItem),
		[items],
	);

	function handleAddSpecialEvent() {
		if (!selectedType) {
			return;
		}

		const item = items.find((entry) => entry.type === selectedType);

		if (!item) {
			return;
		}

		const nextOccurrences =
			item.occurrences.length > 0
				? [
						...item.occurrences,
						buildOccurrence(item.type, item.occurrences.length),
					]
				: [buildOccurrence(item.type, 0)];

		onItemChange(item.type, {
			...item,
			isActive: true,
			occurrences: normalizeOccurrences(item.type, nextOccurrences),
		});

		setSelectedType("");
	}

	return (
		<div className="space-y-6">
			{orderedItems.map(({ option, index, item }) => (
				<section
					key={option.type}
					className="space-y-6 rounded-2xl border p-4 md:p-6"
				>
					<div className="space-y-1">
						<h3 className="text-base font-semibold">{item.title}</h3>
						<p className="text-sm text-muted-foreground">{item.description}</p>
					</div>

					<input
						type="hidden"
						name={`items.${index}.id`}
						value={item.id ?? ""}
					/>
					<input type="hidden" name={`items.${index}.type`} value={item.type} />
					<input type="hidden" name={`items.${index}.mode`} value={item.mode} />
					<input
						type="hidden"
						name={`items.${index}.title`}
						value={item.title}
					/>
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
							onItemChange(item.type, {
								...item,
								isActive: occurrences.length > 0,
								occurrences: normalizeOccurrences(item.type, occurrences),
							})
						}
					/>
				</section>
			))}

			<section className="space-y-4 rounded-2xl border border-dashed p-4 md:p-6">
				<div className="space-y-1">
					<h3 className="text-base font-semibold">Adicionar evento especial</h3>
					<p className="text-sm text-muted-foreground">
						Selecione o tipo de evento e adicione uma nova ocorrência.
					</p>
				</div>

				<div className="grid gap-3 md:grid-cols-[1fr_auto]">
					<div className="space-y-2">
						<Label htmlFor="special-event-type">Tipos disponíveis</Label>

						<Select
							value={selectedType || EMPTY_SELECT_VALUE}
							onValueChange={(value) =>
								setSelectedType(
									value === EMPTY_SELECT_VALUE ? "" : (value as ScheduleType),
								)
							}
						>
							<SelectTrigger id="special-event-type">
								<SelectValue placeholder="Selecione um evento" />
							</SelectTrigger>

							<SelectContent>
								<SelectItem value={EMPTY_SELECT_VALUE}>
									Selecione um evento
								</SelectItem>

								{SPECIAL_EVENT_OPTIONS.map((option) => (
									<SelectItem key={option.type} value={option.type}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-end">
						<Button
							type="button"
							variant="outline"
							onClick={handleAddSpecialEvent}
							disabled={!selectedType}
						>
							Adicionar ocorrência
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
