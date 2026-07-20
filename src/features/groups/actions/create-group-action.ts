"use server";

import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import { requireGroupManager } from "@/features/groups/actions/group-auth";
import { parseCreateGroupFormData } from "@/features/groups/actions/group-schema";
import { upsertGroupCore } from "@/features/groups/actions/upsert-group-core";

export async function createGroupAction(
	_prevState: GroupActionState,
	formData: FormData,
): Promise<GroupActionState> {
	void _prevState;

	const parsed = parseCreateGroupFormData(formData);

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

	return upsertGroupCore("create", {
		organizationId: authz.organization.id,
		organizationSlug: authz.organization.slug,
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
