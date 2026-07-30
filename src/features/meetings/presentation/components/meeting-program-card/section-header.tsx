type Props = {
	label: string;
	color?: string;
};

export function SectionHeader({ label, color }: Props) {
	if (color) {
		return (
			<div className="flex items-center gap-3">
				<span
					className="h-px flex-1"
					style={{ backgroundColor: `${color}30` }}
				/>
				<span
					className="inline-flex items-center rounded-full border px-3 py-1 text-caption font-semibold uppercase tracking-wider"
					style={{
						borderColor: `${color}30`,
						backgroundColor: `${color}10`,
						color,
					}}
				>
					{label}
				</span>
				<span
					className="h-px flex-1"
					style={{ backgroundColor: `${color}30` }}
				/>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<span className="h-px flex-1 bg-border" />
			<span className="inline-flex items-center rounded-full border border-primary/10 bg-primary/8 px-3 py-1 text-caption font-semibold uppercase tracking-wider text-primary">
				{label}
			</span>
			<span className="h-px flex-1 bg-border" />
		</div>
	);
}
