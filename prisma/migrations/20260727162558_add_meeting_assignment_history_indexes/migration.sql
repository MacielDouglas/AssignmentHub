-- CreateIndex
CREATE INDEX "meeting_program_assignment_personId_meetingProgramPartId_idx" ON "meeting_program_assignment"("personId", "meetingProgramPartId");

-- CreateIndex
CREATE INDEX "meeting_program_assignment_subPersonId_meetingProgramPartId_idx" ON "meeting_program_assignment"("subPersonId", "meetingProgramPartId");
