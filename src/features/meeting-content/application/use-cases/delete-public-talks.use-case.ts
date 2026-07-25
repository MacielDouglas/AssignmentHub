import type { PublicTalkRepository } from "../../domain/repositories/public-talk.repository";
import type { DeletePublicTalksInput } from "../dto/public-talk.dto";

type Deps = { repository: PublicTalkRepository };

export async function deletePublicTalksUseCase(
	{ repository }: Deps,
	input: DeletePublicTalksInput,
) {
	const ids = Array.from(new Set(input.ids.filter(Boolean)));
	if (ids.length === 0) {
		return { ok: false as const, error: "Nenhum discurso foi selecionado." };
	}

	if (!input.isSuperAdmin && !input.actorOrganizationId) {
		return { ok: false as const, error: "Organização inválida." };
	}

	const count = await repository.deleteMany({
		ids,
		actorOrganizationId: input.actorOrganizationId,
		isSuperAdmin: input.isSuperAdmin,
	});

	if (count === 0) {
		return {
			ok: false as const,
			error:
				"Nenhum discurso foi excluído. Verifique se você tem permissão sobre esses itens.",
		};
	}

	return { ok: true as const, count };
}
