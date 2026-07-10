"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	HiOutlineBuildingOffice2,
	HiOutlineChevronDown,
} from "react-icons/hi2";

import { authClient } from "@/lib/auth-client";

type OrganizationItem = {
	id: string;
	name: string;
	slug: string;
	role: string;
};

type OrgSwitcherProps = {
	currentOrganization: OrganizationItem;
	organizations: OrganizationItem[];
};

export function OrgSwitcher({
	currentOrganization,
	organizations,
}: OrgSwitcherProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleChangeOrganization = async (organization: OrganizationItem) => {
		try {
			setPendingId(organization.id);
			setErrorMessage(null);

			await authClient.organization.setActive({
				organizationId: organization.id,
			});

			router.push(`/org/${organization.slug}`);
			router.refresh();
			setOpen(false);
		} catch {
			setPendingId(null);
			setErrorMessage("Não foi possível trocar de organização agora.");
		}
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="inline-flex min-h-11 max-w-full items-center gap-3 border border-border bg-card px-4 py-2 text-left hover:bg-muted"
			>
				<span className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-50 text-blue-600">
					<HiOutlineBuildingOffice2 className="h-5 w-5" aria-hidden="true" />
				</span>

				<span className="min-w-0">
					<span className="block truncate text-sm font-medium text-foreground">
						{currentOrganization.name}
					</span>
					<span className="block truncate text-xs text-muted-foreground">
						Organização ativa
					</span>
				</span>

				<HiOutlineChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
			</button>

			{open ? (
				<div className="absolute left-0 top-full z-20 mt-2 min-w-70 max-w-[90vw] border border-border bg-background shadow-sm">
					<div className="border-b border-border px-4 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
							Trocar organização
						</p>
					</div>

					<div className="p-2">
						{organizations.map((organization) => {
							const isCurrent = organization.id === currentOrganization.id;
							const isPending = pendingId === organization.id;

							return (
								<button
									key={organization.id}
									type="button"
									onClick={() => handleChangeOrganization(organization)}
									disabled={isCurrent || Boolean(pendingId)}
									className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{organization.name}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{isCurrent ? "Organização atual" : organization.role}
										</p>
									</div>

									<span className="shrink-0 text-xs font-medium text-blue-700">
										{isPending
											? "Entrando..."
											: isCurrent
												? "Atual"
												: "Acessar"}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			) : null}

			{errorMessage ? (
				<p className="mt-2 text-sm text-destructive" role="alert">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}
