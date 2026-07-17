/*
  Warnings:

  - A unique constraint covering the columns `[spouseId]` on the table `Person` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "spouseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Person_spouseId_key" ON "Person"("spouseId");

-- CreateIndex
CREATE INDEX "Person_spouseId_idx" ON "Person"("spouseId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_spouseId_fkey" FOREIGN KEY ("spouseId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
