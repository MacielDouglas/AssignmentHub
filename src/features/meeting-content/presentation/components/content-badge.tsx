type ContentBadgeTone =
	| "neutral"
	| "blue"
	| "violet"
	| "emerald"
	| "amber"
	| "red";

const tones: Record<ContentBadgeTone, string> = {
	neutral: "app-chip",
	blue: "app-chip",
	violet: "app-chip",
	emerald: "app-chip",
	amber: "app-chip",
	red: "inline-flex min-h-8 items-center rounded-full border border-destructive/20 bg-destructive/10 px-3 text-label text-destructive",
};

export function ContentBadge({
	label,
	tone = "neutral",
}: {
	label: string;
	tone?: ContentBadgeTone;
}) {
	return <span className={tones[tone]}>{label}</span>;
}
