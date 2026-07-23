"use client";

import { useTranslations } from "next-intl";
import { HiOutlineBookOpen } from "react-icons/hi2";
import type {
	ContentImportJobEntity,
	WatchtowerStudyEntity,
} from "@/features/meeting-content/domain/entities/watchtower-study";

import { WatchtowerImportForm } from "./watchtower-import-form";
import { WatchtowerReviewTable } from "./watchtower-review-table";
import { WatchtowerStudiesTable } from "./watchtower-studies-table";

type Props = {
	slug: string;
	canManage: boolean;
	studies: WatchtowerStudyEntity[];
	counts: { locale: "pt" | "es"; count: number }[];
	pendingJob: ContentImportJobEntity | null;
};

export function WatchtowerSection({
	slug,
	canManage,
	studies,
	pendingJob,
}: Props) {
	const t = useTranslations("meetingContent.watchtower");

	return (
		<div className="space-y-6">
			<header className="overflow-hidden rounded-[32px] bg-linear-to-br from-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-600/20">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
						<HiOutlineBookOpen className="h-6 w-6" />
					</div>
					<div>
						<h1 className="text-xl font-semibold tracking-tight">
							{t("heroTitle")}
						</h1>
						<p className="mt-1 max-w-2xl text-sm text-white/85">
							{t("heroDescription")}
						</p>
					</div>
				</div>
			</header>

			{canManage ? <WatchtowerImportForm slug={slug} disabled={false} /> : null}

			{canManage && pendingJob?.status === "AWAITING_REVIEW" ? (
				<WatchtowerReviewTable slug={slug} job={pendingJob} />
			) : null}

			{canManage && pendingJob?.status === "FAILED" ? (
				<div
					className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
					role="alert"
				>
					<p className="font-semibold">{t("failedTitle")}</p>
					<p className="mt-1">{pendingJob.errorMessage}</p>
				</div>
			) : null}

			<WatchtowerStudiesTable
				slug={slug}
				canManage={canManage}
				studies={studies}
			/>
		</div>
	);
}
