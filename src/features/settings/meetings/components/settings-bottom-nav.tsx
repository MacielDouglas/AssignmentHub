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

export function SettingsBottomNav({ slug }: Props) {
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("tab") ?? "meetings";

	return (
		<nav
			aria-label="Seções de configuração"
			className={cn(
				"fixed inset-x-0 bottom-0 z-40 border-t border-border",
				"bg-background/95 backdrop-blur-md",
				"pb-[max(0.5rem,env(safe-area-inset-bottom))]",
				"md:hidden",
			)}
		>
			<ul className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 pt-1">
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
									"flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-4xl px-1 py-2",
									"text-[11px] font-medium leading-none transition-colors",
									"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
									active
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<Icon
									aria-hidden
									className={cn("h-5 w-5", active ? "text-primary" : "")}
								/>
								<span>{section.shortLabel}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
