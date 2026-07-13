-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isMarried" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "superintendentId" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Group_organizationId_idx" ON "Group"("organizationId");

-- CreateIndex
CREATE INDEX "Group_organizationId_name_idx" ON "Group"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Group_organizationId_slug_idx" ON "Group"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Group_superintendentId_idx" ON "Group"("superintendentId");

-- CreateIndex
CREATE INDEX "Group_assistantId_idx" ON "Group"("assistantId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_organizationId_name_key" ON "Group"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Group_organizationId_slug_key" ON "Group"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "Person_groupId_idx" ON "Person"("groupId");

-- CreateIndex
CREATE INDEX "Person_organizationId_groupId_idx" ON "Person"("organizationId", "groupId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_superintendentId_fkey" FOREIGN KEY ("superintendentId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
