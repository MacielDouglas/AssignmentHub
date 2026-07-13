"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import { parseUpdateGroupFormData } from "@/features/groups/actions/group-schema";
import {
	assertDistinctGroupRoles,
	assertEligibleGroupRolePerson,
	assertPersonBelongsToOrganization,
	ensureRolesIncludedInMembers,
	uniqueIds,
} from "@/features/groups/lib/group-invariants";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const initialState: GroupActionState = {
	success: false,
	message: "",
};

function isDefined<T>(value: T | undefined | null): value is T {
	return value != null;
}

export async function updateGroupAction(
	_prevState: GroupActionState = initialState,
	formData: FormData,
): Promise<GroupActionState> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			success: false,
			message: "Sessão inválida.",
		};
	}

	const parsed = parseUpdateGroupFormData(formData);

	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const input = parsed.data;

	const membership = await db.organizationMembership.findFirst({
		where: {
			userId: session.user.id,
			organizationId: input.organizationId,
		},
		select: {
			role: true,
		},
	});

	if (!membership) {
		return {
			success: false,
			message: "Você não pertence a esta organização.",
		};
	}

	const canManageGroups =
		membership.role === "OWNER" || membership.role === "ADMIN";

	if (!canManageGroups) {
		return {
			success: false,
			message: "Você não tem permissão para editar grupos.",
		};
	}

	const existingGroup = await db.group.findFirst({
		where: {
			id: input.groupId,
			organizationId: input.organizationId,
		},
		select: {
			id: true,
			members: {
				select: {
					id: true,
				},
			},
		},
	});

	if (!existingGroup) {
		return {
			success: false,
			message: "Grupo não encontrado.",
		};
	}

	const organizationPeople = await db.person.findMany({
		where: {
			organizationId: input.organizationId,
		},
		select: {
			id: true,
			name: true,
			sex: true,
			young: true,
			baptized: true,
			organizationId: true,
			familyId: true,
			groupId: true,
			headedFamily: {
				select: {
					id: true,
					name: true,
					members: {
						select: {
							id: true,
							name: true,
							groupId: true,
						},
					},
				},
			},
		},
	});

	const peopleMap = new Map(
		organizationPeople.map((person) => [person.id, person]),
	);

	const expandedMemberIds = new Set(input.memberIds);

	for (const headId of input.includeFamiliesByHeadIds) {
		const head = peopleMap.get(headId);

		if (!head?.headedFamily) continue;

		expandedMemberIds.add(head.id);

		for (const familyMember of head.headedFamily.members) {
			expandedMemberIds.add(familyMember.id);
		}
	}

	expandedMemberIds.add(input.superintendentId);
	expandedMemberIds.add(input.assistantId);

	const finalMemberIds = uniqueIds([...expandedMemberIds]);
	const finalMembers = finalMemberIds
		.map((id) => peopleMap.get(id))
		.filter(isDefined);

	try {
		assertDistinctGroupRoles(input.superintendentId, input.assistantId);
		ensureRolesIncludedInMembers({
			superintendentId: input.superintendentId,
			assistantId: input.assistantId,
			memberIds: finalMemberIds,
		});
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Falha ao validar membros do grupo.",
		};
	}

	const superintendent = peopleMap.get(input.superintendentId);
	const assistant = peopleMap.get(input.assistantId);

	try {
		assertPersonBelongsToOrganization(
			superintendent,
			input.organizationId,
			"Superintendente",
		);
		assertPersonBelongsToOrganization(
			assistant,
			input.organizationId,
			"Ajudante",
		);
		assertEligibleGroupRolePerson(superintendent, "Superintendente");
		assertEligibleGroupRolePerson(assistant, "Ajudante");
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: "Falha ao validar os responsáveis do grupo.",
		};
	}

	const nameConflict = await db.group.findFirst({
		where: {
			organizationId: input.organizationId,
			name: input.name,
			NOT: {
				id: input.groupId,
			},
		},
		select: {
			id: true,
		},
	});

	if (nameConflict) {
		return {
			success: false,
			message: "Já existe um grupo com esse nome.",
			fieldErrors: {
				name: ["Já existe um grupo com esse nome."],
			},
		};
	}

	const slugConflict = await db.group.findFirst({
		where: {
			organizationId: input.organizationId,
			slug: input.slug,
			NOT: {
				id: input.groupId,
			},
		},
		select: {
			id: true,
		},
	});

	if (slugConflict) {
		return {
			success: false,
			message: "Já existe um grupo com esse slug.",
			fieldErrors: {
				slug: ["Já existe um grupo com esse slug."],
			},
		};
	}

	const conflictPeople = finalMembers.filter((person) => {
		if (!person.groupId) return false;
		if (person.groupId === input.groupId) return false;
		return !input.conflictOverrides.includes(person.id);
	});

	if (conflictPeople.length > 0) {
		const relatedGroups = await db.group.findMany({
			where: {
				id: {
					in: uniqueIds(
						conflictPeople.map((person) => person.groupId).filter(isDefined),
					),
				},
			},
			select: {
				id: true,
				name: true,
			},
		});

		const groupsMap = new Map(
			relatedGroups.map((group) => [group.id, group.name]),
		);

		return {
			success: false,
			message:
				"Algumas pessoas já pertencem a outros grupos. Confirme individualmente os conflitos.",
			conflictPeople: conflictPeople.map((person) => ({
				id: person.id,
				name: person.name,
				currentGroupId: person.groupId as string,
				currentGroupName:
					groupsMap.get(person.groupId as string) ?? "Outro grupo",
			})),
		};
	}

	const previousMemberIds = existingGroup.members.map((member) => member.id);
	const memberIdsToRemove = previousMemberIds.filter(
		(id) => !finalMemberIds.includes(id),
	);

	try {
		await db.$transaction(async (tx) => {
			await tx.group.update({
				where: {
					id: input.groupId,
				},
				data: {
					name: input.name,
					slug: input.slug,
					superintendentId: input.superintendentId,
					assistantId: input.assistantId,
				},
			});

			if (memberIdsToRemove.length > 0) {
				await tx.person.updateMany({
					where: {
						organizationId: input.organizationId,
						id: {
							in: memberIdsToRemove,
						},
						groupId: input.groupId,
					},
					data: {
						groupId: null,
					},
				});
			}

			await tx.person.updateMany({
				where: {
					organizationId: input.organizationId,
					id: {
						in: finalMemberIds,
					},
				},
				data: {
					groupId: input.groupId,
				},
			});
		});

		revalidatePath(`/org/${input.organizationSlug}/groups`);

		return {
			success: true,
			message: "Grupo atualizado com sucesso.",
		};
	} catch {
		return {
			success: false,
			message: "Não foi possível atualizar o grupo.",
		};
	}
}
