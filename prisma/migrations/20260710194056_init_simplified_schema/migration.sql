/*
  Warnings:

  - You are about to drop the column `outlines` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `subOrganizationId` on the `Person` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Person" DROP CONSTRAINT "Person_subOrganizationId_fkey";

-- DropIndex
DROP INDEX "Person_subOrganizationId_name_idx";

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "outlines",
DROP COLUMN "subOrganizationId",
ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Outline" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubPerson" (
    "id" TEXT NOT NULL,
    "subOrganizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sex" "Sex" NOT NULL DEFAULT 'MALE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OutlineToSubPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OutlineToSubPerson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OutlineToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OutlineToPerson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Outline_number_key" ON "Outline"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Outline_name_key" ON "Outline"("name");

-- CreateIndex
CREATE INDEX "SubPerson_subOrganizationId_name_idx" ON "SubPerson"("subOrganizationId", "name");

-- CreateIndex
CREATE INDEX "_OutlineToSubPerson_B_index" ON "_OutlineToSubPerson"("B");

-- CreateIndex
CREATE INDEX "_OutlineToPerson_B_index" ON "_OutlineToPerson"("B");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "account_providerId_idx" ON "account"("providerId");

-- AddForeignKey
ALTER TABLE "SubPerson" ADD CONSTRAINT "SubPerson_subOrganizationId_fkey" FOREIGN KEY ("subOrganizationId") REFERENCES "SubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OutlineToSubPerson" ADD CONSTRAINT "_OutlineToSubPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Outline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OutlineToSubPerson" ADD CONSTRAINT "_OutlineToSubPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "SubPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OutlineToPerson" ADD CONSTRAINT "_OutlineToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Outline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OutlineToPerson" ADD CONSTRAINT "_OutlineToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
