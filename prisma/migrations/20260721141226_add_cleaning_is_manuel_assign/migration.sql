/*
  Warnings:

  - A unique constraint covering the columns `[assignmentDateId,sectorId,personId]` on the table `CleaningAssignmentSectorAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CleaningAssignmentSectorAssignment" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "CleaningAssignmentSectorAssignment_assignmentDateId_sectorI_key" ON "CleaningAssignmentSectorAssignment"("assignmentDateId", "sectorId", "personId");
