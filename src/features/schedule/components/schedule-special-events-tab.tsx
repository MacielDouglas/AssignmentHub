"use client";

import { Plus, Save, CheckCircle } from "lucide-react";
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
	ScheduleLeaderOption,
} from "../domain/schedule-settings.types";
import type {
	ScheduleType,
	ScheduleVariant,
} from "../schemas/save-schedule-settings.schema";
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
	{ type: "TRAVELING_OVERSEER_VISIT", label: "Visita do viajante" },
];

const EMPTY_SELECT_VALUE = "__EMPTY__";

type SpecialEventOption = (typeof SPECIAL_EVENT_OPTIONS)[number];

type OrderedSpecialEventItem = {
	option: SpecialEventOption;
	item: ScheduleItemFormState;
};

type Props = {
	items: ScheduleItemFormState[];
	pending: boolean;
	onSubmitSection: () => void;
	onItemChange: (
		type: ScheduleType,
		variant: ScheduleVariant,
		value: ScheduleItemFormState,
	) => void;
	leaders: ScheduleLeaderOption[];
};

function buildOccurrence(
	type: ScheduleType,
	index: number,
): OccurrenceFormState {
	const isAllDay =
		type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
		type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER";

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
			type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER"
				? true
				: occurrence.isAllDay,
		sortOrder,
	}));
}

export function ScheduleSpecialEventsTab({
	items,
	pending,
	onSubmitSection,
	onItemChange,
	leaders,
}: Props) {
	const [selectedType, setSelectedType] = useState<ScheduleType | "">("");
	const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

	const orderedItems = useMemo(
		() =>
			SPECIAL_EVENT_OPTIONS.map((option) => ({
				option,
				item: items.find(
					(entry) => entry.type === option.type && entry.variant === "DEFAULT",
				),
			})).filter(isOrderedSpecialEventItem),
		[items],
	);

	function handleAddSpecialEvent() {
		if (!selectedType) return;

		const item = items.find(
			(entry) => entry.type === selectedType && entry.variant === "DEFAULT",
		);

		if (!item) return;

		const nextOccurrences =
			item.occurrences.length > 0
				? [
						...item.occurrences,
						buildOccurrence(item.type, item.occurrences.length),
					]
				: [buildOccurrence(item.type, 0)];

		onItemChange(item.type, item.variant, {
			...item,
			isActive: true,
			occurrences: normalizeOccurrences(item.type, nextOccurrences),
		});

		setSelectedType("");
		setToast({ message: "Ocorrência adicionada com sucesso", type: "success" });
		setTimeout(() => setToast(null), 3000);
	}

	return (
		<div className="space-y-4">
			{toast && (
				<div
					className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg transition-opacity ${
						toast.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
							: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
					}`}
					role="alert"
				>
					{toast.type === "success" ? (
						<CheckCircle className="size-4 shrink-0" />
					) : null}
					<span>{toast.message}</span>
				</div>
			)}

			{orderedItems.map(({ option, item }) => (
				<section
					key={option.type}
					className="space-y-5 rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-6"
				>
					<div className="space-y-1">
						<h3 className="text-lg font-semibold tracking-tight text-foreground">
							{item.title}
						</h3>
						<p className="text-sm leading-6 text-muted-foreground">
							{item.description}
						</p>
					</div>

					<ScheduleOccurrencesEditor
						type={item.type}
						value={item.occurrences}
						leaders={leaders}
						onChange={(occurrences) =>
							onItemChange(item.type, item.variant, {
								...item,
								isActive: occurrences.length > 0,
								occurrences: normalizeOccurrences(item.type, occurrences),
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
			))}

			<section className="space-y-4 rounded-3xl border border-dashed border-[#2563EB]/30 bg-[#2563EB]/3 p-4 sm:p-6">
				<div className="space-y-1">
					<h3 className="text-lg font-semibold tracking-tight text-foreground">
						Adicionar evento especial
					</h3>
					<p className="text-sm leading-6 text-muted-foreground">
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
							<SelectTrigger id="special-event-type" className="rounded-2xl">
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
							className="w-full rounded-2xl md:w-auto"
						>
							<Plus className="mr-2 size-4" />
							Adicionar ocorrência
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
