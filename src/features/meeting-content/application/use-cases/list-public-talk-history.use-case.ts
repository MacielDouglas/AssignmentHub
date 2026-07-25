import type { PublicTalkHistoryRepository } from "../../domain/repositories/public-talk-history.repository";

export async function listPublicTalkHistoryUseCase(
	deps: {
		repository: PublicTalkHistoryRepository;
	},
	input: {
		organizationId: string;
		publicTalkId: string;
		take?: number;
	},
) {
	return deps.repository.listLatestByTalk({
		organizationId: input.organizationId,
		publicTalkId: input.publicTalkId,
		take: input.take ?? 10,
	});
}
