-- AlterTable
ALTER TABLE "PublicTalkHistory" ADD COLUMN     "speakerSubPersonId" TEXT;

-- CreateIndex
CREATE INDEX "PublicTalkHistory_speakerSubPersonId_idx" ON "PublicTalkHistory"("speakerSubPersonId");

-- AddForeignKey
ALTER TABLE "PublicTalkHistory" ADD CONSTRAINT "PublicTalkHistory_speakerSubPersonId_fkey" FOREIGN KEY ("speakerSubPersonId") REFERENCES "SubPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
