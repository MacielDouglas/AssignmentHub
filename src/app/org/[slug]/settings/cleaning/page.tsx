// src/app/org/[slug]/settings/cleaning/page.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
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

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	return {
		title: `Limpeza | Configurações | ${slug}`,
		description: "Configure modos de designação e setores de limpeza.",
		robots: { index: false, follow: false },
	};
}

export default async function OrganizationCleaningSettingsPage({
	params,
}: Props) {
	const { slug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) notFound();

	const data = await getCleaningSettingsQuery({
		slug,
		userId: session.user.id,
	});
	if (!data) notFound();

	const initialState = mapCleaningSettingsFormInitialState(data);
	const formKey = `${initialState.organizationId}:${initialState.settingsId ?? "new"}`;

	return (
		<main className="space-y-5 pb-8">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href={`/org/${data.organization.slug}/settings`}>
								Configurações
							</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Limpeza</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<CleaningSettingsForm key={formKey} initialState={initialState} />
		</main>
	);
}
