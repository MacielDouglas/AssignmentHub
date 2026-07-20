export type GroupRolePerson = {
	id: string;
	name: string;
	sex: "MALE" | "FEMALE";
	young: boolean;
	baptized: boolean;
	organizationId: string | null;
	groupId: string | null;
};

export function assertPersonBelongsToOrganization(
	person: GroupRolePerson | null | undefined,
	organizationId: string,
	label: string,
) {
	if (!person || person.organizationId !== organizationId) {
		throw new Error(`${label} não pertence à organização.`);
	}
}

export function assertEligibleGroupRolePerson(
	person: GroupRolePerson | null | undefined,
	label: string,
) {
	if (!person) {
		throw new Error(`${label} não encontrado.`);
	}
	if (person.sex !== "MALE") {
		throw new Error(`${label} deve ser do sexo masculino.`);
	}
	if (person.young) {
		throw new Error(`${label} deve ser adulto.`);
	}
	if (!person.baptized) {
		throw new Error(`${label} deve ser batizado.`);
	}
}

export function assertDistinctGroupRoles(
	superintendentId: string,
	assistantId: string,
) {
	if (superintendentId === assistantId) {
		throw new Error("Superintendente e ajudante devem ser pessoas diferentes.");
	}
}

export function ensureRolesIncludedInMembers(params: {
	superintendentId: string;
	assistantId: string;
	memberIds: string[];
}) {
	const set = new Set(params.memberIds);
	if (!set.has(params.superintendentId)) {
		throw new Error("O superintendente deve pertencer ao grupo.");
	}
	if (!set.has(params.assistantId)) {
		throw new Error("O ajudante deve pertencer ao grupo.");
	}
}

export function uniqueIds(values: string[]) {
	return [...new Set(values)];
}

export function isEligibleGroupRolePerson(person: {
	sex: "MALE" | "FEMALE";
	young: boolean;
	baptized: boolean;
}) {
	return person.sex === "MALE" && !person.young && person.baptized;
}
