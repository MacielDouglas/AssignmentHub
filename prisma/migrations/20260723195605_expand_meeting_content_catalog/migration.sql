-- CreateEnum
CREATE TYPE "MwbSectionCode" AS ENUM ('TREASURES', 'APPLY', 'LIVING');

-- CreateTable
CREATE TABLE "public_talk" (
    "id" TEXT NOT NULL,
    "locale" "ContentLocale" NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_talk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mwb_issue" (
    "id" TEXT NOT NULL,
    "locale" "ContentLocale" NOT NULL,
    "symbol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverTitle" TEXT,
    "year" INTEGER,
    "month" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mwb_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mwb_week" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "weekLabelRaw" TEXT,
    "dateRangeRaw" TEXT,
    "openingSongNum" INTEGER,
    "middleSongNum" INTEGER,
    "closingSongNum" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "openingSongId" TEXT,
    "middleSongId" TEXT,
    "closingSongId" TEXT,

    CONSTRAINT "mwb_week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mwb_section" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" "MwbSectionCode",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mwb_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mwb_part" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "durationMin" INTEGER,
    "modality" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mwb_part_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "public_talk_locale_idx" ON "public_talk"("locale");

-- CreateIndex
CREATE INDEX "public_talk_locale_number_idx" ON "public_talk"("locale", "number");

-- CreateIndex
CREATE UNIQUE INDEX "public_talk_number_locale_key" ON "public_talk"("number", "locale");

-- CreateIndex
CREATE INDEX "mwb_issue_locale_year_month_idx" ON "mwb_issue"("locale", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "mwb_issue_symbol_locale_key" ON "mwb_issue"("symbol", "locale");

-- CreateIndex
CREATE INDEX "mwb_week_weekStart_weekEnd_idx" ON "mwb_week"("weekStart", "weekEnd");

-- CreateIndex
CREATE UNIQUE INDEX "mwb_week_issueId_weekStart_key" ON "mwb_week"("issueId", "weekStart");

-- CreateIndex
CREATE INDEX "mwb_section_weekId_code_idx" ON "mwb_section"("weekId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "mwb_section_weekId_sortOrder_key" ON "mwb_section"("weekId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "mwb_part_sectionId_sortOrder_key" ON "mwb_part"("sectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "mwb_week" ADD CONSTRAINT "mwb_week_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "mwb_issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwb_week" ADD CONSTRAINT "mwb_week_openingSongId_fkey" FOREIGN KEY ("openingSongId") REFERENCES "song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwb_week" ADD CONSTRAINT "mwb_week_middleSongId_fkey" FOREIGN KEY ("middleSongId") REFERENCES "song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwb_week" ADD CONSTRAINT "mwb_week_closingSongId_fkey" FOREIGN KEY ("closingSongId") REFERENCES "song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwb_section" ADD CONSTRAINT "mwb_section_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "mwb_week"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mwb_part" ADD CONSTRAINT "mwb_part_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "mwb_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
