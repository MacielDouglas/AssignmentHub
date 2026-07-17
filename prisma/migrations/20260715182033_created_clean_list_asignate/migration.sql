-- CreateEnum
CREATE TYPE "CleaningAssignmentListStatus" AS ENUM ('DRAFT', 'SAVED');

-- CreateEnum
CREATE TYPE "CleaningSectorTargetSex" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "CleaningSector" ADD COLUMN     "targetSex" "CleaningSectorTargetSex";

-- CreateTable
CREATE TABLE "CleaningAssignmentList" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cleaningType" "CleaningType" NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "status" "CleaningAssignmentListStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningAssignmentList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningAssignmentDate" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningAssignmentDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningAssignmentSectorAssignment" (
    "id" TEXT NOT NULL,
    "assignmentDateId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "familyId" TEXT,
    "groupId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningAssignmentSectorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CleaningAssignmentList_organizationId_cleaningType_periodFr_idx" ON "CleaningAssignmentList"("organizationId", "cleaningType", "periodFrom");

-- CreateIndex
CREATE INDEX "CleaningAssignmentList_organizationId_periodFrom_periodTo_idx" ON "CleaningAssignmentList"("organizationId", "periodFrom", "periodTo");

-- CreateIndex
CREATE INDEX "CleaningAssignmentList_organizationId_status_createdAt_idx" ON "CleaningAssignmentList"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CleaningAssignmentDate_listId_date_idx" ON "CleaningAssignmentDate"("listId", "date");

-- CreateIndex
CREATE INDEX "CleaningAssignmentDate_date_idx" ON "CleaningAssignmentDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningAssignmentDate_listId_date_key" ON "CleaningAssignmentDate"("listId", "date");

-- CreateIndex
CREATE INDEX "CleaningAssignmentSectorAssignment_assignmentDateId_sectorI_idx" ON "CleaningAssignmentSectorAssignment"("assignmentDateId", "sectorId");

-- CreateIndex
CREATE INDEX "CleaningAssignmentSectorAssignment_personId_idx" ON "CleaningAssignmentSectorAssignment"("personId");

-- CreateIndex
CREATE INDEX "CleaningAssignmentSectorAssignment_familyId_idx" ON "CleaningAssignmentSectorAssignment"("familyId");

-- CreateIndex
CREATE INDEX "CleaningAssignmentSectorAssignment_groupId_idx" ON "CleaningAssignmentSectorAssignment"("groupId");

-- CreateIndex
CREATE INDEX "CleaningAssignmentSectorAssignment_sectorId_position_idx" ON "CleaningAssignmentSectorAssignment"("sectorId", "position");

-- CreateIndex
CREATE INDEX "CleaningSector_cleaningTypeConfigId_targetSex_idx" ON "CleaningSector"("cleaningTypeConfigId", "targetSex");

-- AddForeignKey
ALTER TABLE "CleaningAssignmentList" ADD CONSTRAINT "CleaningAssignmentList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignmentDate" ADD CONSTRAINT "CleaningAssignmentDate_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CleaningAssignmentList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignmentSectorAssignment" ADD CONSTRAINT "CleaningAssignmentSectorAssignment_assignmentDateId_fkey" FOREIGN KEY ("assignmentDateId") REFERENCES "CleaningAssignmentDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignmentSectorAssignment" ADD CONSTRAINT "CleaningAssignmentSectorAssignment_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "CleaningSector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignmentSectorAssignment" ADD CONSTRAINT "CleaningAssignmentSectorAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignmentSectorAssignment" ADD CONSTRAINT "CleaningAssignmentSectorAssignment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningAssignmentSectorAssignment" ADD CONSTRAINT "CleaningAssignmentSectorAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
