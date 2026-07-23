/*
  Warnings:

  - You are about to drop the column `aiNotes` on the `content_import_job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "content_import_job" DROP COLUMN "aiNotes",
ADD COLUMN     "notes" TEXT;
