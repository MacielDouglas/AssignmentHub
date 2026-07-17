import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ScheduleSettingsForm } from "@/features/schedule/components/schedule-settings-form";
import { mapScheduleSettingsFormInitialState } from "@/features/schedule/lib/map-schedule-settings-form-initial-state";
import { getScheduleSettingsQuery } from "@/features/schedule/queries/get-schedule-settings.query";
import { auth } from "@/lib/auth";

type OrganizationScheduleSettingsPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export async function generateMetadata({
	params,
}: OrganizationScheduleSettingsPageProps): Promise<Metadata> {
	const { slug } = await params;

	return {
		title: `${slug} | Configurações de datas`,
		description: "Gerencie reuniões, limpezas e eventos especiais.",
	};
}

export default async function OrganizationScheduleSettingsPage({
	params,
}: OrganizationScheduleSettingsPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const data = await getScheduleSettingsQuery({
		slug,
		userId: session.user.id,
	});

	if (!data) {
		notFound();
	}

	const initialState = mapScheduleSettingsFormInitialState(data);
	const formKey = `${initialState.organizationId}:${initialState.items.length}`;

	return (
		<div className="space-y-6">
			<ScheduleSettingsForm key={formKey} initialState={initialState} />
		</div>
	);
}
