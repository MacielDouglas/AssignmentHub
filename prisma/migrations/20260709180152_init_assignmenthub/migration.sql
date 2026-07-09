-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('WEEKEND', 'MIDWEEK');

-- CreateEnum
CREATE TYPE "MeetingSection" AS ENUM ('WEEKEND_MAIN', 'TREASURES', 'APPLY_YOURSELF', 'CHRISTIAN_LIFE', 'CLEANING', 'FINAL_PRAYER');

-- CreateEnum
CREATE TYPE "MeetingPartType" AS ENUM ('WEEKEND_PRESIDENT', 'WEEKEND_SPEAKER', 'WEEKEND_CHAIRMAN', 'WEEKEND_READER', 'TREASURES_TALK', 'TREASURES_GEMS', 'TREASURES_BIBLE_READING', 'APPLY_STARTING_CONVERSATIONS', 'APPLY_CULTIVATING_INTEREST', 'APPLY_MAKING_DISCIPLES', 'APPLY_EXPLAINING_BELIEFS', 'APPLY_TALK', 'CHRISTIAN_LIFE_PART', 'CONGREGATION_BIBLE_STUDY', 'FINAL_PRAYER', 'CLEANING_MALE_BATHROOM', 'CLEANING_FEMALE_BATHROOM', 'CLEANING_ACCESSIBLE_BATHROOM', 'CLEANING_SWEEP_FLOOR', 'CLEANING_WASH_CLOTHS', 'CLEANING_TAKE_OUT_TRASH');

-- CreateEnum
CREATE TYPE "AssignmentRoleType" AS ENUM ('ASSIGNEE', 'STUDENT', 'ASSISTANT', 'CHAIRMAN', 'READER', 'PRESIDENT', 'SPEAKER');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "familyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "isBaptized" BOOLEAN NOT NULL DEFAULT false,
    "canStartingConversations" BOOLEAN NOT NULL DEFAULT false,
    "canCultivatingInterest" BOOLEAN NOT NULL DEFAULT false,
    "canMakingDisciples" BOOLEAN NOT NULL DEFAULT false,
    "canExplainingBeliefs" BOOLEAN NOT NULL DEFAULT false,
    "canCleaning" BOOLEAN NOT NULL DEFAULT false,
    "isElder" BOOLEAN NOT NULL DEFAULT false,
    "isMinisterialServant" BOOLEAN NOT NULL DEFAULT false,
    "canReader" BOOLEAN NOT NULL DEFAULT false,
    "canTalk" BOOLEAN NOT NULL DEFAULT false,
    "canPrayer" BOOLEAN NOT NULL DEFAULT false,
    "canPresident" BOOLEAN NOT NULL DEFAULT false,
    "canWatchtowerReader" BOOLEAN NOT NULL DEFAULT false,
    "canBibleStudyReader" BOOLEAN NOT NULL DEFAULT false,
    "canPublicTalk" BOOLEAN NOT NULL DEFAULT false,
    "canApplyYourselfParts" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "weekKey" TEXT NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingPart" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "section" "MeetingSection" NOT NULL,
    "type" "MeetingPartType" NOT NULL,
    "title" TEXT,
    "sequence" INTEGER NOT NULL,
    "isTalkFormat" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "meetingPartId" TEXT NOT NULL,
    "label" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentParticipant" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "roleType" "AssignmentRoleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Family_organizationId_name_key" ON "Family"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Person_organizationId_lastName_firstName_idx" ON "Person"("organizationId", "lastName", "firstName");

-- CreateIndex
CREATE INDEX "Person_familyId_idx" ON "Person"("familyId");

-- CreateIndex
CREATE INDEX "Meeting_organizationId_weekKey_idx" ON "Meeting"("organizationId", "weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_organizationId_type_meetingDate_key" ON "Meeting"("organizationId", "type", "meetingDate");

-- CreateIndex
CREATE INDEX "MeetingPart_meetingId_section_sequence_idx" ON "MeetingPart"("meetingId", "section", "sequence");

-- CreateIndex
CREATE INDEX "Assignment_meetingPartId_sequence_idx" ON "Assignment"("meetingPartId", "sequence");

-- CreateIndex
CREATE INDEX "AssignmentParticipant_personId_idx" ON "AssignmentParticipant"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentParticipant_assignmentId_roleType_personId_key" ON "AssignmentParticipant"("assignmentId", "roleType", "personId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Family" ADD CONSTRAINT "Family_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingPart" ADD CONSTRAINT "MeetingPart_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_meetingPartId_fkey" FOREIGN KEY ("meetingPartId") REFERENCES "MeetingPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentParticipant" ADD CONSTRAINT "AssignmentParticipant_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentParticipant" ADD CONSTRAINT "AssignmentParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
