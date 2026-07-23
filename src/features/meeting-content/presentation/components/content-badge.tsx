export function ContentBadge({
	label,
	tone = "neutral",
}: {
	label: string;
	tone?: "neutral" | "blue" | "violet" | "emerald" | "amber";
}) {
	const tones = {
		neutral:
			"border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
		blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
		violet:
			"border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
		emerald:
			"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
		amber:
			"border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
	};

	return (
		<span
			className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}
		>
			{label}
		</span>
	);
}
