export type GroupConflictPerson = {
	id: string;
	name: string;
	currentGroupId: string;
	currentGroupName: string;
	familyId: string | null;
	familyName: string | null;
	isFamilyHead: boolean;
	familyMemberIds: string[];
};

export type GroupDependency = {
	kind: "cleaning_config" | "cleaning_assignment";
	label: string;
	count: number;
};

export type GroupActionState = {
	success: boolean;
	message: string;
	fieldErrors?: Record<string, string[] | undefined>;
	conflictPeople?: GroupConflictPerson[];
	dependencies?: GroupDependency[];
};
