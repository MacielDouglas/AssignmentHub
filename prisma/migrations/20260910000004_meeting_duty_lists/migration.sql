-- Programas salvos de designacoes de reuniao
CREATE TYPE "MeetingDutySector" AS ENUM ('INDICATOR', 'MIC', 'SOUND', 'VIDEO', 'STAGE');

CREATE TABLE "meeting_duty_list" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "periodFrom" DATE NOT NULL,
  "periodTo" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "meeting_duty_list_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meeting_duty_date" (
  "id" TEXT NOT NULL,
  "listId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "meetingKind" "MeetingKind" NOT NULL,

  CONSTRAINT "meeting_duty_date_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meeting_duty_assignment" (
  "id" TEXT NOT NULL,
  "dutyDateId" TEXT NOT NULL,
  "sector" "MeetingDutySector" NOT NULL,
  "postLabel" TEXT NOT NULL DEFAULT '',
  "position" INTEGER NOT NULL DEFAULT 0,
  "personId" TEXT,
  "isManual" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "meeting_duty_assignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "meeting_duty_list_organizationId_periodFrom_idx" ON "meeting_duty_list"("organizationId", "periodFrom");

CREATE UNIQUE INDEX "meeting_duty_date_listId_date_meetingKind_key" ON "meeting_duty_date"("listId", "date", "meetingKind");
CREATE INDEX "meeting_duty_date_listId_date_idx" ON "meeting_duty_date"("listId", "date");

CREATE UNIQUE INDEX "meeting_duty_assignment_dutyDateId_sector_postLabel_position_key" ON "meeting_duty_assignment"("dutyDateId", "sector", "postLabel", "position");
CREATE INDEX "meeting_duty_assignment_dutyDateId_idx" ON "meeting_duty_assignment"("dutyDateId");
CREATE INDEX "meeting_duty_assignment_personId_idx" ON "meeting_duty_assignment"("personId");

ALTER TABLE "meeting_duty_list" ADD CONSTRAINT "meeting_duty_list_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_duty_date" ADD CONSTRAINT "meeting_duty_date_listId_fkey" FOREIGN KEY ("listId") REFERENCES "meeting_duty_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_duty_assignment" ADD CONSTRAINT "meeting_duty_assignment_dutyDateId_fkey" FOREIGN KEY ("dutyDateId") REFERENCES "meeting_duty_date"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_duty_assignment" ADD CONSTRAINT "meeting_duty_assignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
