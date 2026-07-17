export type PersonListItem = {
	id: string;
	name: string;
	sex: "MALE" | "FEMALE";
	isActive: boolean;
	isStudent: boolean;
	isMarried: boolean;
	spouseId: string | null;
	familyId: string | null;
	spouse: { id: string; name: string; sex: "MALE" | "FEMALE" } | null;
	headedFamily: { id: string; name: string } | null;
	family?: { id: string; name: string } | null;
	baptized: boolean;
	young: boolean;
	initiatingConversations: boolean;
	cultivatingInterest: boolean;
	makingDisciples: boolean;
	explainingBeliefs: boolean;
	cleaning: boolean;
	bibleReading: boolean;
	roamingMic: boolean;
	sound: boolean;
	video: boolean;
	stage: boolean;
	bibleStudyReader: boolean;
	watchtowerReader: boolean;
	attendant: boolean;
	privilegePrayer: boolean;
	user: { id: string } | null;
	servicePrivilege: {
		elder: boolean;
		publicTalk: boolean;
		lifeAndMinistryChairman: boolean;
		weekendChairman: boolean;
		ourChristianLifeAssignment: boolean;
		localNeeds: boolean;
		bibleStudyConductor: boolean;
		watchtowerConductor: boolean;
	} | null;
};

export type FamilyOption = {
	id: string;
	name: string;
};

export type PersonOption = {
	id: string;
	name: string;
	sex: "MALE" | "FEMALE";
	familyId: string | null;
};

export type RenderedPerson = {
	person: PersonListItem;
	groupLabel: string | null;
	isHead: boolean;
	sortKey: string;
};

function normalizeText(value: string) {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

function compareText(a: string, b: string) {
	return normalizeText(a).localeCompare(normalizeText(b), "pt-BR");
}

export function buildRenderedPeople(
	people: PersonListItem[],
): RenderedPerson[] {
	const familyMap = new Map<
		string,
		{
			familyName: string;
			head: PersonListItem | null;
			members: PersonListItem[];
		}
	>();

	const singles: RenderedPerson[] = [];

	for (const person of people) {
		const headedFamily = person.headedFamily;
		const memberFamily = person.family;

		if (headedFamily) {
			const current = familyMap.get(headedFamily.id);

			if (current) {
				current.head = person;
			} else {
				familyMap.set(headedFamily.id, {
					familyName: headedFamily.name,
					head: person,
					members: [],
				});
			}
			continue;
		}

		if (memberFamily) {
			const current = familyMap.get(memberFamily.id);

			if (current) {
				current.members.push(person);
			} else {
				familyMap.set(memberFamily.id, {
					familyName: memberFamily.name,
					head: null,
					members: [person],
				});
			}
			continue;
		}

		singles.push({
			person,
			groupLabel: null,
			isHead: false,
			sortKey: normalizeText(person.name),
		});
	}

	singles.sort((a, b) => compareText(a.person.name, b.person.name));

	const familyGroups = Array.from(familyMap.values()).sort((a, b) =>
		compareText(a.familyName, b.familyName),
	);

	const familyRendered: RenderedPerson[] = [];

	for (const group of familyGroups) {
		if (group.head) {
			familyRendered.push({
				person: group.head,
				groupLabel: group.familyName,
				isHead: true,
				sortKey: normalizeText(group.familyName),
			});
		}

		const sortedMembers = [...group.members].sort((a, b) =>
			compareText(a.name, b.name),
		);

		for (const member of sortedMembers) {
			familyRendered.push({
				person: member,
				groupLabel: group.familyName,
				isHead: false,
				sortKey: normalizeText(group.familyName),
			});
		}
	}

	const merged = [...singles, ...familyRendered];

	merged.sort((a, b) => {
		const byGroup = compareText(a.sortKey, b.sortKey);
		if (byGroup !== 0) return byGroup;

		if (a.groupLabel && b.groupLabel) {
			if (a.isHead !== b.isHead) return a.isHead ? -1 : 1;
			return compareText(a.person.name, b.person.name);
		}

		if (!a.groupLabel && !b.groupLabel) {
			return compareText(a.person.name, b.person.name);
		}

		if (!a.groupLabel && b.groupLabel) {
			return compareText(a.person.name, b.groupLabel);
		}

		if (a.groupLabel && !b.groupLabel) {
			return compareText(a.groupLabel, b.person.name);
		}

		return 0;
	});

	return merged;
}
