"use server";

import { revalidatePath } from "next/cache";
import type { SettingsActionState } from "@/features/settings/actions/settings-action-state";
import { requireSettingsManager } from "@/features/settings/actions/settings-auth";
import { parseDateInput } from "@/features/settings/lib/year-bounds";
import {
	celebrationSchema,
	circuitAssemblyBranchRepSchema,
	circuitAssemblyOverseerSchema,
	circuitOverseerVisitSchema,
	conventionSchema,
	specialMeetingSchema,
	specialTalkSchema,
} from "@/features/settings/meetings/actions/special-event-schemas";
import { db } from "@/lib/db";

function revalidateSettings(slug: string) {
	revalidatePath(`/org/${slug}/settings`);
}

function emptyToNull(v: unknown): string | null {
	const s = typeof v === "string" ? v.trim() : "";
	return s ? s : null;
}

export async function upsertCelebrationAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = celebrationSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		id: String(formData.get("id") ?? ""),
		date: String(formData.get("date") ?? ""),
		time: String(formData.get("time") ?? ""),
		location: String(formData.get("location") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	const date = parseDateInput(parsed.data.date);
	if (!date) return { success: false, message: "Data inválida." };
	const year = date.getUTCFullYear();
	const id = parsed.data.id || null;
	const clash = await db.celebration.findFirst({
		where: {
			organizationId: authz.organization.id,
			year,
			...(id ? { NOT: { id } } : {}),
		},
		select: { id: true },
	});
	if (clash)
		return { success: false, message: "Já existe comemoração neste ano." };
	const data = {
		organizationId: authz.organization.id,
		year,
		date,
		time: parsed.data.time,
		location: emptyToNull(parsed.data.location),
		notes: emptyToNull(parsed.data.notes),
	};
	if (id) {
		const ok = await db.celebration.findFirst({
			where: { id, organizationId: authz.organization.id },
			select: { id: true },
		});
		if (!ok) return { success: false, message: "Evento não encontrado." };
		await db.celebration.update({ where: { id }, data });
	} else {
		await db.celebration.create({ data });
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Comemoração salva." };
}

export async function upsertCircuitOverseerVisitAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = circuitOverseerVisitSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		id: String(formData.get("id") ?? ""),
		travelerName: String(formData.get("travelerName") ?? ""),
		startDate: String(formData.get("startDate") ?? ""),
		endDate: String(formData.get("endDate") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	const startDate = parseDateInput(parsed.data.startDate);
	const endDate = parseDateInput(parsed.data.endDate);
	if (!startDate || !endDate || endDate < startDate)
		return { success: false, message: "Período inválido." };
	const id = parsed.data.id || null;
	const data = {
		organizationId: authz.organization.id,
		travelerName: parsed.data.travelerName.trim(),
		startDate,
		endDate,
		notes: emptyToNull(parsed.data.notes),
	};
	if (id) {
		const ok = await db.circuitOverseerVisit.findFirst({
			where: { id, organizationId: authz.organization.id },
			select: { id: true },
		});
		if (!ok) return { success: false, message: "Evento não encontrado." };
		await db.circuitOverseerVisit.update({ where: { id }, data });
	} else {
		await db.circuitOverseerVisit.create({ data });
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Visita salva." };
}

export async function upsertSpecialMeetingAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = specialMeetingSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		id: String(formData.get("id") ?? ""),
		date: String(formData.get("date") ?? ""),
		time: String(formData.get("time") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	const date = parseDateInput(parsed.data.date);
	if (!date) return { success: false, message: "Data inválida." };
	const id = parsed.data.id || null;
	const data = {
		organizationId: authz.organization.id,
		date,
		time: emptyToNull(parsed.data.time),
		notes: emptyToNull(parsed.data.notes),
	};
	if (id) {
		const ok = await db.specialMeeting.findFirst({
			where: { id, organizationId: authz.organization.id },
			select: { id: true },
		});
		if (!ok) return { success: false, message: "Evento não encontrado." };
		await db.specialMeeting.update({ where: { id }, data });
	} else {
		await db.specialMeeting.create({ data });
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Reunião especial salva." };
}

export async function upsertSpecialTalkAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = specialTalkSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		id: String(formData.get("id") ?? ""),
		date: String(formData.get("date") ?? ""),
		theme: String(formData.get("theme") ?? ""),
		speakerPersonId: String(formData.get("speakerPersonId") ?? ""),
		speakerName: String(formData.get("speakerName") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	const date = parseDateInput(parsed.data.date);
	if (!date) return { success: false, message: "Data inválida." };
	const speakerPersonId = parsed.data.speakerPersonId || null;
	if (speakerPersonId) {
		const person = await db.person.findFirst({
			where: { id: speakerPersonId, organizationId: authz.organization.id },
			select: { id: true, name: true },
		});
		if (!person) return { success: false, message: "Orador não encontrado." };
	}
	const id = parsed.data.id || null;
	const speakerName =
		emptyToNull(parsed.data.speakerName) ??
		(speakerPersonId
			? ((
					await db.person.findUnique({
						where: { id: speakerPersonId },
						select: { name: true },
					})
				)?.name ?? null)
			: null);
	const data = {
		organizationId: authz.organization.id,
		date,
		theme: emptyToNull(parsed.data.theme),
		speakerPersonId,
		speakerName,
		notes: emptyToNull(parsed.data.notes),
	};
	if (id) {
		const ok = await db.specialTalk.findFirst({
			where: { id, organizationId: authz.organization.id },
			select: { id: true },
		});
		if (!ok) return { success: false, message: "Evento não encontrado." };
		await db.specialTalk.update({ where: { id }, data });
	} else {
		await db.specialTalk.create({ data });
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Discurso especial salvo." };
}

export async function upsertConventionAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = conventionSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		id: String(formData.get("id") ?? ""),
		startDate: String(formData.get("startDate") ?? ""),
		endDate: String(formData.get("endDate") ?? ""),
		location: String(formData.get("location") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	const startDate = parseDateInput(parsed.data.startDate);
	const endDate = parseDateInput(parsed.data.endDate);
	if (!startDate || !endDate || endDate < startDate)
		return { success: false, message: "Período inválido." };
	const year = startDate.getUTCFullYear();
	const id = parsed.data.id || null;
	const clash = await db.convention.findFirst({
		where: {
			organizationId: authz.organization.id,
			year,
			...(id ? { NOT: { id } } : {}),
		},
		select: { id: true },
	});
	if (clash)
		return { success: false, message: "Já existe congresso neste ano." };
	const data = {
		organizationId: authz.organization.id,
		year,
		startDate,
		endDate,
		location: parsed.data.location.trim(),
		notes: emptyToNull(parsed.data.notes),
	};
	if (id) {
		const ok = await db.convention.findFirst({
			where: { id, organizationId: authz.organization.id },
			select: { id: true },
		});
		if (!ok) return { success: false, message: "Evento não encontrado." };
		await db.convention.update({ where: { id }, data });
	} else {
		await db.convention.create({ data });
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Congresso salvo." };
}

export async function upsertCircuitAssemblyOverseerAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = circuitAssemblyOverseerSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		id: String(formData.get("id") ?? ""),
		date: String(formData.get("date") ?? ""),
		location: String(formData.get("location") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	const date = parseDateInput(parsed.data.date);
	if (!date) return { success: false, message: "Data inválida." };
	const id = parsed.data.id || null;
	const data = {
		organizationId: authz.organization.id,
		date,
		location: parsed.data.location.trim(),
		notes: emptyToNull(parsed.data.notes),
	};
	if (id) {
		const ok = await db.circuitAssemblyOverseer.findFirst({
			where: { id, organizationId: authz.organization.id },
			select: { id: true },
		});
		if (!ok) return { success: false, message: "Evento não encontrado." };
		await db.circuitAssemblyOverseer.update({ where: { id }, data });
	} else {
		await db.circuitAssemblyOverseer.create({ data });
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Assembleia salva." };
}

export async function upsertCircuitAssemblyBranchRepAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const parsed = circuitAssemblyBranchRepSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		id: String(formData.get("id") ?? ""),
		date: String(formData.get("date") ?? ""),
		location: String(formData.get("location") ?? ""),
		notes: String(formData.get("notes") ?? ""),
	});
	if (!parsed.success) return { success: false, message: "Dados inválidos." };
	const authz = await requireSettingsManager(parsed.data.organizationSlug);
	if (!authz.ok) return { success: false, message: authz.message };
	const date = parseDateInput(parsed.data.date);
	if (!date) return { success: false, message: "Data inválida." };
	const id = parsed.data.id || null;
	const data = {
		organizationId: authz.organization.id,
		date,
		location: parsed.data.location.trim(),
		notes: emptyToNull(parsed.data.notes),
	};
	if (id) {
		const ok = await db.circuitAssemblyBranchRep.findFirst({
			where: { id, organizationId: authz.organization.id },
			select: { id: true },
		});
		if (!ok) return { success: false, message: "Evento não encontrado." };
		await db.circuitAssemblyBranchRep.update({ where: { id }, data });
	} else {
		await db.circuitAssemblyBranchRep.create({ data });
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Assembleia salva." };
}

export async function deleteDedicatedEventAction(
	_prev: SettingsActionState,
	formData: FormData,
): Promise<SettingsActionState> {
	const source = String(formData.get("source") ?? "");
	const id = String(formData.get("id") ?? "");
	const slug = String(formData.get("organizationSlug") ?? "");
	const authz = await requireSettingsManager(slug);
	if (!authz.ok) return { success: false, message: authz.message };
	const orgId = authz.organization.id;
	try {
		switch (source) {
			case "CELEBRATION":
				await db.celebration.deleteMany({
					where: { id, organizationId: orgId },
				});
				break;
			case "CIRCUIT_OVERSEER_VISIT":
				await db.circuitOverseerVisit.deleteMany({
					where: { id, organizationId: orgId },
				});
				break;
			case "SPECIAL_MEETING":
				await db.specialMeeting.deleteMany({
					where: { id, organizationId: orgId },
				});
				break;
			case "SPECIAL_TALK":
				await db.specialTalk.deleteMany({
					where: { id, organizationId: orgId },
				});
				break;
			case "CONVENTION":
				await db.convention.deleteMany({
					where: { id, organizationId: orgId },
				});
				break;
			case "CIRCUIT_ASSEMBLY_OVERSEER":
				await db.circuitAssemblyOverseer.deleteMany({
					where: { id, organizationId: orgId },
				});
				break;
			case "CIRCUIT_ASSEMBLY_BRANCH":
				await db.circuitAssemblyBranchRep.deleteMany({
					where: { id, organizationId: orgId },
				});
				break;
			default:
				return { success: false, message: "Tipo inválido." };
		}
	} catch {
		return { success: false, message: "Não foi possível excluir." };
	}
	revalidateSettings(authz.organization.slug);
	return { success: true, message: "Evento excluído." };
}
