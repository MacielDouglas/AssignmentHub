-- Setores de servico das reunioes (indicadores, microfones, som, video, palco)
CREATE TABLE "meeting_duty_settings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "indicatorActive" BOOLEAN NOT NULL DEFAULT false,
  "indicatorCount" INTEGER NOT NULL DEFAULT 2,
  "indicatorSectors" TEXT[] NOT NULL DEFAULT '{}',
  "micActive" BOOLEAN NOT NULL DEFAULT false,
  "micCount" INTEGER NOT NULL DEFAULT 2,
  "soundActive" BOOLEAN NOT NULL DEFAULT false,
  "videoActive" BOOLEAN NOT NULL DEFAULT false,
  "stageActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "meeting_duty_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_duty_settings_organizationId_key" ON "meeting_duty_settings"("organizationId");

ALTER TABLE "meeting_duty_settings" ADD CONSTRAINT "meeting_duty_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
