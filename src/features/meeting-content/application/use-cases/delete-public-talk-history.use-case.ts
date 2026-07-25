import type { PublicTalkHistoryRepository } from "../../domain/repositories/public-talk-history.repository";

export async function deletePublicTalkHistoryUseCase(
	deps: {
		repository: PublicTalkHistoryRepository;
	},
	input: {
		id: string;
		organizationId: string;
	},
) {
	await deps.repository.delete({
		id: input.id,
		organizationId: input.organizationId,
	});

	return {
		ok: true as const,
	};
}
