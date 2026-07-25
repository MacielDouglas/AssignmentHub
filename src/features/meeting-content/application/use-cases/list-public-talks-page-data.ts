import { createMeetingContentDeps } from "../../infrastructure/composition";
import { getPublicTalksSectionData } from "../../queries/get-public-talks-section-data.query";

export async function listPublicTalksPageData(organizationId: string) {
	const deps = createMeetingContentDeps();
	const [data, pendingJob] = await Promise.all([
		getPublicTalksSectionData({ organizationId }),
		deps.jobs.findLatestPending("PUBLIC_TALKS"),
	]);
	return { data, pendingJob };
}
