import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import type {
	DeletePublicTalkHistoryInput,
	PublicTalkHistoryListItemDto,
} from "../../application/dto/public-talk-history.dto";
import type { PublicTalkHistoryRepository } from "../../domain/repositories/public-talk-history.repository";

type HistoryRecord = Prisma.PublicTalkHistoryGetPayload<{
	include: {
		speakerPerson: { select: { id: true; name: true } };
		speakerSubPerson: {
			select: {
				id: true;
				name: true;
				subOrganization: { select: { name: true } };
			};
		};
	};
}>;

function mapHistory(record: HistoryRecord): PublicTalkHistoryListItemDto {
	return {
		id: record.id,
		publicTalkId: record.publicTalkId,
		organizationId: record.organizationId,
		performedAt: record.performedAt,
		speakerNameSnapshot: record.speakerNameSnapshot,
		notes: record.notes,
		speakerPersonId: record.speakerPersonId,
		speakerSubPersonId: record.speakerSubPersonId,
		speakerPerson: record.speakerPerson
			? { id: record.speakerPerson.id, name: record.speakerPerson.name }
			: null,
		speakerSubPerson: record.speakerSubPerson
			? {
					id: record.speakerSubPerson.id,
					name: record.speakerSubPerson.name,
					subOrganizationName: record.speakerSubPerson.subOrganization.name,
				}
			: null,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

const historyInclude = {
	speakerPerson: { select: { id: true, name: true } },
	speakerSubPerson: {
		select: {
			id: true,
			name: true,
			subOrganization: { select: { name: true } },
		},
	},
} as const;

export class PublicTalkHistoryPrismaRepository
	implements PublicTalkHistoryRepository
{
	async create(input: {
		organizationId: string;
		publicTalkId: string;
		performedAt: Date;
		speakerNameSnapshot: string;
		notes?: string | null;
		speakerPersonId?: string | null;
		speakerSubPersonId?: string | null;
	}): Promise<PublicTalkHistoryListItemDto> {
		const record = await db.publicTalkHistory.create({
			data: {
				organizationId: input.organizationId,
				publicTalkId: input.publicTalkId,
				performedAt: input.performedAt,
				speakerNameSnapshot: input.speakerNameSnapshot,
				notes: input.notes ?? null,
				speakerPersonId: input.speakerPersonId ?? null,
				speakerSubPersonId: input.speakerSubPersonId ?? null,
			},
			include: historyInclude,
		});
		return mapHistory(record);
	}

	async delete(input: DeletePublicTalkHistoryInput): Promise<void> {
		await db.publicTalkHistory.delete({
			where: {
				id: input.id,
				organizationId: input.organizationId,
			},
		});
	}

	async listLatestByTalk(params: {
		organizationId: string;
		publicTalkId: string;
		take: number;
	}): Promise<PublicTalkHistoryListItemDto[]> {
		const records = await db.publicTalkHistory.findMany({
			where: {
				organizationId: params.organizationId,
				publicTalkId: params.publicTalkId,
			},
			orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
			take: params.take,
			include: historyInclude,
		});
		return records.map(mapHistory);
	}
}
