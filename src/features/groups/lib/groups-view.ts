export type GroupSelectablePerson = {
	id: string;
	name: string;
	sex: "MALE" | "FEMALE";
	young: boolean;
	baptized: boolean;
	familyId: string | null;
	groupId: string | null;
	headedFamily: { id: string; name: string } | null;
	family: { id: string; name: string } | null;
};

export type GroupListItem = {
	id: string;
	name: string;
	slug: string;
	superintendentId: string;
	assistantId: string;
	superintendent: { id: string; name: string };
	assistant: { id: string; name: string };
	members: Array<{ id: string; name: string }>;
};
