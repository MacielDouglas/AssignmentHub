import { HiOutlineBell, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { OrgSwitcher } from "./org-switcher";

type OrganizationItem = {
	id: string;
	name: string;
	slug: string;
	role: string;
};

type OrgHeaderProps = {
	currentOrganization: OrganizationItem;
	organizations: OrganizationItem[];
	userName: string;
	userEmail?: string | null;
};

export function OrgHeader({
	currentOrganization,
	organizations,
	userName,
	userEmail,
}: OrgHeaderProps) {
	return (
		<header className="border-b border-border bg-background">
			<div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<OrgSwitcher
						currentOrganization={currentOrganization}
						organizations={organizations}
					/>

					<div className="hidden h-8 w-px bg-border lg:block" />

					<div>
						<p className="text-sm font-medium text-foreground">
							Painel da organização
						</p>
						<p className="text-xs text-muted-foreground">
							Coordenação de tarefas, reuniões e designações
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
						aria-label="Pesquisar"
					>
						<HiOutlineMagnifyingGlass className="h-5 w-5" />
					</button>

					<button
						type="button"
						className="inline-flex h-10 w-10 items-center justify-center rounded-none border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
						aria-label="Notificações"
					>
						<HiOutlineBell className="h-5 w-5" />
					</button>

					<div className="min-w-0 border border-border bg-card px-3 py-2">
						<p className="truncate text-sm font-medium text-foreground">
							{userName}
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{userEmail}
						</p>
					</div>
				</div>
			</div>
		</header>
	);
}
