"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
	HiOutlinePencilSquare,
	HiOutlinePrinter,
	HiOutlineTrash,
	HiOutlineUser,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { deleteCleaningListAction } from "@/features/cleaning/actions/delete-cleaning-list-action";
import { getSavedListDetail } from "@/features/cleaning/actions/load-saved-list";
import { DownloadCleaningPdfButton } from "@/features/cleaning/components/export/download-cleaning-pdf-button";
import type { CleaningPageData } from "@/features/cleaning/lib/cleaning-page-data";
import type { SavedListDetailForPdf } from "@/features/cleaning/lib/cleaning-pdf-types";
import type { RosterDraft } from "@/features/cleaning/lib/roster-types";
import { savedListToDraft } from "@/features/cleaning/lib/saved-list-to-draft";
import type { CleaningType } from "@/generated/prisma/client";

type Detail = NonNullable<Awaited<ReturnType<typeof getSavedListDetail>>>;

type Props = {
	data: CleaningPageData;
	/** Só OWNER/ADMIN — shell passa quando canManage */
	onEditList?: (draft: RosterDraft) => void;
};

function formatBr(dateKey: string) {
	const [y, m, d] = dateKey.split("-");
	return `${d}/${m}/${y}`;
}

export function CleaningBoard({ data, onEditList }: Props) {
	const t = useTranslations("CleaningBoard");
	const tTypes = useTranslations("CleaningTypes");
	const tManage = useTranslations("CleaningListManage");
	const router = useRouter();

	const [typeFilter, setTypeFilter] = useState<CleaningType | "ALL">("ALL");
	const [selectedId, setSelectedId] = useState<string | null>(
		data.savedLists[0]?.id ?? null,
	);
	const [detail, setDetail] = useState<Detail | null>(null);
	const [detailForId, setDetailForId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [manageError, setManageError] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [deleting, startDelete] = useTransition();

	const canManage = Boolean(onEditList) && data.canManage;

	const lists = useMemo(() => {
		if (typeFilter === "ALL") return data.savedLists;
		return data.savedLists.filter((l) => l.cleaningType === typeFilter);
	}, [data.savedLists, typeFilter]);

	const effectiveSelectedId = useMemo(() => {
		if (selectedId && lists.some((l) => l.id === selectedId)) return selectedId;
		return lists[0]?.id ?? null;
	}, [lists, selectedId]);

	useEffect(() => {
		if (!effectiveSelectedId) return;
		let cancelled = false;
		startTransition(() => {
			void getSavedListDetail(effectiveSelectedId, data.organizationId).then(
				(d) => {
					if (cancelled) return;
					setDetail(d);
					setDetailForId(effectiveSelectedId);
				},
			);
		});
		return () => {
			cancelled = true;
		};
	}, [effectiveSelectedId, data.organizationId]);

	const shownDetail =
		effectiveSelectedId && detailForId === effectiveSelectedId ? detail : null;

	const pdfList: SavedListDetailForPdf | null = shownDetail
		? {
				id: shownDetail.id,
				cleaningType: shownDetail.cleaningType,
				periodFrom: shownDetail.periodFrom,
				periodTo: shownDetail.periodTo,
				days: shownDetail.days.map((day) => ({
					date: day.date,
					assignments: day.assignments.map((a) => ({
						id: a.id,
						sectorId: a.sectorId,
						sectorName: a.sectorName,
						sectorDescription: a.sectorDescription,
						sortOrder: a.sortOrder ?? 0,
						personId: a.personId,
						personName: a.personName,
						position: a.position,
						isManual: a.isManual,
						familyId: a.familyId,
						groupId: a.groupId,
					})),
				})),
			}
		: null;

	const myAssignments = useMemo(() => {
		if (!shownDetail || !data.currentPersonId) return [];
		const out: Array<{ date: string; sectorName: string }> = [];
		for (const day of shownDetail.days) {
			for (const a of day.assignments) {
				if (a.personId === data.currentPersonId) {
					out.push({ date: day.date, sectorName: a.sectorName });
				}
			}
		}
		return out;
	}, [shownDetail, data.currentPersonId]);

	const handleEdit = () => {
		if (!shownDetail || !onEditList || !pdfList) return;
		const draft = savedListToDraft(pdfList, data.people);
		onEditList(draft);
	};

	const handleDelete = () => {
		if (!effectiveSelectedId) return;
		setManageError(null);
		startDelete(async () => {
			const res = await deleteCleaningListAction({
				organizationSlug: data.organizationSlug,
				listId: effectiveSelectedId,
			});
			if (!res.success) {
				setManageError(res.message);
				return;
			}
			setConfirmDelete(false);
			setSelectedId(null);
			setDetail(null);
			setDetailForId(null);
			router.refresh();
		});
	};

	return (
		<div className="space-y-4">
			{/* filtros — iguais ao seu */}
			<div className="flex flex-wrap gap-2 print:hidden">
				{(["ALL", "MEETING", "WEEKLY", "GENERAL"] as const).map((key) => (
					<button
						key={key}
						type="button"
						onClick={() => setTypeFilter(key)}
						className={`rounded-full px-3 py-1.5 text-xs font-medium ${
							typeFilter === key
								? "bg-blue-600 text-white"
								: "border border-slate-200 dark:border-slate-700"
						}`}
					>
						{key === "ALL" ? t("filterAll") : tTypes(key)}
					</button>
				))}
			</div>

			{lists.length === 0 ? (
				<div className="rounded-[24px] border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
					{t("emptyPublished")}
				</div>
			) : (
				<div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
					{lists.map((l) => {
						const on = l.id === effectiveSelectedId;
						return (
							<button
								key={l.id}
								type="button"
								onClick={() => {
									setSelectedId(l.id);
									setConfirmDelete(false);
									setManageError(null);
								}}
								className={`min-w-35 shrink-0 rounded-[18px] border px-3 py-2 text-left text-xs ${
									on
										? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
										: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
								}`}
							>
								<p className="font-semibold">{tTypes(l.cleaningType)}</p>
								<p className="text-slate-500">
									{formatBr(l.periodFrom)} – {formatBr(l.periodTo)}
								</p>
							</button>
						);
					})}
				</div>
			)}

			{/* minhas designações — igual */}
			{myAssignments.length > 0 ? (
				<section className="rounded-[22px] border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30 print:hidden">
					<div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-900 dark:text-violet-100">
						<HiOutlineUser className="h-4 w-4" />
						{t("myAssignments")}
					</div>
					<ul className="space-y-1 text-sm text-violet-900 dark:text-violet-100">
						{myAssignments.map((a) => (
							<li key={`${a.date}-${a.sectorName}`}>
								{formatBr(a.date)} — {a.sectorName}
							</li>
						))}
					</ul>
				</section>
			) : null}

			<div className="flex flex-wrap justify-end gap-2 print:hidden">
				{canManage && shownDetail ? (
					<>
						<Button
							type="button"
							variant="outline"
							className="h-10 rounded-2xl"
							onClick={handleEdit}
						>
							<HiOutlinePencilSquare className="mr-2 h-4 w-4" />
							{tManage("edit")}
						</Button>
						<Button
							type="button"
							variant="outline"
							className="h-10 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
							onClick={() => setConfirmDelete(true)}
						>
							<HiOutlineTrash className="mr-2 h-4 w-4" />
							{tManage("delete")}
						</Button>
					</>
				) : null}

				<DownloadCleaningPdfButton
					organizationName={data.organizationName}
					savedList={pdfList}
				/>
				<Button
					type="button"
					variant="outline"
					className="h-10 rounded-2xl"
					onClick={() => window.print()}
				>
					<HiOutlinePrinter className="mr-2 h-4 w-4" />
					{t("print")}
				</Button>
			</div>

			{confirmDelete && canManage ? (
				<div
					role="alertdialog"
					aria-labelledby="delete-list-title"
					className="space-y-3 rounded-[22px] border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30 print:hidden"
				>
					<p
						id="delete-list-title"
						className="text-sm font-semibold text-red-900 dark:text-red-100"
					>
						{tManage("deleteConfirmTitle")}
					</p>
					<p className="text-xs text-red-800 dark:text-red-200">
						{tManage("deleteConfirmBody")}
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							className="h-10 rounded-2xl"
							disabled={deleting}
							onClick={() => setConfirmDelete(false)}
						>
							{tManage("cancel")}
						</Button>
						<Button
							type="button"
							disabled={deleting}
							onClick={handleDelete}
							className="h-10 rounded-2xl bg-red-600 text-white hover:bg-red-700"
						>
							{deleting ? tManage("deleting") : tManage("deleteConfirmAction")}
						</Button>
					</div>
				</div>
			) : null}

			{manageError ? (
				<p className="text-sm text-red-600 print:hidden">{manageError}</p>
			) : null}

			{/* resto: loading + days — igual ao seu código atual */}
			{isPending && !shownDetail ? (
				<p className="text-sm text-slate-500">{t("loading")}</p>
			) : shownDetail ? (
				<div className="space-y-3 print:space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-lg font-semibold">
							{tTypes(shownDetail.cleaningType)}
						</h2>
						<StatusBadge label={t("statusPublished")} tone="emerald" />
					</div>

					{shownDetail.days.map((day) => {
						const bySector = new Map<
							string,
							{ name: string; description: string | null; people: string[] }
						>();
						for (const a of day.assignments) {
							const cur = bySector.get(a.sectorId) ?? {
								name: a.sectorName,
								description: a.sectorDescription,
								people: [],
							};
							cur.people.push(a.personName);
							bySector.set(a.sectorId, cur);
						}

						return (
							<article
								key={day.date}
								className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 print:break-inside-avoid print:shadow-none"
							>
								<h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-50">
									{formatBr(day.date)}
								</h3>
								<ul className="space-y-2">
									{[...bySector.entries()].map(([sectorId, s]) => (
										<li
											key={sectorId}
											className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/50"
										>
											<p className="text-sm font-medium">{s.name}</p>
											<p className="text-sm text-blue-700 dark:text-blue-300">
												{s.people.join(" · ")}
											</p>
										</li>
									))}
								</ul>
							</article>
						);
					})}
				</div>
			) : lists.length > 0 ? (
				<p className="text-sm text-slate-500">{t("loading")}</p>
			) : null}
		</div>
	);
}
