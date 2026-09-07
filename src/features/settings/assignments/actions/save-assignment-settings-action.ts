"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";

const schema = z.object({
	organizationSlug: z.string().trim().min(1),
	rotationMode: z.enum(["LEAST_LOAD", "ROUND_ROBIN"]),
});

export async function saveAssignmentSettingsAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = schema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		rotationMode: String(formData.get("rotationMode") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	await db.assignmentSettings.upsert({
		where: { organizationId: authz.organization.id },
		create: {
			organizationId: authz.organization.id,
			rotationMode: parsed.data.rotationMode,
		},
		update: { rotationMode: parsed.data.rotationMode },
	});
	revalidatePath(`/org/${authz.organization.slug}/settings`);
	return { success: true, message: "Designações salvas." };
}
