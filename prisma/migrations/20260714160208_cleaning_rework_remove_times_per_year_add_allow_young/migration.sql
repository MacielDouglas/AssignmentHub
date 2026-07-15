/*
  Warnings:

  - You are about to drop the column `intervalDays` on the `CleaningTypeConfig` table. All the data in the column will be lost.
  - You are about to drop the column `timesPerYear` on the `CleaningTypeConfig` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrganizationScheduleType" AS ENUM ('MIDWEEK_MEETING', 'WEEKEND_MEETING', 'CELEBRATION', 'CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER', 'CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE', 'SPECIAL_MEETING', 'TRAVELING_OVERSEER_VISIT', 'FIELD_SERVICE_MEETING');

-- CreateEnum
CREATE TYPE "OrganizationScheduleMode" AS ENUM ('WEEKLY_RECURRING', 'SINGLE_DATETIME', 'MULTIPLE_DATES', 'DATE_RANGE', 'MULTIPLE_DATETIME');

-- AlterTable
ALTER TABLE "CleaningSector" ADD COLUMN     "allowYoung" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "CleaningTypeConfig" DROP COLUMN "intervalDays",
DROP COLUMN "timesPerYear";

-- CreateTable
CREATE TABLE "OrganizationSchedule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "OrganizationScheduleType" NOT NULL,
    "mode" "OrganizationScheduleMode" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationScheduleWeeklyRule" (
    "id" TEXT NOT NULL,
    "organizationScheduleId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "time" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationScheduleWeeklyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationScheduleOccurrence" (
    "id" TEXT NOT NULL,
    "organizationScheduleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "time" TEXT,
    "leaderPersonId" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationScheduleOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationSchedule_organizationId_type_idx" ON "OrganizationSchedule"("organizationId", "type");

-- CreateIndex
CREATE INDEX "OrganizationSchedule_organizationId_isActive_idx" ON "OrganizationSchedule"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "OrganizationSchedule_organizationId_effectiveFrom_idx" ON "OrganizationSchedule"("organizationId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "OrganizationScheduleWeeklyRule_organizationScheduleId_sortO_idx" ON "OrganizationScheduleWeeklyRule"("organizationScheduleId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationScheduleWeeklyRule_organizationScheduleId_weekd_key" ON "OrganizationScheduleWeeklyRule"("organizationScheduleId", "weekday", "time");

-- CreateIndex
CREATE INDEX "OrganizationScheduleOccurrence_organizationScheduleId_start_idx" ON "OrganizationScheduleOccurrence"("organizationScheduleId", "startDate");

-- CreateIndex
CREATE INDEX "OrganizationScheduleOccurrence_leaderPersonId_idx" ON "OrganizationScheduleOccurrence"("leaderPersonId");

-- AddForeignKey
ALTER TABLE "OrganizationSchedule" ADD CONSTRAINT "OrganizationSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationScheduleWeeklyRule" ADD CONSTRAINT "OrganizationScheduleWeeklyRule_organizationScheduleId_fkey" FOREIGN KEY ("organizationScheduleId") REFERENCES "OrganizationSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationScheduleOccurrence" ADD CONSTRAINT "OrganizationScheduleOccurrence_organizationScheduleId_fkey" FOREIGN KEY ("organizationScheduleId") REFERENCES "OrganizationSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationScheduleOccurrence" ADD CONSTRAINT "OrganizationScheduleOccurrence_leaderPersonId_fkey" FOREIGN KEY ("leaderPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
