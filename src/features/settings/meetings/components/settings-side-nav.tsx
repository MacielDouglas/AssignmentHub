"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
	SETTINGS_SECTIONS,
	settingsTabPath,
} from "@/features/settings/nav/settings-nav";
import { cn } from "@/lib/utils";

type Props = {
	slug: string;
};

export function SettingsSideNav({ slug }: Props) {
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("tab") ?? "meetings";

	return (
		<nav aria-label="Seções de configuração" className="hidden md:block">
			<ul className="space-y-1">
				{SETTINGS_SECTIONS.map((section) => {
					const href = settingsTabPath(slug, section.id);
					const active = activeTab === section.id;
					const Icon = section.icon;

					return (
						<li key={section.id}>
							<Link
								href={href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex min-h-12 items-center gap-3 rounded-4xl px-3 py-2.5 text-sm font-medium transition-colors",
									"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
									active
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon aria-hidden className="h-5 w-5 shrink-0" />
								<span className="min-w-0">
									<span className="block">{section.label}</span>
									<span
										className={cn(
											"mt-0.5 block text-xs font-normal",
											active
												? "text-primary-foreground/80"
												: "text-muted-foreground",
										)}
									>
										{section.description}
									</span>
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
