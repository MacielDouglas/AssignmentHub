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
				"fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80",
				"bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95",
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
									"flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2",
									"text-[11px] font-medium leading-none transition-colors",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
									active
										? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
										: "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
								)}
							>
								<Icon
									aria-hidden
									className={cn(
										"h-5 w-5",
										active ? "text-blue-600 dark:text-blue-300" : "",
									)}
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
