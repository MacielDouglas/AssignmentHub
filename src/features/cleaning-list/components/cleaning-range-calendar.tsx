// src/features/cleaning-list/components/cleaning-range-calendar.tsx
"use client";

import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Props = {
	value: DateRange | undefined;
	bookedDates?: Date[];
	onChange: (value: DateRange | undefined) => void;
};

export function CleaningRangeCalendar({
	value,
	bookedDates = [],
	onChange,
}: Props) {
	return (
		<div className="space-y-4">
			<div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-4">
				<div className="rounded-2xl bg-background p-2 shadow-sm">
					<CalendarDays className="size-5 text-[#2563EB]" />
				</div>
				<div className="space-y-1">
					<h3 className="text-sm font-semibold">Selecione o período</h3>
					<p className="text-sm text-muted-foreground">
						Datas já usadas aparecem destacadas.
					</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-3xl border bg-background p-3 shadow-sm">
				<Calendar
					mode="range"
					selected={value}
					onSelect={onChange}
					numberOfMonths={1}
					locale={ptBR}
					modifiers={{ booked: bookedDates }}
					className="w-full"
					classNames={{
						months: "flex w-full flex-col gap-6",
						month: "w-full space-y-4",
						caption_label: "text-base font-semibold",
						day: cn(
							"inline-flex size-10 items-center justify-center rounded-2xl text-sm transition",
							"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						),
						selected:
							"bg-[#2563EB] text-white hover:bg-[#2563EB]/90 hover:text-white",
						range_start:
							"bg-[#2563EB] text-white hover:bg-[#2563EB]/90 hover:text-white",
						range_end:
							"bg-[#2563EB] text-white hover:bg-[#2563EB]/90 hover:text-white",
						range_middle: "rounded-none bg-[#2563EB]/12 text-foreground",
						today: "bg-foreground text-background",
					}}
					modifiersClassNames={{
						booked:
							"relative border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
					}}
				/>
			</div>

			<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
				<div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
					<span className="size-2 rounded-full bg-[#2563EB]" />
					Período selecionado
				</div>
				<div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
					<span className="size-2 rounded-full bg-amber-400" />
					Já usado
				</div>
			</div>
		</div>
	);
}
