-- CreateEnum
CREATE TYPE "CleaningType" AS ENUM ('MEETING', 'WEEKLY', 'GENERAL');

-- CreateEnum
CREATE TYPE "CleaningAssignmentMode" AS ENUM ('GROUP', 'FAMILY', 'PERSON');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "OrganizationCleaningSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cleaningPerMeeting" BOOLEAN NOT NULL DEFAULT false,
    "weeklyCleaning" BOOLEAN NOT NULL DEFAULT false,
    "generalCleaning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationCleaningSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningTypeConfig" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "type" "CleaningType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "assignmentMode" "CleaningAssignmentMode",
    "notes" TEXT,
    "groupId" TEXT,
    "familyId" TEXT,
    "personId" TEXT,
    "timesPerWeek" INTEGER,
    "timesPerYear" INTEGER,
    "intervalDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningWeekday" (
    "id" TEXT NOT NULL,
    "cleaningTypeConfigId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CleaningWeekday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningDate" (
    "id" TEXT NOT NULL,
    "cleaningTypeConfigId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleaningDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningSector" (
    "id" TEXT NOT NULL,
    "cleaningTypeConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "peopleRequired" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningSector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationCleaningSettings_organizationId_key" ON "OrganizationCleaningSettings"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationCleaningSettings_organizationId_idx" ON "OrganizationCleaningSettings"("organizationId");

-- CreateIndex
CREATE INDEX "CleaningTypeConfig_settingsId_type_idx" ON "CleaningTypeConfig"("settingsId", "type");

-- CreateIndex
CREATE INDEX "CleaningTypeConfig_groupId_idx" ON "CleaningTypeConfig"("groupId");

-- CreateIndex
CREATE INDEX "CleaningTypeConfig_familyId_idx" ON "CleaningTypeConfig"("familyId");

-- CreateIndex
CREATE INDEX "CleaningTypeConfig_personId_idx" ON "CleaningTypeConfig"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningTypeConfig_settingsId_type_key" ON "CleaningTypeConfig"("settingsId", "type");

-- CreateIndex
CREATE INDEX "CleaningWeekday_cleaningTypeConfigId_sortOrder_idx" ON "CleaningWeekday"("cleaningTypeConfigId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CleaningWeekday_cleaningTypeConfigId_weekday_key" ON "CleaningWeekday"("cleaningTypeConfigId", "weekday");

-- CreateIndex
CREATE INDEX "CleaningDate_cleaningTypeConfigId_date_idx" ON "CleaningDate"("cleaningTypeConfigId", "date");

-- CreateIndex
CREATE INDEX "CleaningSector_cleaningTypeConfigId_sortOrder_idx" ON "CleaningSector"("cleaningTypeConfigId", "sortOrder");

-- CreateIndex
CREATE INDEX "CleaningSector_cleaningTypeConfigId_isActive_idx" ON "CleaningSector"("cleaningTypeConfigId", "isActive");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- AddForeignKey
ALTER TABLE "OrganizationCleaningSettings" ADD CONSTRAINT "OrganizationCleaningSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTypeConfig" ADD CONSTRAINT "CleaningTypeConfig_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "OrganizationCleaningSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTypeConfig" ADD CONSTRAINT "CleaningTypeConfig_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTypeConfig" ADD CONSTRAINT "CleaningTypeConfig_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTypeConfig" ADD CONSTRAINT "CleaningTypeConfig_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningWeekday" ADD CONSTRAINT "CleaningWeekday_cleaningTypeConfigId_fkey" FOREIGN KEY ("cleaningTypeConfigId") REFERENCES "CleaningTypeConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningDate" ADD CONSTRAINT "CleaningDate_cleaningTypeConfigId_fkey" FOREIGN KEY ("cleaningTypeConfigId") REFERENCES "CleaningTypeConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSector" ADD CONSTRAINT "CleaningSector_cleaningTypeConfigId_fkey" FOREIGN KEY ("cleaningTypeConfigId") REFERENCES "CleaningTypeConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
