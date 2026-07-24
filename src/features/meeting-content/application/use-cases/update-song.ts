import type { SongRepository } from "../../domain/repositories/song.repository";
import type { ContentLocale } from "../../domain/values-objects/content-locale";

export type UpdateSongInput = {
	id: string;
	number: number;
	title: string;
	locale: ContentLocale;
};

export async function updateSongUseCase(
	deps: { songs: SongRepository },
	input: UpdateSongInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const title = input.title.trim().replace(/\s+/g, " ");

	if (!input.id) {
		return { ok: false, error: "Cântico inválido." };
	}

	if (
		!Number.isInteger(input.number) ||
		input.number < 1 ||
		input.number > 999
	) {
		return {
			ok: false,
			error: "O número deve ser um inteiro entre 1 e 999.",
		};
	}

	if (!title) {
		return {
			ok: false,
			error: "Informe o título do cântico.",
		};
	}

	try {
		await deps.songs.update({
			id: input.id,
			number: input.number,
			title,
			locale: input.locale,
		});

		return { ok: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : "";

		if (message.includes("Unique constraint")) {
			return {
				ok: false,
				error: "Já existe um cântico com esse número neste idioma.",
			};
		}

		return {
			ok: false,
			error: "Não foi possível atualizar o cântico.",
		};
	}
}
