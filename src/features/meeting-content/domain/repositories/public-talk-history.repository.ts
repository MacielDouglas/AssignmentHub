import type {
	DeletePublicTalkHistoryInput,
	PublicTalkHistoryListItemDto,
} from "../../application/dto/public-talk-history.dto";

export interface PublicTalkHistoryRepository {
	create(input: {
		organizationId: string;
		publicTalkId: string;
		performedAt: Date;
		speakerNameSnapshot: string;
		notes?: string | null;
		speakerPersonId?: string | null;
		speakerSubPersonId?: string | null;
	}): Promise<PublicTalkHistoryListItemDto>;

	delete(input: DeletePublicTalkHistoryInput): Promise<void>;

	deleteById(input: { id: string; organizationId: string }): Promise<boolean>;

	listLatestByTalk(params: {
		organizationId: string;
		publicTalkId: string;
		take: number;
	}): Promise<PublicTalkHistoryListItemDto[]>;
}
