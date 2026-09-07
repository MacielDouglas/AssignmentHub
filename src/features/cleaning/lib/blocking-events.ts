import "server-only";

import { formatDateInput } from "@/features/settings/lib/year-bounds";
import { db } from "@/lib/db";

export type BlockingEventKind =
	| "CONVENTION"
	| "ASSEMBLY_OVERSEER"
	| "ASSEMBLY_BRANCH";

export type BlockingEvent = {
	kind: BlockingEventKind;
	label: string;
	/** yyyy-mm-dd */
	startDate: string;
	/** yyyy-mm-dd */
	endDate: string;
};

const LEGACY_TYPES = [
	"CONVENTION",
	"CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
	"CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
] as const;

const LEGACY_LABEL: Record<(typeof LEGACY_TYPES)[number], string> = {
	CONVENTION: "Congresso",
	CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER: "Assembleia com Viajante",
	CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE: "Assembleia com Representante",
};

function isMissingTableError(e: unknown): boolean {
	return (
		typeof e === "object" &&
		e !== null &&
		"code" in e &&
		(e as { code?: unknown }).code === "P2021"
	);
}

/**
 * Eventos que bloqueiam a limpeza na semana: Congresso, Assembleia com
 * Representante e Assembleia com Viajante. Lê as tabelas dedicadas (Opção B)
 * + ocorrências legadas desses 3 tipos.
 */
export async function listCleaningBlockingEvents(
	organizationId: string,
): Promise<BlockingEvent[]> {
	const [dedicated, legacy] = await Promise.all([
		loadDedicatedBlocking(organizationId),
		loadLegacyBlocking(organizationId),
	]);
	return [...dedicated, ...legacy].sort((a, b) =>
		a.startDate.localeCompare(b.startDate),
	);
}

async function loadDedicatedBlocking(
	organizationId: string,
): Promise<BlockingEvent[]> {
	try {
		const [conventions, overseer, branch] = await Promise.all([
			db.convention.findMany({
				where: { organizationId },
				select: { startDate: true, endDate: true },
			}),
			db.circuitAssemblyOverseer.findMany({
				where: { organizationId },
				select: { date: true },
			}),
			db.circuitAssemblyBranchRep.findMany({
				where: { organizationId },
				select: { date: true },
			}),
		]);
		return [
			...conventions.map((c) => ({
				kind: "CONVENTION" as const,
				label: "Congresso",
				startDate: formatDateInput(c.startDate),
				endDate: formatDateInput(c.endDate),
			})),
			...overseer.map((a) => {
				const d = formatDateInput(a.date);
				return {
					kind: "ASSEMBLY_OVERSEER" as const,
					label: "Assembleia com Viajante",
					startDate: d,
					endDate: d,
				};
			}),
			...branch.map((a) => {
				const d = formatDateInput(a.date);
				return {
					kind: "ASSEMBLY_BRANCH" as const,
					label: "Assembleia com Representante",
					startDate: d,
					endDate: d,
				};
			}),
		];
	} catch (e) {
		// Migração 20260908 ainda não aplicada → sem bloqueios dedicados.
		if (isMissingTableError(e)) return [];
		throw e;
	}
}

async function loadLegacyBlocking(
	organizationId: string,
): Promise<BlockingEvent[]> {
	const schedules = await db.organizationSchedule.findMany({
		where: {
			organizationId,
			type: { in: [...LEGACY_TYPES] },
		},
		select: {
			type: true,
			occurrences: {
				select: { startDate: true, endDate: true },
			},
		},
	});
	return schedules.flatMap((s) =>
		s.occurrences.map((occ) => {
			const start = formatDateInput(occ.startDate);
			return {
				kind:
					s.type === "CONVENTION"
						? ("CONVENTION" as const)
						: s.type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER"
							? ("ASSEMBLY_OVERSEER" as const)
							: ("ASSEMBLY_BRANCH" as const),
				label: LEGACY_LABEL[s.type as (typeof LEGACY_TYPES)[number]],
				startDate: start,
				endDate: occ.endDate ? formatDateInput(occ.endDate) : start,
			};
		}),
	);
}
