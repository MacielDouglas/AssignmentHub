import { db } from "@/lib/db";
import { mergePublicTalksByPrecedence } from "../infrastructure/prisma/public-talk-prisma-repository";

export type PublicTalksSectionData = {
	talks: Array<{
		id: string;
		organizationId: string | null;
		scope: "GLOBAL" | "LOCAL";
		locale: "pt" | "es";
		number: number;
		title: string;
		notes: string | null;
		createdAt: Date;
		updatedAt: Date;
		latestHistory: Array<{
			id: string;
			performedAt: Date;
			speakerNameSnapshot: string;
			notes: string | null;
			speakerPersonId: string | null;
			speakerSubPersonId: string | null;
			speakerPerson: { id: string; name: string } | null;
			speakerSubPerson: {
				id: string;
				name: string;
				subOrganization: { name: string };
			} | null;
		}>;
		_count: {
			histories: number;
		};
	}>;
	eligibleSpeakers: Array<
		| {
				kind: "PERSON";
				id: string;
				name: string;
		  }
		| {
				kind: "SUB_PERSON";
				id: string;
				name: string;
				subOrganizationId: string;
				subOrganizationName: string;
		  }
	>;
};

export async function getPublicTalksSectionData(params: {
	organizationId: string;
	locale?: "pt" | "es";
	search?: string;
}): Promise<PublicTalksSectionData> {
	const search = params.search?.trim();

	const [rawTalks, people, subPeople] = await Promise.all([
		db.publicTalk.findMany({
			where: {
				AND: [
					{
						OR: [
							{ organizationId: null },
							{ organizationId: params.organizationId },
						],
					},
					...(params.locale ? [{ locale: params.locale }] : []),
					...(search
						? [
								{
									OR: [
										{
											title: {
												contains: search,
												mode: "insensitive" as const,
											},
										},
										...(Number.isFinite(Number(search))
											? [{ number: Number(search) }]
											: []),
									],
								},
							]
						: []),
				],
			},
			orderBy: [{ locale: "asc" }, { number: "asc" }],
			include: {
				_count: {
					select: {
						histories: {
							where: { organizationId: params.organizationId },
						},
					},
				},
				histories: {
					where: { organizationId: params.organizationId },
					orderBy: [{ performedAt: "desc" }, { createdAt: "desc" }],
					take: 10,
					select: {
						id: true,
						performedAt: true,
						speakerNameSnapshot: true,
						notes: true,
						speakerPersonId: true,
						speakerSubPersonId: true,
						speakerPerson: {
							select: { id: true, name: true },
						},
						speakerSubPerson: {
							select: {
								id: true,
								name: true,
								subOrganization: { select: { name: true } },
							},
						},
					},
				},
			},
			take: 400,
		}),
		db.person.findMany({
			where: {
				organizationId: params.organizationId,
				isActive: true,
				servicePrivilege: { is: { publicTalk: true } },
			},
			orderBy: [{ name: "asc" }],
			select: { id: true, name: true },
		}),
		db.subPerson.findMany({
			where: {
				isActive: true,
				publicTalk: true,
				subOrganization: {
					organizationId: params.organizationId,
				},
			},
			orderBy: [{ name: "asc" }],
			select: {
				id: true,
				name: true,
				subOrganizationId: true,
				subOrganization: { select: { name: true } },
			},
		}),
	]);

	const mapped = rawTalks.map((talk) => ({
		id: talk.id,
		organizationId: talk.organizationId,
		scope:
			talk.organizationId === null ? ("GLOBAL" as const) : ("LOCAL" as const),
		locale: talk.locale,
		number: talk.number,
		title: talk.title,
		notes: talk.notes,
		createdAt: talk.createdAt,
		updatedAt: talk.updatedAt,
		latestHistory: talk.histories,
		_count: { histories: talk._count.histories },
	}));

	// Reutiliza a mesma regra de precedência (só campos de catálogo)
	const catalogOnly = mergePublicTalksByPrecedence(
		mapped.map((t) => ({
			id: t.id,
			organizationId: t.organizationId,
			scope: t.scope,
			locale: t.locale,
			number: t.number,
			title: t.title,
			notes: t.notes,
			createdAt: t.createdAt,
			updatedAt: t.updatedAt,
		})),
	);

	const byId = new Map(mapped.map((t) => [t.id, t]));
	const talks = catalogOnly
		.map((c) => byId.get(c.id))
		.filter((t): t is (typeof mapped)[number] => Boolean(t));

	return {
		talks,
		eligibleSpeakers: [
			...people.map((person) => ({
				kind: "PERSON" as const,
				id: person.id,
				name: person.name,
			})),
			...subPeople.map((subPerson) => ({
				kind: "SUB_PERSON" as const,
				id: subPerson.id,
				name: subPerson.name,
				subOrganizationId: subPerson.subOrganizationId,
				subOrganizationName: subPerson.subOrganization.name,
			})),
		],
	};
}
