"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	HiOutlineArrowRight,
	HiOutlineBuildingOffice2,
	HiOutlineCheckCircle,
	HiOutlineShieldCheck,
} from "react-icons/hi2";

import { authClient } from "@/lib/auth-client";

type OrganizationItem = {
	id: string;
	name: string;
	slug: string;
	role: string;
};

type OrganizationSelectorProps = {
	organizations: OrganizationItem[];
};

export function OrganizationSelector({
	organizations,
}: OrganizationSelectorProps) {
	const router = useRouter();
	const [loadingOrganizationId, setLoadingOrganizationId] = useState<
		string | null
	>(null);

	const handleSelect = async (organization: OrganizationItem) => {
		try {
			setLoadingOrganizationId(organization.id);

			await authClient.organization.setActive({
				organizationId: organization.id,
			});

			router.push(`/org/${organization.slug}`);
			router.refresh();
		} catch (error) {
			console.error("Erro ao definir organização ativa:", error);
			setLoadingOrganizationId(null);
		}
	};

	return (
		<div className="grid gap-4">
			{organizations.map((organization) => {
				const isLoading = loadingOrganizationId === organization.id;

				return (
					<button
						key={organization.id}
						type="button"
						onClick={() => handleSelect(organization)}
						disabled={Boolean(loadingOrganizationId)}
						className="group w-full border border-border bg-card p-5 text-left transition hover:border-primary/20 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
					>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="space-y-3">
								<div className="flex h-11 w-11 items-center justify-center bg-muted text-muted-foreground">
									<HiOutlineBuildingOffice2
										className="h-5 w-5"
										aria-hidden="true"
									/>
								</div>

								<div className="space-y-1">
									<p className="text-title text-foreground">
										{organization.name}
									</p>
									<p className="text-sm text-muted-foreground">
										/org/{organization.slug}
									</p>
								</div>

								<div className="flex flex-wrap gap-2">
									<span className="inline-flex items-center gap-2 border border-border bg-background px-2.5 py-1 text-label text-muted-foreground">
										<HiOutlineShieldCheck
											className="h-4 w-4"
											aria-hidden="true"
										/>
										Papel: {organization.role}
									</span>

									<span className="inline-flex items-center gap-2 border border-border bg-muted px-2.5 py-1 text-label text-muted-foreground">
										<HiOutlineCheckCircle
											className="h-4 w-4"
											aria-hidden="true"
										/>
										Ambiente disponível
									</span>
								</div>
							</div>

							<div className="inline-flex items-center gap-2 self-start text-sm font-medium text-primary sm:self-center">
								{isLoading ? "Entrando..." : "Acessar"}
								<HiOutlineArrowRight
									className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
									aria-hidden="true"
								/>
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}
