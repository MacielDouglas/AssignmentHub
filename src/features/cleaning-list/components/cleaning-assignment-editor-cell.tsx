"use client";

import type {
	CleaningCandidatePerson,
	CleaningGeneratedAssignmentCell,
} from "../domain/cleaning-list.types";
import { PersonMultiSelect } from "./person-multi-select";

type Props = {
	cell: CleaningGeneratedAssignmentCell;
	allPeople: CleaningCandidatePerson[];
	usedPersonIds: string[];
	onChange: (next: CleaningGeneratedAssignmentCell) => void;
};

export function CleaningAssignmentEditorCell({
	cell,
	allPeople,
	usedPersonIds,
	onChange,
}: Props) {
	const options = allPeople
		.filter((person) => {
			if (cell.assigned.some((assigned) => assigned.personId === person.id)) {
				return true;
			}

			return !usedPersonIds.includes(person.id);
		})
		.map((person) => ({
			value: person.id,
			label: person.name,
		}));

	return (
		<PersonMultiSelect
			options={options}
			value={cell.assigned.map((item) => item.personId)}
			onChange={(personIds) => {
				const assigned = personIds
					.map((personId, position) => {
						const person = allPeople.find((entry) => entry.id === personId);

						if (!person) {
							return null;
						}

						return {
							personId: person.id,
							personName: person.name,
							familyId: person.familyId,
							familyName: person.familyName,
							groupId: person.groupId,
							groupName: person.groupName,
							position,
						};
					})
					.filter(
						(value): value is NonNullable<typeof value> => value !== null,
					);

				onChange({
					...cell,
					assigned,
				});
			}}
		/>
	);
}
