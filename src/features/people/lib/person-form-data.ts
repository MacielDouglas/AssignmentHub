const getString = (formData: FormData, key: string) => {
	const value = formData.get(key);
	return typeof value === "string" ? value : "";
};

const getOptionalString = (formData: FormData, key: string) => {
	const value = getString(formData, key).trim();
	return value.length > 0 ? value : undefined;
};

const getBoolean = (formData: FormData, key: string) =>
	getString(formData, key) === "true";

export function parsePersonFormData(formData: FormData) {
	return {
		slug: getString(formData, "slug"),
		personId: getOptionalString(formData, "personId"),
		name: getString(formData, "name"),
		sex: getString(formData, "sex"),
		isActive: getBoolean(formData, "isActive"),
		isStudent: getBoolean(formData, "isStudent"),

		isFamilyHead: getBoolean(formData, "isFamilyHead"),
		familyName: getOptionalString(formData, "familyName"),
		familyId: getOptionalString(formData, "familyId"),

		headRemovalAction: getOptionalString(formData, "headRemovalAction"),
		newHeadPersonId: getOptionalString(formData, "newHeadPersonId"),

		baptized: getBoolean(formData, "baptized"),
		young: getBoolean(formData, "young"),
		isMarried: getBoolean(formData, "isMarried"),

		initiatingConversations: getBoolean(formData, "initiatingConversations"),
		cultivatingInterest: getBoolean(formData, "cultivatingInterest"),
		makingDisciples: getBoolean(formData, "makingDisciples"),
		explainingBeliefs: getBoolean(formData, "explainingBeliefs"),
		cleaning: getBoolean(formData, "cleaning"),
		privilegePrayer: getBoolean(formData, "privilegePrayer"),

		bibleReading: getBoolean(formData, "bibleReading"),
		roamingMic: getBoolean(formData, "roamingMic"),
		sound: getBoolean(formData, "sound"),
		video: getBoolean(formData, "video"),
		stage: getBoolean(formData, "stage"),
		bibleStudyReader: getBoolean(formData, "bibleStudyReader"),
		watchtowerReader: getBoolean(formData, "watchtowerReader"),
		attendant: getBoolean(formData, "attendant"),

		elder: getBoolean(formData, "elder"),
		publicTalk: getBoolean(formData, "publicTalk"),
		lifeAndMinistryChairman: getBoolean(formData, "lifeAndMinistryChairman"),
		weekendChairman: getBoolean(formData, "weekendChairman"),
		ourChristianLifeAssignment: getBoolean(
			formData,
			"ourChristianLifeAssignment",
		),
		localNeeds: getBoolean(formData, "localNeeds"),
		bibleStudyConductor: getBoolean(formData, "bibleStudyConductor"),
		watchtowerConductor: getBoolean(formData, "watchtowerConductor"),
	};
}
