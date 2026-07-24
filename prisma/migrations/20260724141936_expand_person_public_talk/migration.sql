/*
  Warnings:

  - You are about to drop the `public_talk` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public_talk";

-- CreateTable
CREATE TABLE "PublicTalk" (
    "id" TEXT NOT NULL,
    "locale" "ContentLocale" NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicTalk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicTalkHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicTalkId" TEXT NOT NULL,
    "speakerPersonId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "speakerNameSnapshot" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicTalkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicTalk_locale_number_idx" ON "PublicTalk"("locale", "number");

-- CreateIndex
CREATE INDEX "PublicTalk_locale_title_idx" ON "PublicTalk"("locale", "title");

-- CreateIndex
CREATE UNIQUE INDEX "PublicTalk_locale_number_key" ON "PublicTalk"("locale", "number");

-- CreateIndex
CREATE INDEX "PublicTalkHistory_organizationId_performedAt_idx" ON "PublicTalkHistory"("organizationId", "performedAt");

-- CreateIndex
CREATE INDEX "PublicTalkHistory_organizationId_publicTalkId_performedAt_idx" ON "PublicTalkHistory"("organizationId", "publicTalkId", "performedAt");

-- CreateIndex
CREATE INDEX "PublicTalkHistory_speakerPersonId_idx" ON "PublicTalkHistory"("speakerPersonId");

-- AddForeignKey
ALTER TABLE "PublicTalkHistory" ADD CONSTRAINT "PublicTalkHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicTalkHistory" ADD CONSTRAINT "PublicTalkHistory_publicTalkId_fkey" FOREIGN KEY ("publicTalkId") REFERENCES "PublicTalk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicTalkHistory" ADD CONSTRAINT "PublicTalkHistory_speakerPersonId_fkey" FOREIGN KEY ("speakerPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
