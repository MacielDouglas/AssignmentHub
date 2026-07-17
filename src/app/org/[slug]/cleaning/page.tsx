import { ClipboardList, Sparkles } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CleaningGenerateTab } from "@/features/cleaning-list/components/cleaning-generate-tab";
import { CleaningSavedListTab } from "@/features/cleaning-list/components/cleaning-saved-list-tab";
import { getCleaningPageDataQuery } from "@/features/cleaning-list/queries/get-cleaning-page-data.query";
import { auth } from "@/lib/auth";

type Props = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function CleaningPage({ params }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		notFound();
	}

	const { slug } = await params;

	const data = await getCleaningPageDataQuery({
		slug,
		userId: session.user.id,
	});

	if (!data) {
		notFound();
	}

	return (
		<main className="space-y-6">
			<section className="overflow-hidden rounded-[28px] border bg-linear-to-br from-muted/70 via-background to-background p-6 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
							<Sparkles className="size-3.5" />
							Organização preparada para designação automática
						</div>

						<div className="space-y-1">
							<h1 className="text-2xl font-semibold tracking-tight">
								Escalas de limpeza
							</h1>
							<p className="max-w-2xl text-sm text-muted-foreground">
								Gere listas automaticamente, revise os nomes e salve a tabela
								por período para a congregação.
							</p>
						</div>
					</div>

					<div className="rounded-2xl border bg-background/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
						<p className="font-medium">{data.organization.name}</p>
						<p className="text-muted-foreground">
							Gerencie as designações de limpeza com histórico e rotação.
						</p>
					</div>
				</div>
			</section>

			<section className="rounded-[28px] border bg-background p-4 shadow-sm md:p-6">
				<Tabs defaultValue="generate" className="space-y-6">
					<TabsList className="inline-flex rounded-2xl bg-muted p-1">
						<TabsTrigger value="saved" className="rounded-xl">
							<ClipboardList className="mr-2 size-4" />
							Tabela designada
						</TabsTrigger>
						<TabsTrigger value="generate" className="rounded-xl">
							<Sparkles className="mr-2 size-4" />
							Fazer designação
						</TabsTrigger>
					</TabsList>

					<TabsContent value="saved" className="mt-0">
						<CleaningSavedListTab data={data} />
					</TabsContent>

					<TabsContent value="generate" className="mt-0">
						<CleaningGenerateTab data={data} />
					</TabsContent>
				</Tabs>
			</section>
		</main>
	);
}
