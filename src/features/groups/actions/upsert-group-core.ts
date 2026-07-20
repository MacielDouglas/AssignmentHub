import { revalidatePath } from "next/cache";
import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import {
	assertDistinctGroupRoles,
	assertEligibleGroupRolePerson,
	assertPersonBelongsToOrganization,
	ensureRolesIncludedInMembers,
	uniqueIds,
} from "@/features/groups/lib/group-invariants";
import { db } from "@/lib/db";

type UpsertMode = "create" | "update";

type UpsertInput = {
	organizationId: string;
	organizationSlug: string;
	name: string;
	slug: string;
	superintendentId: string;
	assistantId: string;
	memberIds: string[];
	includeFamiliesByHeadIds: string[];
	conflictOverrides: string[];
	moveFamilyIds: string[];
	groupId?: string;
};

function isDefined<T>(value: T | null | undefined): value is T {
	return value != null;
}

export async function upsertGroupCore(
	mode: UpsertMode,
	input: UpsertInput,
): Promise<GroupActionState> {
	const targetGroupId = mode === "update" ? input.groupId : undefined;

	if (mode === "update" && !targetGroupId) {
		return { success: false, message: "Grupo não informado." };
	}

	let existingMemberIds: string[] = [];

	if (mode === "update" && targetGroupId) {
		const existingGroup = await db.group.findFirst({
			where: {
				id: targetGroupId,
				organizationId: input.organizationId,
			},
			select: {
				id: true,
				members: { select: { id: true } },
			},
		});

		if (!existingGroup) {
			return { success: false, message: "Grupo não encontrado." };
		}

		existingMemberIds = existingGroup.members.map((m) => m.id);
	}

	const organizationPeople = await db.person.findMany({
		where: { organizationId: input.organizationId },
		select: {
			id: true,
			name: true,
			sex: true,
			young: true,
			baptized: true,
			organizationId: true,
			familyId: true,
			groupId: true,
			family: { select: { id: true, name: true } },
			headedFamily: {
				select: {
					id: true,
					name: true,
					members: {
						select: { id: true, name: true, groupId: true },
					},
				},
			},
		},
	});

	const peopleMap = new Map(organizationPeople.map((p) => [p.id, p]));
	const expandedMemberIds = new Set(input.memberIds);

	for (const headId of input.includeFamiliesByHeadIds) {
		const head = peopleMap.get(headId);
		if (!head?.headedFamily) continue;
		expandedMemberIds.add(head.id);
		for (const member of head.headedFamily.members) {
			expandedMemberIds.add(member.id);
		}
	}

	// Famílias marcadas explicitamente no fluxo de conflito
	for (const familyId of input.moveFamilyIds) {
		for (const person of organizationPeople) {
			if (
				person.familyId === familyId ||
				person.headedFamily?.id === familyId
			) {
				expandedMemberIds.add(person.id);
			}
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

	if (finalMembers.some((p) => p.organizationId !== input.organizationId)) {
		return {
			success: false,
			message: "Há membros inválidos para esta organização.",
		};
	}

	const nameConflict = await db.group.findFirst({
		where: {
			organizationId: input.organizationId,
			name: input.name,
			...(targetGroupId ? { NOT: { id: targetGroupId } } : {}),
		},
		select: { id: true },
	});

	if (nameConflict) {
		return {
			success: false,
			message: "Já existe um grupo com esse nome.",
			fieldErrors: { name: ["Já existe um grupo com esse nome."] },
		};
	}

	const slugConflict = await db.group.findFirst({
		where: {
			organizationId: input.organizationId,
			slug: input.slug,
			...(targetGroupId ? { NOT: { id: targetGroupId } } : {}),
		},
		select: { id: true },
	});

	if (slugConflict) {
		return {
			success: false,
			message: "Já existe um grupo com esse slug.",
			fieldErrors: { slug: ["Já existe um grupo com esse slug."] },
		};
	}

	const overrideSet = new Set(input.conflictOverrides);

	const conflictPeople = finalMembers.filter((person) => {
		if (!person.groupId) return false;
		if (targetGroupId && person.groupId === targetGroupId) return false;
		return !overrideSet.has(person.id);
	});

	if (conflictPeople.length > 0) {
		const relatedGroups = await db.group.findMany({
			where: {
				id: {
					in: uniqueIds(conflictPeople.map((p) => p.groupId).filter(isDefined)),
				},
			},
			select: { id: true, name: true },
		});
		const groupsMap = new Map(relatedGroups.map((g) => [g.id, g.name]));

		return {
			success: false,
			message:
				"Algumas pessoas já pertencem a outros grupos. Confirme a transferência para continuar.",
			conflictPeople: conflictPeople.map((person) => {
				const familyId = person.headedFamily?.id ?? person.familyId ?? null;
				const familyName =
					person.headedFamily?.name ?? person.family?.name ?? null;
				const familyMemberIds = person.headedFamily
					? person.headedFamily.members.map((m) => m.id)
					: familyId
						? organizationPeople
								.filter(
									(p) =>
										p.familyId === familyId || p.headedFamily?.id === familyId,
								)
								.map((p) => p.id)
						: [];

				return {
					id: person.id,
					name: person.name,
					currentGroupId: person.groupId as string,
					currentGroupName:
						groupsMap.get(person.groupId as string) ?? "Outro grupo",
					familyId,
					familyName,
					isFamilyHead: Boolean(person.headedFamily),
					familyMemberIds,
				};
			}),
		};
	}

	try {
		await db.$transaction(async (tx) => {
			let groupId = targetGroupId;

			if (mode === "create") {
				const created = await tx.group.create({
					data: {
						organizationId: input.organizationId,
						name: input.name,
						slug: input.slug,
						superintendentId: input.superintendentId,
						assistantId: input.assistantId,
					},
					select: { id: true },
				});
				groupId = created.id;
			} else if (groupId) {
				await tx.group.update({
					where: { id: groupId },
					data: {
						name: input.name,
						slug: input.slug,
						superintendentId: input.superintendentId,
						assistantId: input.assistantId,
					},
				});

				const toRemove = existingMemberIds.filter(
					(id) => !finalMemberIds.includes(id),
				);

				if (toRemove.length > 0) {
					await tx.person.updateMany({
						where: {
							organizationId: input.organizationId,
							id: { in: toRemove },
							groupId,
						},
						data: { groupId: null },
					});
				}
			}

			if (!groupId) {
				throw new Error("Falha ao resolver o grupo.");
			}

			await tx.person.updateMany({
				where: {
					organizationId: input.organizationId,
					id: { in: finalMemberIds },
				},
				data: { groupId },
			});
		});

		revalidatePath(`/org/${input.organizationSlug}/groups`);
		revalidatePath(`/org/${input.organizationSlug}/people`);

		return {
			success: true,
			message:
				mode === "create"
					? "Grupo criado com sucesso."
					: "Grupo atualizado com sucesso.",
		};
	} catch {
		return {
			success: false,
			message:
				mode === "create"
					? "Não foi possível criar o grupo."
					: "Não foi possível atualizar o grupo.",
		};
	}
}
