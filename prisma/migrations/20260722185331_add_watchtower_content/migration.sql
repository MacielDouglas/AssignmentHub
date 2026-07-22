-- CreateEnum
CREATE TYPE "ContentLocale" AS ENUM ('pt', 'es');

-- CreateEnum
CREATE TYPE "ContentImportSourceType" AS ENUM ('SONGBOOK', 'PUBLIC_TALKS', 'WATCHTOWER', 'MWB');

-- CreateEnum
CREATE TYPE "ContentImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'AWAITING_REVIEW', 'COMMITTED', 'FAILED');

-- CreateTable
CREATE TABLE "song" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "locale" "ContentLocale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchtower_study" (
    "id" TEXT NOT NULL,
    "locale" "ContentLocale" NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "weekLabelRaw" TEXT,
    "title" TEXT NOT NULL,
    "openingSongNum" INTEGER NOT NULL,
    "closingSongNum" INTEGER NOT NULL,
    "highlightColor" TEXT,
    "issueCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "openingSongId" TEXT,
    "closingSongId" TEXT,

    CONSTRAINT "watchtower_study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_import_job" (
    "id" TEXT NOT NULL,
    "sourceType" "ContentImportSourceType" NOT NULL,
    "locale" "ContentLocale" NOT NULL,
    "status" "ContentImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "extractedJson" JSONB,
    "aiNotes" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "committedAt" TIMESTAMP(3),

    CONSTRAINT "content_import_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_import_file" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_import_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "song_locale_idx" ON "song"("locale");

-- CreateIndex
CREATE INDEX "song_locale_number_idx" ON "song"("locale", "number");

-- CreateIndex
CREATE UNIQUE INDEX "song_number_locale_key" ON "song"("number", "locale");

-- CreateIndex
CREATE INDEX "watchtower_study_locale_weekStart_idx" ON "watchtower_study"("locale", "weekStart");

-- CreateIndex
CREATE INDEX "watchtower_study_issueCode_idx" ON "watchtower_study"("issueCode");

-- CreateIndex
CREATE UNIQUE INDEX "watchtower_study_weekStart_locale_key" ON "watchtower_study"("weekStart", "locale");

-- CreateIndex
CREATE INDEX "content_import_job_sourceType_status_createdAt_idx" ON "content_import_job"("sourceType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "content_import_job_locale_sourceType_idx" ON "content_import_job"("locale", "sourceType");

-- CreateIndex
CREATE INDEX "content_import_file_jobId_idx" ON "content_import_file"("jobId");

-- AddForeignKey
ALTER TABLE "watchtower_study" ADD CONSTRAINT "watchtower_study_openingSongId_fkey" FOREIGN KEY ("openingSongId") REFERENCES "song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchtower_study" ADD CONSTRAINT "watchtower_study_closingSongId_fkey" FOREIGN KEY ("closingSongId") REFERENCES "song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_import_file" ADD CONSTRAINT "content_import_file_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "content_import_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
