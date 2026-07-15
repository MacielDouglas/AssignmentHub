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
			title: "Configurações",
		};
	}

	const data = await getOrganizationSettingsDataQuery({
		slug,
		userId: session.user.id,
	});

	if (!data) {
		return {
			title: "Configurações",
		};
	}

	return {
		title: `${data.organization.name} | Configurações`,
		description: `Configurações da organização ${data.organization.name}.`,
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
