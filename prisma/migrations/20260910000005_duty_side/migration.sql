-- Lado do indicador (externo/interno) nas designacoes de reuniao
CREATE TYPE "MeetingDutySide" AS ENUM ('EXTERNO', 'INTERNO');

ALTER TABLE "meeting_duty_assignment" ADD COLUMN "side" "MeetingDutySide";
