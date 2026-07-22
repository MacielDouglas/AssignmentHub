"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { parseDateInput } from "@/features/settings/lib/year-bounds";
import type { CleaningType } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const slotSchema = z.object({
	sectorId: z.string().uuid(),
	personId: z.string().uuid(),
	familyId: z.string().uuid().nullable().optional(),
	groupId: z.string().uuid().nullable().optional(),
	position: z.number().int().min(0),
	isManual: z.boolean(),
});

const daySchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	slots: z.array(slotSchema),
	hiddenSectorIds: z.array(z.string().uuid()).default([]),
});

const bodySchema = z.object({
	organizationSlug: z.string().min(1),
	cleaningType: z.enum(["MEETING", "WEEKLY", "GENERAL"]),
	periodFrom: z.string(),
	periodTo: z.string(),
	days: z.array(daySchema).min(1),
});

export async function saveCleaningListAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	void _prev;
	const t = await getTranslations("CleaningSave");

	let json: unknown;
	try {
		json = JSON.parse(String(formData.get("payload") ?? "{}"));
	} catch {
		return { success: false, message: t("invalidPayload") };
	}

	const parsed = bodySchema.safeParse(json);
	if (!parsed.success) {
		return { success: false, message: t("invalidData") };
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };

	const periodFrom = parseDateInput(parsed.data.periodFrom);
	const periodTo = parseDateInput(parsed.data.periodTo);
	if (!periodFrom || !periodTo || periodFrom > periodTo) {
		return { success: false, message: t("invalidPeriod") };
	}

	const type = parsed.data.cleaningType as CleaningType;

	const overlap = await db.cleaningAssignmentList.findFirst({
		where: {
			organizationId: authz.organization.id,
			cleaningType: type,
			status: "SAVED",
			periodFrom: { lte: periodTo },
			periodTo: { gte: periodFrom },
		},
		select: { id: true, periodFrom: true, periodTo: true },
	});

	if (overlap) {
		return { success: false, message: t("overlap") };
	}

	try {
		await db.$transaction(async (tx) => {
			const list = await tx.cleaningAssignmentList.create({
				data: {
					organizationId: authz.organization.id,
					cleaningType: type,
					periodFrom,
					periodTo,
					status: "SAVED",
				},
			});

			for (const day of parsed.data.days) {
				const date = parseDateInput(day.date);
				if (!date) continue;

				const dateRow = await tx.cleaningAssignmentDate.create({
					data: { listId: list.id, date },
				});

				const slots = day.slots.filter(
					(s) => !day.hiddenSectorIds.includes(s.sectorId),
				);

				if (slots.length === 0) continue;

				await tx.cleaningAssignmentSectorAssignment.createMany({
					data: slots.map((s) => ({
						assignmentDateId: dateRow.id,
						sectorId: s.sectorId,
						personId: s.personId,
						familyId: s.familyId ?? null,
						groupId: s.groupId ?? null,
						position: s.position,
						isManual: s.isManual,
					})),
					skipDuplicates: true,
				});
			}
		});

		revalidatePath(`/org/${authz.organization.slug}/cleaning`);
		revalidatePath(`/org/${authz.organization.slug}/cleaning`, "page");
		return { success: true, message: t("success") };
	} catch {
		return { success: false, message: t("failed") };
	}
}
