import type { PublicTalkRepository } from "../../domain/repositories/public-talk.repository";
import type { ListPublicTalksInput } from "../dto/public-talk.dto";

type Deps = {
	repository: PublicTalkRepository;
};

export async function listPublicTalksUseCase(
	deps: Deps,
	input: ListPublicTalksInput,
) {
	return deps.repository.listForOrganization(input);
}
