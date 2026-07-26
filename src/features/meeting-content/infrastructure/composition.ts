import JwpubMwbExtractor from "./jwpub/jwpub-mwb-extractor";
import { JwpubSongbookExtractor } from "./jwpub/jwpub-songbook-extractor";
import { PrismaContentImportJobRepository } from "./prisma/content-import-job.prisma-repository";
import PrismaMwbRepository from "./prisma/mwb.prisma-repository";
import { PrismaSongRepository } from "./prisma/song.prisma-repository";
import { PrismaWatchtowerStudyRepository } from "./prisma/watchtower-study.prisma-repository";

export function createMeetingContentDeps() {
	return {
		studies: new PrismaWatchtowerStudyRepository(),
		songs: new PrismaSongRepository(),
		jobs: new PrismaContentImportJobRepository(),
		mwb: new JwpubMwbExtractor(),
		mwbRepository: new PrismaMwbRepository(),
		songbook: new JwpubSongbookExtractor(),
	};
}
