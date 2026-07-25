import type { PublicTalkHistoryRepository } from "../../domain/repositories/public-talk-history.repository";

export async function deletePublicTalkHistoryUseCase(
	deps: {
		histories: PublicTalkHistoryRepository;
	},
	input: {
		id: string;
		organizationId: string;
	},
): Promise<{ ok: true } | { ok: false; error: string }> {
	const deleted = await deps.histories.deleteById(input);

	if (!deleted) {
		return {
			ok: false,
			error: "Histórico não encontrado ou sem permissão para removê-lo.",
		};
	}

	return { ok: true };
}
