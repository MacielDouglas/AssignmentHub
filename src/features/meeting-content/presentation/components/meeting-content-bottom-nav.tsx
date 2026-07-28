"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	HiOutlineBookOpen,
	HiOutlineCalendarDays,
	HiOutlineMicrophone,
	HiOutlineMusicalNote,
} from "react-icons/hi2";

import { cn } from "@/lib/utils";

import {
	MEETING_CONTENT_SECTIONS,
	type MeetingContentSectionId,
	meetingContentSectionPath,
} from "../nav/meeting-content-nav";

const ICONS: Record<
	MeetingContentSectionId,
	React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
	apostila: HiOutlineCalendarDays,
	sentinela: HiOutlineBookOpen,
	canticos: HiOutlineMusicalNote,
	discursos: HiOutlineMicrophone,
};

type Props = {
	slug: string;
};

export function MeetingContentBottomNav({ slug }: Props) {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Seções do conteúdo das reuniões"
			className={cn(
				"fixed inset-x-0 bottom-0 z-40 border-t border-border",
				"bg-background/95 backdrop-blur-md",
				"pb-[max(0.5rem,env(safe-area-inset-bottom))]",
				"md:hidden",
			)}
		>
			<ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-1">
				{MEETING_CONTENT_SECTIONS.map((section) => {
					const href = meetingContentSectionPath(slug, section.href);
					const active = pathname === href || pathname.startsWith(`${href}/`);
					const Icon = ICONS[section.id];

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
