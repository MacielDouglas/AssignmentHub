export type GroupActionState = {
	success: boolean;
	message: string;
	fieldErrors?: Record<string, string[] | undefined>;
	conflictPeople?: Array<{
		id: string;
		name: string;
		currentGroupId: string;
		currentGroupName: string;
	}>;
};
