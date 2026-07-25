/*
  Warnings:

  - You are about to drop the `PublicTalk` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[organizationId,symbol,locale]` on the table `mwb_issue` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PublicTalkHistory" DROP CONSTRAINT "PublicTalkHistory_publicTalkId_fkey";

-- DropIndex
DROP INDEX "content_import_job_sourceType_status_createdAt_idx";

-- DropIndex
DROP INDEX "mwb_issue_symbol_locale_key";

-- AlterTable
ALTER TABLE "content_import_job" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "mwb_issue" ADD COLUMN     "organizationId" TEXT;

-- DropTable
DROP TABLE "PublicTalk";

-- CreateTable
CREATE TABLE "public_talk" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "locale" "ContentLocale" NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_talk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "public_talk_organizationId_locale_number_idx" ON "public_talk"("organizationId", "locale", "number");

-- CreateIndex
CREATE INDEX "public_talk_locale_number_idx" ON "public_talk"("locale", "number");

-- CreateIndex
CREATE INDEX "public_talk_organizationId_locale_title_idx" ON "public_talk"("organizationId", "locale", "title");

-- CreateIndex
CREATE UNIQUE INDEX "public_talk_organizationId_locale_number_key" ON "public_talk"("organizationId", "locale", "number");

-- CreateIndex
CREATE INDEX "content_import_job_organizationId_sourceType_status_created_idx" ON "content_import_job"("organizationId", "sourceType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "mwb_issue_organizationId_locale_year_month_idx" ON "mwb_issue"("organizationId", "locale", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "mwb_issue_organizationId_symbol_locale_key" ON "mwb_issue"("organizationId", "symbol", "locale");

-- AddForeignKey
ALTER TABLE "public_talk" ADD CONSTRAINT "public_talk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicTalkHistory" ADD CONSTRAINT "PublicTalkHistory_publicTalkId_fkey" FOREIGN KEY ("publicTalkId") REFERENCES "public_talk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwb_issue" ADD CONSTRAINT "mwb_issue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_import_job" ADD CONSTRAINT "content_import_job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
