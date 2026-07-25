export type PublicTalkHistoryListItemDto = {
	id: string;
	publicTalkId: string;
	organizationId: string;
	performedAt: Date;
	speakerNameSnapshot: string;
	notes: string | null;
	speakerPersonId: string | null;
	speakerSubPersonId: string | null;
	speakerPerson: { id: string; name: string } | null;
	speakerSubPerson: {
		id: string;
		name: string;
		subOrganizationName: string;
	} | null;
	createdAt: Date;
	updatedAt: Date;
};

export type RegisterPublicTalkHistoryInput = {
	organizationId: string;
	publicTalkId: string;
	performedAt: Date;
	notes?: string | null;
	speakerPersonId?: string | null;
	speakerSubPersonId?: string | null;
};

export type DeletePublicTalkHistoryInput = {
	id: string;
	organizationId: string;
};
