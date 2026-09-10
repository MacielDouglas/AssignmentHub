import type { MeetingProgramDto } from "@/features/meetings/domain/meeting-types";
import type {
	DutyConflictRole,
	DutyKeyPerson,
	DutyKeyRole,
	DutyMeetingKind,
	DutyPersonConflict,
} from "./duty-types";

export type DutyConflicts = {
	excludedAll: Set<string>;
	excludedMic: Set<string>;
	keyPeople: DutyKeyPerson[];
	conflictRoles: DutyPersonConflict[];
};

export function collectDutyConflicts(
	program: MeetingProgramDto,
	kind: DutyMeetingKind,
): DutyConflicts {
	const excludedAll = new Set<string>();
	const excludedMic = new Set<string>();
	const keyPeople: DutyKeyPerson[] = [];
	const conflictRoles: DutyPersonConflict[] = [];
	const conflicted = new Set<string>();

	function addKeyPerson(role: DutyKeyRole, name: string | null | undefined) {
		const clean = name?.replace(/\s+/g, " ").trim();

		if (clean) {
			keyPeople.push({ role, name: clean });
		}
	}

	function addConflict(personId: string | null, role: DutyConflictRole) {
		if (personId && !conflicted.has(personId)) {
			conflicted.add(personId);
			conflictRoles.push({ personId, role });
		}
	}

	for (const part of program.parts) {
		for (const assignment of part.assignments) {
			if (kind === "MIDWEEK") {
				if (
					part.kind === "MIDWEEK_CHAIRMAN" &&
					assignment.role === "CHAIRMAN"
				) {
					if (assignment.personId) {
						excludedAll.add(assignment.personId);
					}

					addKeyPerson("chairman", assignment.assigneeName);
					addConflict(assignment.personId, "chairman");
				} else if (
					part.kind === "MIDWEEK_SPIRITUAL_GEMS" &&
					assignment.role === "PRIMARY"
				) {
					if (assignment.personId) {
						excludedMic.add(assignment.personId);
					}

					addConflict(assignment.personId, "spiritualGems");
				} else if (part.kind === "MIDWEEK_BIBLE_STUDY") {
					if (assignment.role === "CONDUCTOR") {
						if (assignment.personId) {
							excludedMic.add(assignment.personId);
						}

						addKeyPerson("bibleConductor", assignment.assigneeName);
						addConflict(assignment.personId, "bibleConductor");
					}

					if (assignment.role === "READER") {
						if (assignment.personId) {
							excludedMic.add(assignment.personId);
						}

						addKeyPerson("bibleReader", assignment.assigneeName);
						addConflict(assignment.personId, "bibleReader");
					}
				}
			} else {
				if (part.kind === "WEEKEND_WATCHTOWER_STUDY") {
					if (assignment.role === "CONDUCTOR") {
						if (assignment.personId) {
							excludedAll.add(assignment.personId);
						}

						addKeyPerson("watchtowerConductor", assignment.assigneeName);
						addConflict(assignment.personId, "watchtowerConductor");
					}

					if (assignment.role === "READER") {
						if (assignment.personId) {
							excludedMic.add(assignment.personId);
						}

						addKeyPerson("watchtowerReader", assignment.assigneeName);
						addConflict(assignment.personId, "watchtowerReader");
					}
				}
			}
		}
	}

	return { excludedAll, excludedMic, keyPeople, conflictRoles };
}
