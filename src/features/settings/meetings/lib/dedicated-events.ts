import "server-only";

import { formatDateInput } from "@/features/settings/lib/year-bounds";
import { db } from "@/lib/db";

export type DedicatedEventItem = {
	id: string;
	source: string;
	typeLabel: string;
	startDate: string;
	endDate: string | null;
	time: string | null;
	location: string | null;
	notes: string | null;
	isAllDay: false;
	speakerName?: string | null;
	speakerPersonId?: string | null;
	theme?: string | null;
};

/** P2021 = tabela não existe (migração 20260908 ainda não aplicada). */
function isMissingTableError(e: unknown): boolean {
	return (
		typeof e === "object" &&
		e !== null &&
		"code" in e &&
		(e as { code?: unknown }).code === "P2021"
	);
}

/** Agenda unificada das 7 tabelas dedicadas (Opção B), ordenada por data. */
export async function listDedicatedEvents(
	organizationId: string,
): Promise<DedicatedEventItem[]> {
	try {
		return await loadDedicatedEvents(organizationId);
	} catch (e) {
		// Migração pendente → volta lista vazia e a página usa o legado.
		if (isMissingTableError(e)) return [];
		throw e;
	}
}

async function loadDedicatedEvents(
	organizationId: string,
): Promise<DedicatedEventItem[]> {
	const [
		celebrations,
		visits,
		specialMeetings,
		specialTalks,
		conventions,
		assemblyOverseer,
		assemblyBranch,
	] = await Promise.all([
		db.celebration.findMany({
			where: { organizationId },
			orderBy: { date: "asc" },
		}),
		db.circuitOverseerVisit.findMany({
			where: { organizationId },
			orderBy: { startDate: "asc" },
		}),
		db.specialMeeting.findMany({
			where: { organizationId },
			orderBy: { date: "asc" },
		}),
		db.specialTalk.findMany({
			where: { organizationId },
			orderBy: { date: "asc" },
			include: { speakerPerson: { select: { id: true, name: true } } },
		}),
		db.convention.findMany({
			where: { organizationId },
			orderBy: { startDate: "asc" },
		}),
		db.circuitAssemblyOverseer.findMany({
			where: { organizationId },
			orderBy: { date: "asc" },
		}),
		db.circuitAssemblyBranchRep.findMany({
			where: { organizationId },
			orderBy: { date: "asc" },
		}),
	]);

	const items: DedicatedEventItem[] = [
		...celebrations.map((c) => ({
			id: c.id,
			source: "CELEBRATION" as const,
			typeLabel: "Comemoração",
			startDate: formatDateInput(c.date),
			endDate: null,
			time: c.time,
			location: c.location,
			notes: c.notes,
			isAllDay: false as const,
		})),
		...visits.map((v) => ({
			id: v.id,
			source: "CIRCUIT_OVERSEER_VISIT" as const,
			typeLabel: "Visita do Superintendente de Circuito",
			startDate: formatDateInput(v.startDate),
			endDate: formatDateInput(v.endDate),
			time: null,
			location: null,
			notes: v.notes
				? `Viajante: ${v.travelerName} | ${v.notes}`
				: `Viajante: ${v.travelerName}`,
			isAllDay: false as const,
		})),
		...specialMeetings.map((s) => ({
			id: s.id,
			source: "SPECIAL_MEETING" as const,
			typeLabel: "Reunião especial",
			startDate: formatDateInput(s.date),
			endDate: null,
			time: s.time,
			location: null,
			notes: s.notes,
			isAllDay: false as const,
		})),
		...specialTalks.map((s) => ({
			id: s.id,
			source: "SPECIAL_TALK" as const,
			typeLabel: "Discurso especial",
			startDate: formatDateInput(s.date),
			endDate: null,
			time: null,
			location: null,
			notes: s.notes,
			isAllDay: false as const,
			speakerName: s.speakerName ?? s.speakerPerson?.name ?? null,
			speakerPersonId: s.speakerPerson?.id ?? null,
			theme: s.theme,
		})),
		...conventions.map((c) => ({
			id: c.id,
			source: "CONVENTION" as const,
			typeLabel: "Congresso",
			startDate: formatDateInput(c.startDate),
			endDate: formatDateInput(c.endDate),
			time: null,
			location: c.location,
			notes: c.notes,
			isAllDay: false as const,
		})),
		...assemblyOverseer.map((a) => ({
			id: a.id,
			source: "CIRCUIT_ASSEMBLY_OVERSEER" as const,
			typeLabel: "Assembleia com Viajante",
			startDate: formatDateInput(a.date),
			endDate: null,
			time: null,
			location: a.location,
			notes: a.notes,
			isAllDay: false as const,
		})),
		...assemblyBranch.map((a) => ({
			id: a.id,
			source: "CIRCUIT_ASSEMBLY_BRANCH" as const,
			typeLabel: "Assembleia com Representante",
			startDate: formatDateInput(a.date),
			endDate: null,
			time: null,
			location: a.location,
			notes: a.notes,
			isAllDay: false as const,
		})),
	];

	return items.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
