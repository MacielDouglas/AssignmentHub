-- Backfill dos programas de fim de semana gerados no formato antigo:
-- 1) presidente sem duracao (nao exibe horario)
-- 2) estudo de A Sentinela com 60min
-- 3) Tanner do superintendente 40 -> 35 (abre espaco para o cantico do meio)
-- 4) insere o cantico do meio (primeiro cantico da Sentinela) onde ainda nao existe

UPDATE "meeting_program_part"
SET "durationMin" = NULL
WHERE "kind" = 'WEEKEND_CHAIRMAN'
  AND "durationMin" IS NOT NULL;

UPDATE "meeting_program_part"
SET "durationMin" = 60
WHERE "kind" = 'WEEKEND_WATCHTOWER_STUDY'
  AND "durationMin" = 30;

UPDATE "meeting_program_part"
SET "sortOrder" = 35
WHERE "kind" = 'WEEKEND_CIRCUIT_OVERSEER_FINAL_TALK'
  AND "sortOrder" = 40;

INSERT INTO "meeting_program_part" (
  "id",
  "meetingProgramId",
  "kind",
  "sectionCode",
  "sortOrder",
  "title",
  "durationMin",
  "songNumber",
  "songTitle",
  "isDisabled",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  mp."id",
  'WEEKEND_WATCHTOWER_OPENING_SONG',
  'WATCHTOWER',
  40,
  CASE
    WHEN ws."openingSongNum" IS NULL THEN 'Cântico para o estudo'
    WHEN s."title" IS NULL THEN 'Cântico ' || ws."openingSongNum"
    ELSE 'Cântico ' || ws."openingSongNum" || ' — ' || s."title"
  END,
  5,
  ws."openingSongNum",
  s."title",
  mp."isCancelled",
  NOW(),
  NOW()
FROM "meeting_program" mp
JOIN "watchtower_study" ws ON ws."id" = mp."sourceWatchtowerStudyId"
LEFT JOIN "song" s ON s."id" = ws."openingSongId"
WHERE mp."kind" = 'WEEKEND'
  AND NOT EXISTS (
    SELECT 1
    FROM "meeting_program_part" existing
    WHERE existing."meetingProgramId" = mp."id"
      AND existing."kind" = 'WEEKEND_WATCHTOWER_OPENING_SONG'
  );
