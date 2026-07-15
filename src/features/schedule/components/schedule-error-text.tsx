type ScheduleErrorTextProps = {
	errors?: Record<string, string[]>;
	field: string;
};

export function ScheduleErrorText({ errors, field }: ScheduleErrorTextProps) {
	const messages = errors?.[field];

	if (!messages?.length) {
		return null;
	}

	return (
		<p role="alert" className="text-sm font-medium text-destructive">
			{messages[0]}
		</p>
	);
}
