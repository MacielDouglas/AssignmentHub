import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { OrgNavLinks } from "./org-nav-links";

type OrgSidebarProps = {
	currentSlug: string;
	organizationName: string;
};

const navItems = [
	{
		href: "",
		label: "Visão geral",
		iconName: "dashboard",
	},
	{
		href: "/tasks",
		label: "Tarefas",
		iconName: "tasks",
	},
	{
		href: "/meetings",
		label: "Reuniões",
		iconName: "meetings",
	},
	{
		href: "/assignments",
		label: "Designações",
		iconName: "assignments",
	},
	{
		href: "/people",
		label: "Pessoas",
		iconName: "people",
	},
] as const;

export function OrgSidebar({ currentSlug, organizationName }: OrgSidebarProps) {
	return (
		<aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
			<div className="border-b border-border px-6 py-5">
				<div className="flex items-center gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-none bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-sm">
						<HiOutlineSquares2X2 className="h-5 w-5" aria-hidden="true" />
					</div>

					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-foreground">
							AssignmentHub
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{organizationName}
						</p>
					</div>
				</div>
			</div>

			<nav className="flex-1 px-4 py-4" aria-label="Navegação da organização">
				<OrgNavLinks currentSlug={currentSlug} items={[...navItems]} />
			</nav>
		</aside>
	);
}
