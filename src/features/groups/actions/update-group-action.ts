"use server";

import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import { requireGroupManager } from "@/features/groups/actions/group-auth";
import { parseUpdateGroupFormData } from "@/features/groups/actions/group-schema";
import { upsertGroupCore } from "@/features/groups/actions/upsert-group-core";

export async function updateGroupAction(
	_prevState: GroupActionState,
	formData: FormData,
): Promise<GroupActionState> {
	void _prevState;

	const parsed = parseUpdateGroupFormData(formData);

	if (!parsed.success) {
		return {
			success: false,
			message: "Dados inválidos.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const authz = await requireGroupManager(parsed.data.organizationSlug);
	if (!authz.ok) {
		return { success: false, message: authz.message };
	}

	return upsertGroupCore("update", {
		organizationId: authz.organization.id,
		organizationSlug: authz.organization.slug,
		groupId: parsed.data.groupId,
		name: parsed.data.name,
		slug: parsed.data.slug,
		superintendentId: parsed.data.superintendentId,
		assistantId: parsed.data.assistantId,
		memberIds: parsed.data.memberIds,
		includeFamiliesByHeadIds: parsed.data.includeFamiliesByHeadIds,
		conflictOverrides: parsed.data.conflictOverrides,
		moveFamilyIds: parsed.data.moveFamilyIds,
	});
}
