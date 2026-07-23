import { listWatchtowerStudiesUseCase } from "../../application/use-cases/list-watchtower-studies";
import { createMeetingContentDeps } from "../../infrastructure/composition";

export async function listWatchtowerPageData() {
	const deps = createMeetingContentDeps();
	return listWatchtowerStudiesUseCase(deps);
}
