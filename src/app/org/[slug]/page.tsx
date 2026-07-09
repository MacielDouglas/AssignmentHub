import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type OrganizationPageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function OrganizationPage({
	params,
}: OrganizationPageProps) {
	const { slug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/");
	}

	const membership = await db.organizationMember.findFirst({
		where: {
			userId: session.user.id,
			organization: {
				slug,
			},
		},
		select: {
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
				},
			},
		},
	});

	if (!membership?.organization) {
		notFound();
	}

	return (
		<main className="bg-background">
			<section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10 sm:px-6 lg:px-8">
				<div className="space-y-3">
					<p className="text-sm font-medium text-muted-foreground">
						Organização ativa
					</p>
					<h1 className="text-3xl font-semibold tracking-tight text-foreground">
						{membership.organization.name}
					</h1>
					<p className="max-w-2xl text-base leading-7 text-muted-foreground">
						O redirecionamento está funcionando corretamente. O próximo passo é
						construir o dashboard da organização.
					</p>
				</div>
			</section>
		</main>
	);
}
