-- CreateEnum
CREATE TYPE "MeetingKind" AS ENUM ('MIDWEEK', 'WEEKEND');

-- CreateEnum
CREATE TYPE "MeetingProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "MeetingProgramPartKind" AS ENUM ('MIDWEEK_DAY', 'MIDWEEK_CHAIRMAN', 'MIDWEEK_OPENING_SONG', 'MIDWEEK_INTRODUCTION', 'MIDWEEK_TREASURES_TALK', 'MIDWEEK_SPIRITUAL_GEMS', 'MIDWEEK_BIBLE_READING', 'MIDWEEK_MINISTRY_INITIATING_CONVERSATION', 'MIDWEEK_MINISTRY_CULTIVATING_INTEREST', 'MIDWEEK_MINISTRY_MAKING_DISCIPLES', 'MIDWEEK_MINISTRY_EXPLAINING_BELIEFS', 'MIDWEEK_MINISTRY_TALK', 'MIDWEEK_MIDDLE_SONG', 'MIDWEEK_LIVING_PART', 'MIDWEEK_ORGANIZATION_ACCOMPLISHMENTS', 'MIDWEEK_BIBLE_STUDY', 'MIDWEEK_SERVICE_TALK', 'MIDWEEK_CONCLUSION', 'MIDWEEK_CLOSING_SONG_AND_PRAYER', 'WEEKEND_CHAIRMAN', 'WEEKEND_OPENING_SONG', 'WEEKEND_PUBLIC_TALK', 'WEEKEND_WATCHTOWER_STUDY', 'WEEKEND_CLOSING_SONG_AND_PRAYER', 'WEEKEND_CIRCUIT_OVERSEER_FINAL_TALK');

-- CreateEnum
CREATE TYPE "MeetingProgramSectionCode" AS ENUM ('TREASURES', 'MINISTRY', 'LIVING', 'PUBLIC_TALK', 'WATCHTOWER');

-- CreateEnum
CREATE TYPE "MeetingAssignmentRole" AS ENUM ('PRIMARY', 'ASSISTANT', 'READER', 'CHAIRMAN', 'PRAYER', 'SPEAKER', 'CONDUCTOR');

-- CreateTable
CREATE TABLE "meeting_program" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "kind" "MeetingKind" NOT NULL,
    "status" "MeetingProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceMwbWeekId" TEXT,
    "sourceWatchtowerStudyId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "locale" "ContentLocale" NOT NULL,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "specialEventTitle" TEXT,
    "specialEventDate" DATE,
    "specialEventTime" TEXT,
    "specialEventLocation" TEXT,
    "specialEventNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_program_part" (
    "id" TEXT NOT NULL,
    "meetingProgramId" TEXT NOT NULL,
    "parentPartId" TEXT,
    "kind" "MeetingProgramPartKind" NOT NULL,
    "sectionCode" "MeetingProgramSectionCode",
    "sortOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "durationMin" INTEGER,
    "modality" TEXT,
    "source" TEXT,
    "songNumber" INTEGER,
    "songTitle" TEXT,
    "customTitle" TEXT,
    "sourceMwbPartId" TEXT,
    "publicTalkId" TEXT,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_program_part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_program_assignment" (
    "id" TEXT NOT NULL,
    "meetingProgramPartId" TEXT NOT NULL,
    "role" "MeetingAssignmentRole" NOT NULL DEFAULT 'PRIMARY',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "personId" TEXT,
    "subPersonId" TEXT,
    "assigneeNameSnapshot" TEXT NOT NULL,
    "externalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_program_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_program_organizationId_weekStart_idx" ON "meeting_program"("organizationId", "weekStart");

-- CreateIndex
CREATE INDEX "meeting_program_organizationId_kind_weekStart_idx" ON "meeting_program"("organizationId", "kind", "weekStart");

-- CreateIndex
CREATE INDEX "meeting_program_sourceMwbWeekId_idx" ON "meeting_program"("sourceMwbWeekId");

-- CreateIndex
CREATE INDEX "meeting_program_sourceWatchtowerStudyId_idx" ON "meeting_program"("sourceWatchtowerStudyId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_program_organizationId_weekStart_kind_key" ON "meeting_program"("organizationId", "weekStart", "kind");

-- CreateIndex
CREATE INDEX "meeting_program_part_meetingProgramId_sectionCode_sortOrder_idx" ON "meeting_program_part"("meetingProgramId", "sectionCode", "sortOrder");

-- CreateIndex
CREATE INDEX "meeting_program_part_kind_idx" ON "meeting_program_part"("kind");

-- CreateIndex
CREATE INDEX "meeting_program_part_sourceMwbPartId_idx" ON "meeting_program_part"("sourceMwbPartId");

-- CreateIndex
CREATE INDEX "meeting_program_part_publicTalkId_idx" ON "meeting_program_part"("publicTalkId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_program_part_meetingProgramId_sortOrder_key" ON "meeting_program_part"("meetingProgramId", "sortOrder");

-- CreateIndex
CREATE INDEX "meeting_program_assignment_personId_createdAt_idx" ON "meeting_program_assignment"("personId", "createdAt");

-- CreateIndex
CREATE INDEX "meeting_program_assignment_subPersonId_createdAt_idx" ON "meeting_program_assignment"("subPersonId", "createdAt");

-- CreateIndex
CREATE INDEX "meeting_program_assignment_meetingProgramPartId_role_idx" ON "meeting_program_assignment"("meetingProgramPartId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_program_assignment_meetingProgramPartId_role_sortOr_key" ON "meeting_program_assignment"("meetingProgramPartId", "role", "sortOrder");

-- AddForeignKey
ALTER TABLE "meeting_program" ADD CONSTRAINT "meeting_program_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program" ADD CONSTRAINT "meeting_program_sourceMwbWeekId_fkey" FOREIGN KEY ("sourceMwbWeekId") REFERENCES "mwb_week"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program" ADD CONSTRAINT "meeting_program_sourceWatchtowerStudyId_fkey" FOREIGN KEY ("sourceWatchtowerStudyId") REFERENCES "watchtower_study"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program_part" ADD CONSTRAINT "meeting_program_part_meetingProgramId_fkey" FOREIGN KEY ("meetingProgramId") REFERENCES "meeting_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program_part" ADD CONSTRAINT "meeting_program_part_parentPartId_fkey" FOREIGN KEY ("parentPartId") REFERENCES "meeting_program_part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program_part" ADD CONSTRAINT "meeting_program_part_sourceMwbPartId_fkey" FOREIGN KEY ("sourceMwbPartId") REFERENCES "mwb_part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program_part" ADD CONSTRAINT "meeting_program_part_publicTalkId_fkey" FOREIGN KEY ("publicTalkId") REFERENCES "public_talk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program_assignment" ADD CONSTRAINT "meeting_program_assignment_meetingProgramPartId_fkey" FOREIGN KEY ("meetingProgramPartId") REFERENCES "meeting_program_part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program_assignment" ADD CONSTRAINT "meeting_program_assignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_program_assignment" ADD CONSTRAINT "meeting_program_assignment_subPersonId_fkey" FOREIGN KEY ("subPersonId") REFERENCES "SubPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
