// type CleaningSettingsErrorTextProps = {
// 	errors?: Record<string, string[]>;
// 	field: string;
// };

// export function CleaningSettingsErrorText({
// 	errors,
// 	field,
// }: CleaningSettingsErrorTextProps) {
// 	const messages = errors?.[field];

// 	if (!messages?.length) {
// 		return null;
// 	}

// 	return (
// 		<p role="alert" className="text-sm font-medium text-destructive">
// 			{messages[0]}
// 		</p>
// 	);
// }
