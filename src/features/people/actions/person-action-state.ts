export type PersonActionState = {
	success: boolean;
	message: string;
	fieldErrors?: Record<string, string[] | undefined>;
};
