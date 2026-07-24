import { db } from "@/lib/db";

import type { ContentImportJobEntity } from "../../domain/entities/watchtower-study";
import type {
	ContentImportJobRepository,
	ContentImportSourceType,
	CreateImportJobInput,
} from "../../domain/repositories/content-import-job.repository";
import type { ContentLocale } from "../../domain/values-objects/content-locale";

type JobRow = {
	id: string;
	sourceType: string;
	locale: ContentLocale;
	status: ContentImportJobEntity["status"];
	extractedJson: unknown;
	notes: string | null;
	errorMessage: string | null;
	createdAt: Date;
	committedAt: Date | null;
	files: Array<{ fileName: string }>;
};

function mapJob(row: JobRow): ContentImportJobEntity {
	return {
		id: row.id,
		sourceType: row.sourceType as ContentImportJobEntity["sourceType"],
		locale: row.locale,
		status: row.status,
		extractedJson: row.extractedJson,
		notes: row.notes,
		errorMessage: row.errorMessage,
		fileNames: row.files.map((file) => file.fileName),
		createdAt: row.createdAt.toISOString(),
		committedAt: row.committedAt?.toISOString() ?? null,
	};
}

export class PrismaContentImportJobRepository
	implements ContentImportJobRepository
{
	async createProcessing(
		input: CreateImportJobInput,
	): Promise<ContentImportJobEntity> {
		const row = await db.contentImportJob.create({
			data: {
				sourceType: input.sourceType,
				locale: input.locale,
				status: "PROCESSING",
				files: {
					create: input.fileNames.map((fileName) => ({
						fileName,
						mimeType: "application/jwpub",
						storageKey: "memory:discarded",
						sizeBytes: 0,
					})),
				},
			},
			include: {
				files: {
					select: { fileName: true },
				},
			},
		});

		return mapJob(row);
	}

	async markAwaitingReview(input: {
		id: string;
		extractedJson: unknown;
		notes?: string | null;
	}): Promise<ContentImportJobEntity> {
		const row = await db.contentImportJob.update({
			where: { id: input.id },
			data: {
				status: "AWAITING_REVIEW",
				extractedJson: input.extractedJson as object,
				notes: input.notes ?? null,
				errorMessage: null,
			},
			include: {
				files: {
					select: { fileName: true },
				},
			},
		});

		return mapJob(row);
	}

	async markFailed(id: string, errorMessage: string): Promise<void> {
		await db.contentImportJob.update({
			where: { id },
			data: {
				status: "FAILED",
				errorMessage: errorMessage.slice(0, 2000),
			},
		});
	}

	async markCommitted(id: string): Promise<void> {
		await db.contentImportJob.update({
			where: { id },
			data: {
				status: "COMMITTED",
				committedAt: new Date(),
			},
		});
	}

	async updateDraft(
		id: string,
		extractedJson: unknown,
	): Promise<ContentImportJobEntity> {
		const row = await db.contentImportJob.update({
			where: { id },
			data: {
				extractedJson: extractedJson as object,
				status: "AWAITING_REVIEW",
				errorMessage: null,
			},
			include: {
				files: {
					select: { fileName: true },
				},
			},
		});

		return mapJob(row);
	}

	async findById(id: string): Promise<ContentImportJobEntity | null> {
		const row = await db.contentImportJob.findUnique({
			where: { id },
			include: {
				files: {
					select: { fileName: true },
				},
			},
		});

		return row ? mapJob(row) : null;
	}

	async findLatestPending(
		sourceType: ContentImportSourceType,
	): Promise<ContentImportJobEntity | null> {
		const row = await db.contentImportJob.findFirst({
			where: {
				sourceType,
				status: {
					in: ["AWAITING_REVIEW", "PROCESSING"],
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			include: {
				files: {
					select: { fileName: true },
				},
			},
		});

		return row ? mapJob(row) : null;
	}

	async findLatestPendingWatchtower(): Promise<ContentImportJobEntity | null> {
		return this.findLatestPending("WATCHTOWER");
	}

	async discard(id: string): Promise<void> {
		await db.contentImportJob.update({
			where: { id },
			data: {
				status: "FAILED",
				errorMessage: "Importação descartada pelo usuário.",
				extractedJson: undefined,
			},
		});
	}
}
