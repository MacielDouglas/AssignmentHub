"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

type OrgNavLinksProps = {
	currentSlug: string;
	items: NavItem[];
};

export function OrgNavLinks({ currentSlug, items }: OrgNavLinksProps) {
	const pathname = usePathname();

	return (
		<ul className="space-y-1">
			{items.map((item) => {
				const href = `/org/${currentSlug}${item.href}`;
				const isActive = pathname === href;
				const Icon = item.icon;

				return (
					<li key={item.label}>
						<Link
							href={href}
							className={cn(
								"flex items-center gap-3 border px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "border-blue-100 bg-blue-50 text-blue-700"
									: "border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
							)}
						>
							<Icon className="h-5 w-5" aria-hidden={true} />
							{item.label}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
