import "server-only";

import { db } from "@/lib/db";

export type AssignmentSettingsView = {
	settingsId: string | null;
	rotationMode: "LEAST_LOAD" | "ROUND_ROBIN";
	rulesCount: number;
};

export async function loadAssignmentSettingsView(
	organizationId: string,
): Promise<AssignmentSettingsView> {
	try {
		const settings = await db.assignmentSettings.findUnique({
			where: { organizationId },
			select: {
				id: true,
				rotationMode: true,
				_count: { select: { rules: true } },
			},
		});
		return {
			settingsId: settings?.id ?? null,
			rotationMode: (settings?.rotationMode ?? "LEAST_LOAD") as
				| "LEAST_LOAD"
				| "ROUND_ROBIN",
			rulesCount: settings?._count.rules ?? 0,
		};
	} catch (e) {
		// P2021 = tabela não existe (migração 20260908 ainda não aplicada).
		// Volta o padrão para a página não quebrar; o legado segue intacto.
		if (
			typeof e === "object" &&
			e !== null &&
			"code" in e &&
			(e as { code?: unknown }).code === "P2021"
		) {
			return { settingsId: null, rotationMode: "LEAST_LOAD", rulesCount: 0 };
		}
		throw e;
	}
}
