"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";

const InputSchema = z.object({
	slug: z.string().min(1),
	listId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	kind: z.enum(["MIDWEEK", "WEEKEND"]),
});

export async function deleteDutyDateAction(
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

		await db.meetingDutyDate.deleteMany({
			where: {
				listId: parsed.listId,
				date: new Date(`${parsed.date}T12:00:00.000Z`),
				meetingKind: parsed.kind,
			},
		});

		const remaining = await db.meetingDutyDate.count({
			where: { listId: parsed.listId },
		});

		if (remaining === 0) {
			await db.meetingDutyList.delete({ where: { id: parsed.listId } });
		}

		revalidatePath(`/org/${authz.organization.slug}/duties`);

		return { ok: true };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "Falha ao excluir a data.",
		};
	}
}
