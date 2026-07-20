import { z } from "zod";
import { generateGroupSlug } from "@/features/groups/lib/group-slug";

const uuid = z.string().uuid("ID inválido.");
const requiredString = z.string().trim().min(1, "Campo obrigatório.");

const slugSchema = z
	.string()
	.trim()
	.min(1, "Slug é obrigatório.")
	.max(80, "Slug muito longo.")
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Slug deve conter apenas letras minúsculas, números e hífens.",
	);

const baseObject = z.object({
	organizationSlug: requiredString.max(120),
	name: z
		.string()
		.trim()
		.min(2, "Nome deve ter pelo menos 2 caracteres.")
		.max(120, "Nome muito longo."),
	slug: slugSchema,
	superintendentId: uuid,
	assistantId: uuid,
	memberIds: z.array(uuid).default([]),
	includeFamiliesByHeadIds: z.array(uuid).default([]),
	conflictOverrides: z.array(uuid).default([]),
	moveFamilyIds: z.array(uuid).default([]),
});

export const createGroupSchema = baseObject.superRefine((data, ctx) => {
	if (data.superintendentId === data.assistantId) {
		ctx.addIssue({
			code: "custom",
			path: ["assistantId"],
			message: "Superintendente e ajudante devem ser pessoas diferentes.",
		});
	}
});

export const updateGroupSchema = baseObject
	.extend({ groupId: uuid })
	.superRefine((data, ctx) => {
		if (data.superintendentId === data.assistantId) {
			ctx.addIssue({
				code: "custom",
				path: ["assistantId"],
				message: "Superintendente e ajudante devem ser pessoas diferentes.",
			});
		}
	});

export const deleteGroupSchema = z.object({
	organizationSlug: requiredString.max(120),
	groupId: uuid,
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type DeleteGroupInput = z.infer<typeof deleteGroupSchema>;

function getAll(formData: FormData, key: string) {
	return formData
		.getAll(key)
		.map((v) => String(v).trim())
		.filter(Boolean);
}

function normalizeSlug(name: string, slug: string) {
	const trimmed = slug.trim();
	if (trimmed) return trimmed;
	return generateGroupSlug(name);
}

export function parseCreateGroupFormData(formData: FormData) {
	return createGroupSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		name: String(formData.get("name") ?? ""),
		slug: normalizeSlug(
			String(formData.get("name") ?? ""),
			String(formData.get("slug") ?? ""),
		),
		superintendentId: String(formData.get("superintendentId") ?? ""),
		assistantId: String(formData.get("assistantId") ?? ""),
		memberIds: getAll(formData, "memberIds"),
		includeFamiliesByHeadIds: getAll(formData, "includeFamiliesByHeadIds"),
		conflictOverrides: getAll(formData, "conflictOverrides"),
		moveFamilyIds: getAll(formData, "moveFamilyIds"),
	});
}

export function parseUpdateGroupFormData(formData: FormData) {
	return updateGroupSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		groupId: String(formData.get("groupId") ?? ""),
		name: String(formData.get("name") ?? ""),
		slug: normalizeSlug(
			String(formData.get("name") ?? ""),
			String(formData.get("slug") ?? ""),
		),
		superintendentId: String(formData.get("superintendentId") ?? ""),
		assistantId: String(formData.get("assistantId") ?? ""),
		memberIds: getAll(formData, "memberIds"),
		includeFamiliesByHeadIds: getAll(formData, "includeFamiliesByHeadIds"),
		conflictOverrides: getAll(formData, "conflictOverrides"),
		moveFamilyIds: getAll(formData, "moveFamilyIds"),
	});
}

export function parseDeleteGroupFormData(formData: FormData) {
	return deleteGroupSchema.safeParse({
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		groupId: String(formData.get("groupId") ?? ""),
	});
}
