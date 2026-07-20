export type SettingsActionState = {
	success: boolean;
	message: string;
	fieldErrors?: Record<string, string[] | undefined>;
};
