import type { PublicTalkRepository } from "../../domain/repositories/public-talk.repository";
import type {
	CreatePublicTalkInput,
	PublicTalkListItemDto,
} from "../dto/public-talk.dto";

type Deps = { repository: PublicTalkRepository };

type Result =
	| { ok: true; talk: PublicTalkListItemDto }
	| { ok: false; error: string };

export async function createPublicTalkUseCase(
	{ repository }: Deps,
	input: CreatePublicTalkInput,
): Promise<Result> {
	const title = input.title.trim();
	if (!title) {
		return { ok: false, error: "O título é obrigatório." };
	}

	if (input.number < 1 || input.number > 999) {
		return { ok: false, error: "Número inválido." };
	}

	const existing = await repository.findByScopeLocaleAndNumber({
		organizationId: input.organizationId,
		locale: input.locale,
		number: input.number,
	});

	if (existing) {
		return {
			ok: false,
			error:
				input.organizationId === null
					? "Já existe um discurso global com este número neste idioma."
					: "Já existe um discurso local com este número neste idioma.",
		};
	}

	const talk = await repository.create({
		organizationId: input.organizationId,
		locale: input.locale,
		number: input.number,
		title,
		notes: input.notes?.trim() || null,
	});

	return { ok: true, talk };
}
