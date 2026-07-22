import { ChevronDown, Search } from "lucide-react";
import { LogoutButton } from "../auth/logout-button";
import { LocaleSwitcher } from "../locale-switcher";

type OrganizationOption = {
	id: string;
	name: string;
	slug: string;
};

type CurrentOrganization = {
	id: string;
	name: string;
	slug: string;
};

type OrgHeaderProps = {
	currentOrganization: CurrentOrganization;
	organizations: OrganizationOption[];
	userName: string;
	userEmail?: string | null;
};

export function OrgHeader({
	currentOrganization,
	userName,
	userEmail,
}: OrgHeaderProps) {
	return (
		<header className="hidden border-b bg-background/95 px-6 py-4 backdrop-blur lg:block">
			<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
					<div className="rounded-lg border px-3 py-2">
						<p className="text-xs text-muted-foreground">Organização atual</p>
						<div className="flex items-center gap-2">
							<span className="font-medium">{currentOrganization.name}</span>
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						</div>
					</div>

					<div className="relative min-w-65 max-w-md flex-1">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<input
							placeholder="Buscar dentro do app..."
							className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
						/>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div className="rounded-lg border px-3 py-2 text-sm">
						<p className="font-medium">{userName}</p>
						<p className="text-xs text-muted-foreground">
							{userEmail ?? "Sem e-mail"}
						</p>
					</div>

					<LocaleSwitcher variant="buttons" className="flex gap-1" />

					<LogoutButton />
				</div>
			</div>
		</header>
	);
}
