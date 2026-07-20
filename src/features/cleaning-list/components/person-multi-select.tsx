// src/features/cleaning-list/components/person-multi-select.tsx
"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type Props = {
	options: Option[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	max?: number;
};

export function PersonMultiSelect({
	options,
	value,
	onChange,
	placeholder = "Selecione pessoas",
	max,
}: Props) {
	const [open, setOpen] = useState(false);

	const selectedOptions = useMemo(
		() => options.filter((option) => value.includes(option.value)),
		[options, value],
	);

	function toggle(nextValue: string) {
		if (value.includes(nextValue)) {
			onChange(value.filter((item) => item !== nextValue));
			return;
		}
		if (typeof max === "number" && value.length >= max) return;
		onChange([...value, nextValue]);
	}

	return (
		<div className="space-y-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="min-h-10 w-full justify-between rounded-xl"
					>
						<span className="truncate text-left">
							{selectedOptions.length > 0
								? `${selectedOptions.length} pessoa(s)`
								: placeholder}
						</span>
						<ChevronDown className="size-4 shrink-0 opacity-60" />
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="w-var(--radix-popover-trigger-width) p-0"
					align="start"
				>
					<Command>
						<CommandInput placeholder="Buscar pessoa..." />
						<CommandList>
							<CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
							<CommandGroup>
								{options.map((option) => {
									const isSelected = value.includes(option.value);
									return (
										<CommandItem
											key={option.value}
											value={option.label}
											onSelect={() => toggle(option.value)}
										>
											<Check
												className={cn(
													"mr-2 size-4",
													isSelected ? "opacity-100" : "opacity-0",
												)}
											/>
											{option.label}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{selectedOptions.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{selectedOptions.map((option) => (
						<Badge
							key={option.value}
							variant="secondary"
							className="gap-1 pr-1"
						>
							{option.label}
							<button
								type="button"
								className="inline-flex size-5 items-center justify-center rounded-full hover:bg-muted"
								aria-label={`Remover ${option.label}`}
								onClick={() =>
									onChange(value.filter((item) => item !== option.value))
								}
							>
								<X className="size-3" />
							</button>
						</Badge>
					))}
				</div>
			) : null}
		</div>
	);
}
