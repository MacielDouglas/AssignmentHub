/*
  Warnings:

  - The values [MIDWEEK_MEETING,WEEKEND_MEETING] on the enum `OrganizationScheduleType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationScheduleType_new" AS ENUM ('MEETINGS', 'SPECIAL_MEETING', 'TRAVELING_OVERSEER_VISIT', 'CELEBRATION', 'SPECIAL_TALK', 'CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER', 'CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE', 'FIELD_SERVICE_MEETING', 'CONVENTION', 'WEEKLY_CLEANING', 'GENERAL_CLEANING');
ALTER TABLE "OrganizationSchedule" ALTER COLUMN "type" TYPE "OrganizationScheduleType_new" USING ("type"::text::"OrganizationScheduleType_new");
ALTER TYPE "OrganizationScheduleType" RENAME TO "OrganizationScheduleType_old";
ALTER TYPE "OrganizationScheduleType_new" RENAME TO "OrganizationScheduleType";
DROP TYPE "public"."OrganizationScheduleType_old";
COMMIT;

-- AlterTable
ALTER TABLE "OrganizationScheduleOccurrence" ADD COLUMN     "isAllDay" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "OrganizationSchedule_organizationId_effectiveUntil_idx" ON "OrganizationSchedule"("organizationId", "effectiveUntil");

-- CreateIndex
CREATE INDEX "OrganizationSchedule_organizationId_type_effectiveFrom_idx" ON "OrganizationSchedule"("organizationId", "type", "effectiveFrom");

-- CreateIndex
CREATE INDEX "OrganizationScheduleOccurrence_organizationScheduleId_endDa_idx" ON "OrganizationScheduleOccurrence"("organizationScheduleId", "endDate");
