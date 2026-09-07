-- Opção B: tabelas dedicadas de eventos especiais + WeeklyRule.kind + AssignmentSettings
-- Legado OrganizationSchedule/Occurrence mantido em paralelo (leitura dupla, Fase 4)

-- 1) WeeklyRule.kind (meio x fim de semana, explícito)
-- Tabela física sem @@map: nome quoted mixed-case.
ALTER TABLE "OrganizationScheduleWeeklyRule" ADD COLUMN "kind" TEXT;
-- Backfill: sortOrder 0 → MIDWEEK, 1 → WEEKEND (convenção atual do save-weekly action)
UPDATE "OrganizationScheduleWeeklyRule" SET "kind" = 'MIDWEEK' WHERE "sortOrder" = 0 AND "kind" IS NULL;
UPDATE "OrganizationScheduleWeeklyRule" SET "kind" = 'WEEKEND' WHERE "sortOrder" = 1 AND "kind" IS NULL;
CREATE UNIQUE INDEX "organization_schedule_weekly_rule_scheduleId_kind_key" ON "OrganizationScheduleWeeklyRule"("organizationScheduleId", "kind");

-- 2) Celebration (1x/ano, data+hora obrigatórios)
CREATE TABLE "celebration" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "time" TEXT NOT NULL,
  "location" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "celebration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "celebration_organizationId_year_key" ON "celebration"("organizationId", "year");
CREATE INDEX "celebration_organizationId_date_idx" ON "celebration"("organizationId", "date");
ALTER TABLE "celebration" ADD CONSTRAINT "celebration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) CircuitOverseerVisit (nome + período obrigatórios)
CREATE TABLE "circuit_overseer_visit" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "travelerName" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "circuit_overseer_visit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "circuit_overseer_visit_organizationId_startDate_idx" ON "circuit_overseer_visit"("organizationId", "startDate");
ALTER TABLE "circuit_overseer_visit" ADD CONSTRAINT "circuit_overseer_visit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4) SpecialMeeting (data obrigatória; hora opcional, sem "dia inteiro")
CREATE TABLE "special_meeting" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "time" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "special_meeting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "special_meeting_organizationId_date_idx" ON "special_meeting"("organizationId", "date");
ALTER TABLE "special_meeting" ADD CONSTRAINT "special_meeting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) SpecialTalk (data obrigatória; tema + orador opcionais, FK + texto livre)
CREATE TABLE "special_talk" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "theme" TEXT,
  "speakerPersonId" TEXT,
  "speakerName" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "special_talk_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "special_talk_organizationId_date_idx" ON "special_talk"("organizationId", "date");
CREATE INDEX "special_talk_speakerPersonId_idx" ON "special_talk"("speakerPersonId");
ALTER TABLE "special_talk" ADD CONSTRAINT "special_talk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "special_talk" ADD CONSTRAINT "special_talk_speakerPersonId_fkey" FOREIGN KEY ("speakerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6) Convention (1x/ano, período + local obrigatórios)
CREATE TABLE "convention" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "location" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "convention_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "convention_organizationId_year_key" ON "convention"("organizationId", "year");
CREATE INDEX "convention_organizationId_startDate_idx" ON "convention"("organizationId", "startDate");
ALTER TABLE "convention" ADD CONSTRAINT "convention_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7) CircuitAssemblyOverseer (data + local obrigatórios)
CREATE TABLE "circuit_assembly_overseer" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "location" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "circuit_assembly_overseer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "circuit_assembly_overseer_organizationId_date_idx" ON "circuit_assembly_overseer"("organizationId", "date");
ALTER TABLE "circuit_assembly_overseer" ADD CONSTRAINT "circuit_assembly_overseer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8) CircuitAssemblyBranchRep (data + local obrigatórios)
CREATE TABLE "circuit_assembly_branch_rep" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "location" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "circuit_assembly_branch_rep_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "circuit_assembly_branch_rep_organizationId_date_idx" ON "circuit_assembly_branch_rep"("organizationId", "date");
ALTER TABLE "circuit_assembly_branch_rep" ADD CONSTRAINT "circuit_assembly_branch_rep_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9) AssignmentSettings + regras de elegibilidade
CREATE TABLE "assignment_settings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "rotationMode" TEXT NOT NULL DEFAULT 'LEAST_LOAD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assignment_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assignment_settings_organizationId_key" ON "assignment_settings"("organizationId");
ALTER TABLE "assignment_settings" ADD CONSTRAINT "assignment_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "assignment_eligibility_rule" (
  "id" TEXT NOT NULL,
  "settingsId" TEXT NOT NULL,
  "partKind" TEXT NOT NULL,
  "requiredSex" TEXT,
  "baptizedOnly" BOOLEAN NOT NULL DEFAULT false,
  "allowYoung" BOOLEAN NOT NULL DEFAULT true,
  "minPrivilege" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assignment_eligibility_rule_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assignment_eligibility_rule_settingsId_partKind_key" ON "assignment_eligibility_rule"("settingsId", "partKind");
CREATE INDEX "assignment_eligibility_rule_settingsId_idx" ON "assignment_eligibility_rule"("settingsId");
ALTER TABLE "assignment_eligibility_rule" ADD CONSTRAINT "assignment_eligibility_rule_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "assignment_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
