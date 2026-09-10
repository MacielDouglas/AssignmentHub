"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { deleteDutyDateAction } from "../../actions/delete-duty-date-action";
import { deleteDutyListAction } from "../../actions/delete-duty-list-action";
import {
	type DutyListDetail,
	getDutyListDetailAction,
	listDutyListsAction,
} from "../../actions/load-duty-lists";
import type { DutyPerson, DutyRosterDraft } from "../../lib/duty-types";
import type { DutiesPageData } from "../../lib/load-duties-page";
import { DownloadDutyPdfButton } from "../export/download-duty-pdf-button";

function formatDateLabel(iso: string): string {
	const [year, month, day] = iso.split("-");

	return `${day}/${month}/${year}`;
}

export function DutiesBoard({
	slug,
	organizationName,
	people,
	canManage,
	initialLists,
	onEdit,
}: {
	slug: string;
	organizationName: string;
	people: DutyPerson[];
	canManage: boolean;
	initialLists: DutiesPageData["savedLists"];
	onEdit: (draft: DutyRosterDraft) => void;
}) {
	const t = useTranslations("Duties");
	const tMeetings = useTranslations("Meetings");
	const [lists, setLists] =
		useState<DutiesPageData["savedLists"]>(initialLists);
	const [selectedId, setSelectedId] = useState<string | null>(
		initialLists[0]?.id ?? null,
	);
	const [detail, setDetail] = useState<DutyListDetail | null>(null);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [confirmingDateKey, setConfirmingDateKey] = useState<string | null>(
		null,
	);

	useEffect(() => {
		startTransition(async () => {
			const result = await listDutyListsAction({ slug });

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setLists(result.lists);
			setSelectedId((current) => {
				if (current && result.lists.some((list) => list.id === current)) {
					return current;
				}

				return result.lists[0]?.id ?? null;
			});
		});
	}, [slug]);

	useEffect(() => {
		if (!selectedId) {
			setDetail(null);
			return;
		}

		startTransition(async () => {
			const result = await getDutyListDetailAction({
				slug,
				listId: selectedId,
			});

			if (!result.ok) {
				setError(result.error);
				setDetail(null);
				return;
			}

			setError(null);
			setDetail(result.detail);
		});
	}, [slug, selectedId]);

	function handleEdit() {
		if (!detail) {
			return;
		}

		onEdit({
			periodFrom: detail.periodFrom,
			periodTo: detail.periodTo,
			listId: detail.id,
			meetings: detail.meetings,
			people,
		});
	}

	function handleDelete() {
		if (!selectedId) {
			return;
		}

		if (!confirmingDelete) {
			setConfirmingDelete(true);
			return;
		}

		startTransition(async () => {
			const result = await deleteDutyListAction({ slug, listId: selectedId });

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setConfirmingDelete(false);
			setSelectedId(null);
			setDetail(null);

			const reloaded = await listDutyListsAction({ slug });

			if (reloaded.ok) {
				setLists(reloaded.lists);
				setSelectedId(reloaded.lists[0]?.id ?? null);
			}
		});
	}

	async function reloadDetail(listId: string) {
		const result = await getDutyListDetailAction({ slug, listId });

		if (!result.ok) {
			setError(result.error);
			setDetail(null);
			return;
		}

		setDetail(result.detail);
	}

	function handleDeleteDate(date: string, kind: "MIDWEEK" | "WEEKEND") {
		if (!selectedId) {
			return;
		}

		const dateKey = `${date}:${kind}`;

		if (confirmingDateKey !== dateKey) {
			setConfirmingDateKey(dateKey);
			return;
		}

		startTransition(async () => {
			const result = await deleteDutyDateAction({
				slug,
				listId: selectedId,
				date,
				kind,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setConfirmingDateKey(null);
			setError(null);
			await reloadDetail(selectedId);

			const reloaded = await listDutyListsAction({ slug });

			if (reloaded.ok) {
				setLists(reloaded.lists);

				if (!reloaded.lists.some((list) => list.id === selectedId)) {
					setSelectedId(reloaded.lists[0]?.id ?? null);
				}
			}
		});
	}

	return (
		<section className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
			<header className="space-y-1">
				<h2 className="text-headline text-foreground">{t("boardTitle")}</h2>
			</header>

			{lists.length === 0 ? (
				<p className="text-sm text-muted-foreground">{t("noLists")}</p>
			) : (
				<div className="space-y-1.5">
					<label
						htmlFor="duty-list-select"
						className="text-sm font-medium text-foreground"
					>
						{t("selectProgram")}
					</label>
					<select
						id="duty-list-select"
						value={selectedId ?? ""}
						onChange={(event) => {
							setSelectedId(event.target.value || null);
							setConfirmingDelete(false);
							setConfirmingDateKey(null);
						}}
						className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm sm:max-w-md"
					>
						{lists.map((list) => (
							<option key={list.id} value={list.id}>
								{formatDateLabel(list.periodFrom)} —{" "}
								{formatDateLabel(list.periodTo)} ({list.meetingsCount})
							</option>
						))}
					</select>
				</div>
			)}

			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}

			{detail ? (
				<div className="space-y-3">
					{canManage ? (
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								disabled={pending}
								onClick={handleEdit}
								className="h-11 rounded-4xl"
							>
								{t("edit")}
							</Button>

							<Button
								type="button"
								variant={confirmingDelete ? "destructive" : "outline"}
								disabled={pending}
								onClick={handleDelete}
								className="h-11 rounded-4xl"
							>
								{confirmingDelete ? t("confirmDelete") : t("delete")}
							</Button>

							<DownloadDutyPdfButton
								organizationName={organizationName}
								periodFrom={detail.periodFrom}
								periodTo={detail.periodTo}
								meetings={detail.meetings}
							/>
						</div>
					) : (
						<div className="flex flex-wrap gap-2">
							<DownloadDutyPdfButton
								organizationName={organizationName}
								periodFrom={detail.periodFrom}
								periodTo={detail.periodTo}
								meetings={detail.meetings}
							/>
						</div>
					)}

					{detail.meetings.map((meeting) => (
						<article
							key={`${meeting.date}-${meeting.kind}`}
							className="space-y-1.5 rounded-3xl border border-border p-4"
						>
							<div className="flex items-start justify-between gap-2">
								<h3 className="text-sm font-semibold text-foreground">
									{formatDateLabel(meeting.date)} ·{" "}
									{meeting.kind === "MIDWEEK"
										? tMeetings("midweek")
										: tMeetings("weekend")}
								</h3>

								{canManage ? (
									<button
										type="button"
										onClick={() => handleDeleteDate(meeting.date, meeting.kind)}
										disabled={pending}
										className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-50 ${
											confirmingDateKey === `${meeting.date}:${meeting.kind}`
												? "bg-destructive/10 text-destructive"
												: "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										}`}
										aria-label={t("removeMeeting")}
									>
										<HiOutlineTrash className="h-4 w-4" />
										{confirmingDateKey === `${meeting.date}:${meeting.kind}`
											? t("confirmRemove")
											: null}
									</button>
								) : null}
							</div>

							<ul className="space-y-1">
								{meeting.slots.map((slot) => (
									<li
										key={slot.key}
										className="flex items-center justify-between gap-3 text-sm"
									>
										<span className="text-muted-foreground">
											{t(`sector.${slot.sector}`)}
											{slot.postLabel ? ` · ${slot.postLabel}` : null}
											{slot.sector === "indicator"
												? ` · ${t(slot.side === "interno" ? "sideInterno" : "sideExterno")}`
												: null}
										</span>
										<span className="text-right font-medium text-foreground">
											{slot.personName || t("vacant")}
										</span>
									</li>
								))}
							</ul>
						</article>
					))}
				</div>
			) : null}
		</section>
	);
}
