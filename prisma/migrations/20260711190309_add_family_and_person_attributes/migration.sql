-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "attendant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baptized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bibleReading" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bibleStudyReader" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cleaning" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cultivatingInterest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "explainingBeliefs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "familyId" TEXT,
ADD COLUMN     "initiatingConversations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "makingDisciples" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privilegePrayer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roamingMic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sound" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "video" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watchtowerReader" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "young" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePrivilege" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "elder" BOOLEAN NOT NULL DEFAULT false,
    "publicTalk" BOOLEAN NOT NULL DEFAULT false,
    "lifeAndMinistryChairman" BOOLEAN NOT NULL DEFAULT false,
    "weekendChairman" BOOLEAN NOT NULL DEFAULT false,
    "ourChristianLifeAssignment" BOOLEAN NOT NULL DEFAULT false,
    "localNeeds" BOOLEAN NOT NULL DEFAULT false,
    "bibleStudyConductor" BOOLEAN NOT NULL DEFAULT false,
    "watchtowerConductor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePrivilege_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_headId_key" ON "Family"("headId");

-- CreateIndex
CREATE INDEX "Family_organizationId_idx" ON "Family"("organizationId");

-- CreateIndex
CREATE INDEX "Family_headId_idx" ON "Family"("headId");

-- CreateIndex
CREATE UNIQUE INDEX "Family_organizationId_name_key" ON "Family"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrivilege_personId_key" ON "ServicePrivilege"("personId");

-- CreateIndex
CREATE INDEX "Person_familyId_idx" ON "Person"("familyId");

-- CreateIndex
CREATE INDEX "Person_organizationId_familyId_idx" ON "Person"("organizationId", "familyId");

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_headId_fkey" FOREIGN KEY ("headId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePrivilege" ADD CONSTRAINT "ServicePrivilege_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
