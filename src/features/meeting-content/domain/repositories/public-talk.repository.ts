import type {
	CreatePublicTalkInput,
	DeletePublicTalksInput,
	ListPublicTalksInput,
	PublicTalkListItemDto,
	UpdatePublicTalkInput,
} from "../../application/dto/public-talk.dto";
import type { ContentLocale } from "../values-objects/content-locale";

export interface PublicTalkRepository {
	create(input: CreatePublicTalkInput): Promise<PublicTalkListItemDto>;
	update(input: UpdatePublicTalkInput): Promise<PublicTalkListItemDto>;
	deleteMany(input: DeletePublicTalksInput): Promise<number>;
	findById(id: string): Promise<PublicTalkListItemDto | null>;
	findByScopeLocaleAndNumber(params: {
		organizationId: string | null;
		locale: ContentLocale;
		number: number;
		excludeId?: string;
	}): Promise<PublicTalkListItemDto | null>;
	listForOrganization(
		input: ListPublicTalksInput,
	): Promise<PublicTalkListItemDto[]>;
}
