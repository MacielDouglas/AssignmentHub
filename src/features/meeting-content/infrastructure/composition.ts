import { PrismaContentImportJobRepository } from "./prisma/content-import-job.prisma-repository";
import { PrismaWatchtowerStudyRepository } from "./prisma/watchtower-study.prisma-repository";

export function createMeetingContentDeps() {
	return {
		studies: new PrismaWatchtowerStudyRepository(),
		jobs: new PrismaContentImportJobRepository(),
	};
}
