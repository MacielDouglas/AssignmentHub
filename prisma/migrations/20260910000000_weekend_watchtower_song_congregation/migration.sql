-- Weekend meeting: middle song part + speaker congregation
ALTER TYPE "MeetingProgramPartKind" ADD VALUE 'WEEKEND_WATCHTOWER_OPENING_SONG';

ALTER TABLE "meeting_program_assignment" ADD COLUMN "externalCongregation" TEXT;
