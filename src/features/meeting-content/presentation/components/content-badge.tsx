type ContentBadgeTone =
	| "neutral"
	| "blue"
	| "violet"
	| "emerald"
	| "amber"
	| "red";

const tones: Record<ContentBadgeTone, string> = {
	neutral: "border-border bg-muted text-muted-foreground",
	blue: "border-border bg-muted text-muted-foreground",
	violet: "border-border bg-muted text-muted-foreground",
	emerald: "border-border bg-muted text-muted-foreground",
	amber: "border-border bg-muted text-muted-foreground",
	red: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function ContentBadge({
	label,
	tone = "neutral",
}: {
	label: string;
	tone?: ContentBadgeTone;
}) {
	return (
		<span
			className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}
		>
			{label}
		</span>
	);
}
