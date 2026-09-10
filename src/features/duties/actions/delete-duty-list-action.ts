"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";

const InputSchema = z.object({
	slug: z.string().min(1),
	listId: z.string().min(1),
});

export async function deleteDutyListAction(
	input: z.infer<typeof InputSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
	try {
		const parsed = InputSchema.parse(input);
		const authz = await requireSettingsManager(parsed.slug);

		if (!authz.ok) {
			return { ok: false, error: authz.message };
		}

		const owned = await db.meetingDutyList.findFirst({
			where: { id: parsed.listId, organizationId: authz.organization.id },
			select: { id: true },
		});

		if (!owned) {
			return { ok: false, error: "Programa não encontrado." };
		}

		await db.meetingDutyList.delete({ where: { id: parsed.listId } });

		revalidatePath(`/org/${authz.organization.slug}/duties`);

		return { ok: true };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "Falha ao excluir o programa.",
		};
	}
}
