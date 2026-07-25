import type { ContentLocale } from "@/features/meeting-content/domain/values-objects/content-locale";

export type CatalogScope = "GLOBAL" | "LOCAL";

export type PublicTalkListItemDto = {
	id: string;
	organizationId: string | null;
	scope: CatalogScope;
	locale: ContentLocale;
	number: number;
	title: string;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type CreatePublicTalkInput = {
	organizationId: string | null;
	locale: ContentLocale;
	number: number;
	title: string;
	notes?: string | null;
};

export type UpdatePublicTalkInput = {
	id: string;
	organizationId: string | null;
	locale: ContentLocale;
	number: number;
	title: string;
	notes?: string | null;
};

export type ListPublicTalksInput = {
	organizationId: string;
	locale?: ContentLocale;
	search?: string;
	take?: number;
};

export type DeletePublicTalksInput = {
	ids: string[];
	actorOrganizationId: string | null;
	isSuperAdmin: boolean;
};
