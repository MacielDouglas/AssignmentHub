import { z } from "zod";
import { generateGroupSlug } from "@/features/groups/lib/group-slug";

const requiredString = z.string().trim().min(1, "Campo obrigatório.");

const slugSchema = z
	.string()
	.trim()
	.min(1, "Slug é obrigatório.")
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Slug deve conter apenas letras minúsculas, números e hífens.",
	);

export const groupBaseSchema = z
	.object({
		organizationId: requiredString,
		organizationSlug: requiredString,
		name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
		slug: slugSchema,
		superintendentId: requiredString,
		assistantId: requiredString,
		memberIds: z.array(z.string().trim().min(1)).default([]),
		includeFamiliesByHeadIds: z.array(z.string().trim().min(1)).default([]),
		conflictOverrides: z.array(z.string().trim().min(1)).default([]),
	})
	.superRefine((data, ctx) => {
		if (data.superintendentId === data.assistantId) {
			ctx.addIssue({
				code: "custom",
				path: ["assistantId"],
				message: "Superintendente e ajudante devem ser pessoas diferentes.",
			});
		}
	});

export const createGroupSchema = groupBaseSchema;

export const updateGroupSchema = groupBaseSchema.extend({
	groupId: requiredString,
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

function normalizeSlug(name: string, slug: string) {
	const trimmedSlug = slug.trim();

	if (trimmedSlug) return trimmedSlug;

	return generateGroupSlug(name);
}

export function parseCreateGroupFormData(formData: FormData) {
	const name = String(formData.get("name") ?? "");
	const slug = String(formData.get("slug") ?? "");

	return createGroupSchema.safeParse({
		organizationId: String(formData.get("organizationId") ?? ""),
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		name,
		slug: normalizeSlug(name, slug),
		superintendentId: String(formData.get("superintendentId") ?? ""),
		assistantId: String(formData.get("assistantId") ?? ""),
		memberIds: formData
			.getAll("memberIds")
			.map((value) => String(value).trim())
			.filter(Boolean),
		includeFamiliesByHeadIds: formData
			.getAll("includeFamiliesByHeadIds")
			.map((value) => String(value).trim())
			.filter(Boolean),
		conflictOverrides: formData
			.getAll("conflictOverrides")
			.map((value) => String(value).trim())
			.filter(Boolean),
	});
}

export function parseUpdateGroupFormData(formData: FormData) {
	const name = String(formData.get("name") ?? "");
	const slug = String(formData.get("slug") ?? "");

	return updateGroupSchema.safeParse({
		groupId: String(formData.get("groupId") ?? ""),
		organizationId: String(formData.get("organizationId") ?? ""),
		organizationSlug: String(formData.get("organizationSlug") ?? ""),
		name,
		slug: normalizeSlug(name, slug),
		superintendentId: String(formData.get("superintendentId") ?? ""),
		assistantId: String(formData.get("assistantId") ?? ""),
		memberIds: formData
			.getAll("memberIds")
			.map((value) => String(value).trim())
			.filter(Boolean),
		includeFamiliesByHeadIds: formData
			.getAll("includeFamiliesByHeadIds")
			.map((value) => String(value).trim())
			.filter(Boolean),
		conflictOverrides: formData
			.getAll("conflictOverrides")
			.map((value) => String(value).trim())
			.filter(Boolean),
	});
}
