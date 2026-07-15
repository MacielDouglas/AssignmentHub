"use client";

import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";

type Props = {
	namePrefix: string;
	value: string[];
	disabled?: boolean;
	onChange: (value: string[]) => void;
};

function normalizeDate(date: Date) {
	const copy = new Date(date);
	copy.setHours(12, 0, 0, 0);
	return copy;
}

export function CleaningSettingsGeneralDates({
	namePrefix,
	value,
	disabled,
	onChange,
}: Props) {
	const selectedDates = useMemo(
		() =>
			value
				.map((item) => new Date(item))
				.filter((date) => !Number.isNaN(date.getTime()))
				.map(normalizeDate),
		[value],
	);

	const [month, setMonth] = useState<Date | undefined>(() => selectedDates[0]);

	function handleSelect(dates: Date[] | undefined) {
		const normalized = (dates ?? [])
			.map(normalizeDate)
			.sort((a, b) => a.getTime() - b.getTime());

		const unique = [
			...new Map(normalized.map((date) => [date.toISOString(), date])).values(),
		];

		onChange(unique.map((date) => date.toISOString()));
	}

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border p-3">
				<Calendar
					mode="multiple"
					selected={selectedDates}
					onSelect={handleSelect}
					month={month}
					onMonthChange={setMonth}
					disabled={disabled}
					className="w-full"
				/>
			</div>

			{selectedDates.length > 0 ? (
				<ul className="space-y-2 text-sm text-muted-foreground">
					{selectedDates.map((date) => (
						<li key={date.toISOString()}>
							{date.toLocaleDateString("pt-BR", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
							})}
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">
					Nenhuma data selecionada.
				</p>
			)}

			{value.map((date, index) => (
				<input
					key={date}
					type="hidden"
					name={`${namePrefix}.dates.${index}`}
					value={date}
				/>
			))}
		</div>
	);
}
