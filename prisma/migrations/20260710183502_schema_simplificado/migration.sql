/*
  Warnings:

  - You are about to drop the column `canApplyYourselfParts` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canBibleStudyReader` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canCleaning` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canCultivatingInterest` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canExplainingBeliefs` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canMakingDisciples` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canPrayer` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canPresident` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canPublicTalk` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canReader` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canStartingConversations` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canTalk` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `canWatchtowerReader` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `isBaptized` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `isElder` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `isMinisterialServant` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Person` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssignmentParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Family` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Meeting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MeetingPart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationMember` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[personId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personId` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('USER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_meetingPartId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentParticipant" DROP CONSTRAINT "AssignmentParticipant_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentParticipant" DROP CONSTRAINT "AssignmentParticipant_personId_fkey";

-- DropForeignKey
ALTER TABLE "Family" DROP CONSTRAINT "Family_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingPart" DROP CONSTRAINT "MeetingPart_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Person" DROP CONSTRAINT "Person_familyId_fkey";

-- DropIndex
DROP INDEX "Person_familyId_idx";

-- DropIndex
DROP INDEX "Person_organizationId_lastName_firstName_idx";

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "canApplyYourselfParts",
DROP COLUMN "canBibleStudyReader",
DROP COLUMN "canCleaning",
DROP COLUMN "canCultivatingInterest",
DROP COLUMN "canExplainingBeliefs",
DROP COLUMN "canMakingDisciples",
DROP COLUMN "canPrayer",
DROP COLUMN "canPresident",
DROP COLUMN "canPublicTalk",
DROP COLUMN "canReader",
DROP COLUMN "canStartingConversations",
DROP COLUMN "canTalk",
DROP COLUMN "canWatchtowerReader",
DROP COLUMN "familyId",
DROP COLUMN "firstName",
DROP COLUMN "isBaptized",
DROP COLUMN "isElder",
DROP COLUMN "isMinisterialServant",
DROP COLUMN "lastName",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isStudent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "outlines" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subOrganizationId" TEXT,
ALTER COLUMN "sex" SET DEFAULT 'MALE';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role",
ADD COLUMN     "personId" TEXT NOT NULL,
ADD COLUMN     "systemRole" "SystemRole" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "Assignment";

-- DropTable
DROP TABLE "AssignmentParticipant";

-- DropTable
DROP TABLE "Family";

-- DropTable
DROP TABLE "Meeting";

-- DropTable
DROP TABLE "MeetingPart";

-- DropTable
DROP TABLE "OrganizationMember";

-- DropEnum
DROP TYPE "AssignmentRoleType";

-- DropEnum
DROP TYPE "MeetingPartType";

-- DropEnum
DROP TYPE "MeetingSection";

-- DropEnum
DROP TYPE "MeetingType";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrganization" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_userId_key" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_role_idx" ON "OrganizationMembership"("organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "SubOrganization_organizationId_idx" ON "SubOrganization"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SubOrganization_organizationId_name_key" ON "SubOrganization"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Person_organizationId_name_idx" ON "Person"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Person_subOrganizationId_name_idx" ON "Person"("subOrganizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_personId_key" ON "user"("personId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrganization" ADD CONSTRAINT "SubOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_subOrganizationId_fkey" FOREIGN KEY ("subOrganizationId") REFERENCES "SubOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
