import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import type {
	CreatePublicTalkInput,
	DeletePublicTalksInput,
	ListPublicTalksInput,
	PublicTalkListItemDto,
	UpdatePublicTalkInput,
} from "../../application/dto/public-talk.dto";
import type { PublicTalkRepository } from "../../domain/repositories/public-talk.repository";
import type { ContentLocale } from "../../domain/values-objects/content-locale";

function mapPublicTalk(
	record: Prisma.PublicTalkGetPayload<Record<string, never>>,
): PublicTalkListItemDto {
	return {
		id: record.id,
		organizationId: record.organizationId,
		scope: record.organizationId === null ? "GLOBAL" : "LOCAL",
		locale: record.locale,
		number: record.number,
		title: record.title,
		notes: record.notes,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

export function mergePublicTalksByPrecedence(
	talks: PublicTalkListItemDto[],
): PublicTalkListItemDto[] {
	const byKey = new Map<string, PublicTalkListItemDto>();

	for (const talk of talks) {
		const key = `${talk.locale}:${talk.number}`;
		const existing = byKey.get(key);

		if (!existing) {
			byKey.set(key, talk);
			continue;
		}

		if (talk.organizationId !== null && existing.organizationId === null) {
			byKey.set(key, talk);
		}
	}

	return [...byKey.values()].sort(
		(a, b) => a.locale.localeCompare(b.locale) || a.number - b.number,
	);
}

export class PublicTalkPrismaRepository implements PublicTalkRepository {
	async create(input: CreatePublicTalkInput): Promise<PublicTalkListItemDto> {
		const record = await db.publicTalk.create({
			data: {
				organizationId: input.organizationId,
				locale: input.locale,
				number: input.number,
				title: input.title,
				notes: input.notes ?? null,
			},
		});
		return mapPublicTalk(record);
	}

	async update(input: UpdatePublicTalkInput): Promise<PublicTalkListItemDto> {
		const record = await db.publicTalk.update({
			where: { id: input.id },
			data: {
				organizationId: input.organizationId,
				locale: input.locale,
				number: input.number,
				title: input.title,
				notes: input.notes ?? null,
			},
		});
		return mapPublicTalk(record);
	}

	async deleteMany(input: DeletePublicTalksInput): Promise<number> {
		if (input.ids.length === 0) return 0;

		const where: Prisma.PublicTalkWhereInput = {
			id: { in: input.ids },
		};

		if (!input.isSuperAdmin) {
			if (!input.actorOrganizationId) return 0;
			where.organizationId = input.actorOrganizationId;
		}

		const result = await db.publicTalk.deleteMany({ where });
		return result.count;
	}

	async findById(id: string): Promise<PublicTalkListItemDto | null> {
		const record = await db.publicTalk.findUnique({ where: { id } });
		return record ? mapPublicTalk(record) : null;
	}

	async findByScopeLocaleAndNumber(params: {
		organizationId: string | null;
		locale: ContentLocale;
		number: number;
		excludeId?: string;
	}): Promise<PublicTalkListItemDto | null> {
		const record = await db.publicTalk.findFirst({
			where: {
				organizationId: params.organizationId,
				locale: params.locale,
				number: params.number,
				...(params.excludeId ? { id: { not: params.excludeId } } : {}),
			},
		});
		return record ? mapPublicTalk(record) : null;
	}

	async listForOrganization(
		input: ListPublicTalksInput,
	): Promise<PublicTalkListItemDto[]> {
		const search = input.search?.trim();

		const records = await db.publicTalk.findMany({
			where: {
				AND: [
					{
						OR: [
							{ organizationId: null },
							{ organizationId: input.organizationId },
						],
					},
					...(input.locale ? [{ locale: input.locale }] : []),
					...(search
						? [
								{
									OR: [
										{
											title: {
												contains: search,
												mode: "insensitive" as const,
											},
										},
										...(Number.isFinite(Number(search))
											? [{ number: Number(search) }]
											: []),
									],
								},
							]
						: []),
				],
			},
			orderBy: [{ locale: "asc" }, { number: "asc" }],
			take: input.take ?? 400,
		});

		return mergePublicTalksByPrecedence(records.map(mapPublicTalk));
	}

	async upsertMany(
		items: Array<{
			locale: ContentLocale;
			number: number;
			title: string;
			notes: string | null;
		}>,
	): Promise<number> {
		if (items.length === 0) return 0;

		const BATCH_SIZE = 20;

		for (let start = 0; start < items.length; start += BATCH_SIZE) {
			const batch = items.slice(start, start + BATCH_SIZE);

			await Promise.all(
				batch.map(async (item) => {
					const existing = await db.publicTalk.findFirst({
						where: {
							organizationId: null,
							locale: item.locale,
							number: item.number,
						},
						select: { id: true },
					});

					if (existing) {
						await db.publicTalk.update({
							where: { id: existing.id },
							data: {
								title: item.title.trim(),
								notes: item.notes,
							},
						});
						return;
					}

					await db.publicTalk.create({
						data: {
							organizationId: null,
							locale: item.locale,
							number: item.number,
							title: item.title.trim(),
							notes: item.notes,
						},
					});
				}),
			);
		}

		return items.length;
	}
}
