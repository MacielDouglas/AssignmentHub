"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { db } from "@/lib/db";

const booleanFromCheckbox = z
	.enum(["true", "false"])
	.transform((value) => value === "true");

function buildSchema(invalidSectors: string) {
	const sectorsSchema = z.string().transform((value, ctx) => {
		let parsed: unknown;

		try {
			parsed = JSON.parse(value);
		} catch {
			ctx.addIssue({
				code: "custom",
				message: invalidSectors,
			});
			return z.NEVER;
		}

		const result = z.array(z.string().trim().max(80)).max(20).safeParse(parsed);

		if (!result.success) {
			ctx.addIssue({
				code: "custom",
				message: invalidSectors,
			});
			return z.NEVER;
		}

		return result.data.filter((sector) => sector.length > 0);
	});

	return z.object({
		organizationSlug: z.string().trim().min(1),
		indicatorActive: booleanFromCheckbox,
		indicatorCount: z.coerce.number().int().min(0).max(50),
		indicatorSectors: sectorsSchema,
		micActive: booleanFromCheckbox,
		micCount: z.coerce.number().int().min(0).max(50),
		soundActive: booleanFromCheckbox,
		videoActive: booleanFromCheckbox,
		stageActive: booleanFromCheckbox,
	});
}

export async function saveDutySettingsAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const t = await getTranslations("SettingsDuties");
	const schema = buildSchema(t("invalidSectors"));

	const parsed = schema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		indicatorActive: String(formData.get("indicatorActive") ?? "false"),
		indicatorCount: String(formData.get("indicatorCount") ?? "0"),
		indicatorSectors: String(formData.get("indicatorSectors") ?? "[]"),
		micActive: String(formData.get("micActive") ?? "false"),
		micCount: String(formData.get("micCount") ?? "0"),
		soundActive: String(formData.get("soundActive") ?? "false"),
		videoActive: String(formData.get("videoActive") ?? "false"),
		stageActive: String(formData.get("stageActive") ?? "false"),
	});

	if (!parsed.success) {
		return { success: false, message: t("invalidData") };
	}

	if (parsed.data.indicatorActive && parsed.data.indicatorCount < 1) {
		return {
			success: false,
			message: t("indicatorCountRequired"),
		};
	}

	if (parsed.data.micActive && parsed.data.micCount < 1) {
		return {
			success: false,
			message: t("micCountRequired"),
		};
	}

	const authz = await requireSettingsManager(parsed.data.organizationSlug);

	if (!authz.ok) {
		return { success: false, message: authz.message };
	}

	await db.meetingDutySettings.upsert({
		where: { organizationId: authz.organization.id },
		create: {
			organizationId: authz.organization.id,
			indicatorActive: parsed.data.indicatorActive,
			indicatorCount: parsed.data.indicatorCount,
			indicatorSectors: parsed.data.indicatorSectors,
			micActive: parsed.data.micActive,
			micCount: parsed.data.micCount,
			soundActive: parsed.data.soundActive,
			videoActive: parsed.data.videoActive,
			stageActive: parsed.data.stageActive,
		},
		update: {
			indicatorActive: parsed.data.indicatorActive,
			indicatorCount: parsed.data.indicatorCount,
			indicatorSectors: parsed.data.indicatorSectors,
			micActive: parsed.data.micActive,
			micCount: parsed.data.micCount,
			soundActive: parsed.data.soundActive,
			videoActive: parsed.data.videoActive,
			stageActive: parsed.data.stageActive,
		},
	});

	revalidatePath(`/org/${authz.organization.slug}/settings`);

	return { success: true, message: t("saved") };
}
