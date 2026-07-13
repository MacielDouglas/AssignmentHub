"use client";

import {
	Building2,
	FolderKanban,
	Home,
	ScrollText,
	Users,
	UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type OrgNavProps = {
	organizationSlug: string;
};

const navItems = (organizationSlug: string) => [
	{
		href: `/org/${organizationSlug}`,
		label: "Visão geral",
		icon: Home,
		exact: true,
	},
	{
		href: `/org/${organizationSlug}/people`,
		label: "Pessoas",
		icon: Users,
	},
	{
		href: `/org/${organizationSlug}/groups`,
		label: "Grupos",
		icon: FolderKanban,
	},
	{
		href: `/org/${organizationSlug}/families`,
		label: "Famílias",
		icon: UsersRound,
	},
	{
		href: `/org/${organizationSlug}/outlines`,
		label: "Discursos",
		icon: ScrollText,
	},
	{
		href: `/org/${organizationSlug}/settings`,
		label: "Configurações",
		icon: Building2,
	},
];

export function OrgNav({ organizationSlug }: OrgNavProps) {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Navegação contextual da organização"
			className="flex flex-wrap gap-2"
		>
			{navItems(organizationSlug).map((item) => {
				const Icon = item.icon;
				const isActive = item.exact
					? pathname === item.href
					: pathname === item.href || pathname.startsWith(`${item.href}/`);

				return (
					<Link
						key={item.href}
						href={item.href}
						className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
							isActive
								? "border-foreground bg-foreground text-background"
								: "hover:bg-muted"
						}`}
					>
						<Icon className="h-4 w-4" />
						<span>{item.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}
