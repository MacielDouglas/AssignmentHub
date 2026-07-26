import type MwbRepository from "../../domain/repositories/mwb.repository";
import {
	type MwbIssueUpdateInput,
	sanitizeMwbIssueUpdate,
} from "../dto/mwb-extract.dto";

type Deps = { mwbRepository: MwbRepository };

export type UpdateMwbIssueResult = { ok: true } | { ok: false; error: string };

export async function updateMwbIssueUseCase(
	deps: Deps,
	payload: unknown,
): Promise<UpdateMwbIssueResult> {
	let data: MwbIssueUpdateInput;
	try {
		data = sanitizeMwbIssueUpdate(payload);
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error ? error.message : "Dados da apostila inválidos.",
		};
	}

	if (data.weeks.length === 0) {
		return { ok: false, error: "Inclua ao menos uma semana válida." };
	}

	return deps.mwbRepository.updateIssue(data);
}
