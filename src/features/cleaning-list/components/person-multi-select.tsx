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

type Option = {
	value: string;
	label: string;
};

type Props = {
	options: Option[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
};

export function PersonMultiSelect({
	options,
	value,
	onChange,
	placeholder = "Selecione pessoas",
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

		onChange([...value, nextValue]);
	}

	function remove(nextValue: string) {
		onChange(value.filter((item) => item !== nextValue));
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
								? `${selectedOptions.length} pessoa(s) selecionada(s)`
								: placeholder}
						</span>

						<ChevronDown className="size-4 shrink-0 opacity-60" />
					</Button>
				</PopoverTrigger>

				<PopoverContent className="w-var(--radix-popover-trigger-width) p-0">
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
						<Badge key={option.value} variant="secondary" className="gap-1">
							{option.label}
							<span
								role="button"
								tabIndex={0}
								className="inline-flex cursor-pointer"
								aria-label={`Remover ${option.label}`}
								onClick={() => remove(option.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										remove(option.value);
									}
								}}
							>
								<X className="size-3" />
							</span>
						</Badge>
					))}
				</div>
			) : null}
		</div>
	);
}
