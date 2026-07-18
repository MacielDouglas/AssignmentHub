import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { SettingsPageContent } from "@/features/organization-settings/presentation/settings-page-content";
import { getOrganizationSettingsDataQuery } from "@/features/organization-settings/queries/get-organization-settings-data.query";
import { auth } from "@/lib/auth";

type OrganizationSettingsPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export async function generateMetadata({
	params,
}: OrganizationSettingsPageProps): Promise<Metadata> {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			title: "Configurações | AssignmentHub",
			description: "Gerencie os módulos e preferências da organização.",
			robots: {
				index: false,
				follow: false,
			},
		};
	}

	const data = await getOrganizationSettingsDataQuery({
		slug,
		userId: session.user.id,
	});

	if (!data) {
		return {
			title: "Configurações | AssignmentHub",
			description: "Gerencie os módulos e preferências da organização.",
			robots: {
				index: false,
				follow: false,
			},
		};
	}

	const title = `${data.organization.name} | Configurações | AssignmentHub`;
	const description = `Gerencie agenda, limpeza, permissões e preferências da organização ${data.organization.name} no AssignmentHub.`;

	return {
		metadataBase: new URL("https://assignmenthub.app"),
		title,
		description,
		keywords: [
			"AssignmentHub",
			"configurações da organização",
			"agenda da congregação",
			"limpeza",
			"eventos especiais",
			data.organization.name,
			data.organization.slug,
		],
		alternates: {
			canonical: `/org/${data.organization.slug}/settings`,
		},
		openGraph: {
			title,
			description,
			url: `/org/${data.organization.slug}/settings`,
			siteName: "AssignmentHub",
			type: "website",
			locale: "pt_BR",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
		robots: {
			index: false,
			follow: false,
		},
	};
}

export default async function OrganizationSettingsPage({
	params,
}: OrganizationSettingsPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const data = await getOrganizationSettingsDataQuery({
		slug,
		userId: session.user.id,
	});

	if (!data) {
		notFound();
	}

	return <SettingsPageContent data={data} />;
}
