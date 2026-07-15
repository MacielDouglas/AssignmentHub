import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CleaningSettingsForm } from "@/features/cleaning/components/cleaning-settings-form";
import { mapCleaningSettingsFormInitialState } from "@/features/cleaning/lib/map-cleaning-settings-form-initial-state";
import { getCleaningSettingsQuery } from "@/features/cleaning/queries/get-cleaning-settings.query";
import { auth } from "@/lib/auth";

type OrganizationCleaningSettingsPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export async function generateMetadata({
	params,
}: OrganizationCleaningSettingsPageProps): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | Configurações de limpeza`,
		description: "Gerencie as configurações globais do módulo de limpeza.",
	};
}

export default async function OrganizationCleaningSettingsPage({
	params,
}: OrganizationCleaningSettingsPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const data = await getCleaningSettingsQuery({
		slug,
		userId: session.user.id,
	});

	if (!data) {
		notFound();
	}

	const initialState = mapCleaningSettingsFormInitialState(data);
	const formKey = `${initialState.organizationId}:${initialState.settingsId ?? "new"}`;

	return (
		<div className="space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href={`/org/${data.organization.slug}/settings`}>
							Configurações
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Limpeza</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<CleaningSettingsForm key={formKey} initialState={initialState} />
		</div>
	);
}
