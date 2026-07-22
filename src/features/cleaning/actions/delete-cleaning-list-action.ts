"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";

const schema = z.object({
	organizationSlug: z.string().min(1),
	listId: z.string().uuid(),
});

export type DeleteCleaningListResult = {
	success: boolean;
	message: string;
};

export async function deleteCleaningListAction(
	input: z.infer<typeof schema>,
): Promise<DeleteCleaningListResult> {
	const t = await getTranslations("CleaningListManage");
	const parsed = schema.safeParse(input);
	if (!parsed.success) {
		return { success: false, message: t("invalidRequest") };
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) {
		return { success: false, message: authz.message };
	}

	const list = await db.cleaningAssignmentList.findFirst({
		where: {
			id: parsed.data.listId,
			organizationId: authz.organization.id,
		},
		select: { id: true },
	});

	if (!list) {
		return { success: false, message: t("notFound") };
	}

	try {
		// Se o Prisma tiver onDelete: Cascade em dates/assignments, um delete basta.
		await db.cleaningAssignmentList.delete({
			where: { id: list.id },
		});

		revalidatePath(`/org/${authz.organization.slug}/cleaning`);
		revalidatePath(`/org/${authz.organization.slug}/cleaning`, "page");
		return { success: true, message: t("deleted") };
	} catch {
		return { success: false, message: t("deleteFailed") };
	}
}
