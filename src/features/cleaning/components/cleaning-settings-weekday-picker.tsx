"use client";

import {
	type CleaningWeekday,
	WEEKDAYS,
} from "../schemas/save-cleaning-settings.schema";

const WEEKDAY_LABEL: Record<CleaningWeekday, string> = {
	MONDAY: "Seg",
	TUESDAY: "Ter",
	WEDNESDAY: "Qua",
	THURSDAY: "Qui",
	FRIDAY: "Sex",
	SATURDAY: "Sáb",
	SUNDAY: "Dom",
};

type Props = {
	namePrefix: string;
	value: CleaningWeekday[];
	timesPerWeek: number | null;
	disabled?: boolean;
	onChange: (value: CleaningWeekday[]) => void;
};

export function CleaningSettingsWeekdayPicker({
	namePrefix,
	value,
	timesPerWeek,
	disabled,
	onChange,
}: Props) {
	const normalizedTimesPerWeek =
		typeof timesPerWeek === "number" && Number.isFinite(timesPerWeek)
			? timesPerWeek
			: null;

	const reachedLimit =
		normalizedTimesPerWeek !== null && value.length >= normalizedTimesPerWeek;

	function toggleWeekday(weekday: CleaningWeekday) {
		if (disabled) return;

		if (value.includes(weekday)) {
			onChange(value.filter((item) => item !== weekday));
			return;
		}

		if (
			normalizedTimesPerWeek !== null &&
			value.length >= normalizedTimesPerWeek
		) {
			return;
		}

		onChange([...value, weekday]);
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				{WEEKDAYS.map((weekday) => {
					const active = value.includes(weekday);
					const isDisabled = Boolean(disabled || (!active && reachedLimit));

					return (
						<button
							key={weekday}
							type="button"
							onClick={() => toggleWeekday(weekday)}
							disabled={isDisabled}
							className={[
								"inline-flex h-10 min-w-12 items-center justify-center rounded-full border px-4 text-sm font-medium transition",
								active
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-background text-foreground",
								isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-muted",
							].join(" ")}
						>
							{WEEKDAY_LABEL[weekday]}
						</button>
					);
				})}
			</div>

			{value.map((weekday, index) => (
				<input
					key={weekday}
					type="hidden"
					name={`${namePrefix}.weekdays.${index}`}
					value={weekday}
				/>
			))}
		</div>
	);
}
