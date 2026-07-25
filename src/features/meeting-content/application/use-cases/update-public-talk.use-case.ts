import type { PublicTalkRepository } from "../../domain/repositories/public-talk.repository";
import type {
	PublicTalkListItemDto,
	UpdatePublicTalkInput,
} from "../dto/public-talk.dto";

type Deps = { repository: PublicTalkRepository };

type Result =
	| { ok: true; talk: PublicTalkListItemDto }
	| { ok: false; error: string };

export async function updatePublicTalkUseCase(
	{ repository }: Deps,
	input: UpdatePublicTalkInput & {
		actorOrganizationId: string;
		isSuperAdmin: boolean;
	},
): Promise<Result> {
	const current = await repository.findById(input.id);
	if (!current) {
		return { ok: false, error: "Discurso não encontrado." };
	}

	const canEdit =
		input.isSuperAdmin || current.organizationId === input.actorOrganizationId;

	if (!canEdit) {
		return {
			ok: false,
			error: "Você não pode editar este discurso.",
		};
	}

	// OWNER/ADMIN não “promove” nem “rebaixa” para global
	const nextOrganizationId = input.isSuperAdmin
		? input.organizationId
		: input.actorOrganizationId;

	// Não permitir que admin local edite um global “no lugar”
	if (!input.isSuperAdmin && current.organizationId === null) {
		return {
			ok: false,
			error:
				"Discursos globais só podem ser editados pelo superadministrador. Crie uma cópia local se precisar ajustar o título.",
		};
	}

	const title = input.title.trim();
	if (!title) {
		return { ok: false, error: "O título é obrigatório." };
	}

	const conflict = await repository.findByScopeLocaleAndNumber({
		organizationId: nextOrganizationId,
		locale: input.locale,
		number: input.number,
		excludeId: input.id,
	});

	if (conflict) {
		return {
			ok: false,
			error: "Já existe outro discurso com este número neste escopo e idioma.",
		};
	}

	const talk = await repository.update({
		id: input.id,
		organizationId: nextOrganizationId,
		locale: input.locale,
		number: input.number,
		title,
		notes: input.notes?.trim() || null,
	});

	return { ok: true, talk };
}
