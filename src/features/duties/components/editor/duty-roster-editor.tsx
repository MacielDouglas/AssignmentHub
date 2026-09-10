"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveDutyListAction } from "../../actions/save-duty-list-action";
import type {
	DutyConflictRole,
	DutyMeetingDraft,
	DutyPerson,
	DutyRosterDraft,
	DutySectorKey,
} from "../../lib/duty-types";
import { DownloadDutyPdfButton } from "../export/download-duty-pdf-button";

function formatDateLabel(iso: string): string {
	const [year, month, day] = iso.split("-");

	return `${day}/${month}/${year}`;
}

function meetingKey(meeting: DutyMeetingDraft): string {
	return `${meeting.date}:${meeting.kind}`;
}

type CandidateMarker =
	| { kind: "used" }
	| { kind: "conflict"; role: DutyConflictRole };

function candidatesForSlot(
	people: DutyPerson[],
	sector: DutySectorKey,
	meeting: DutyMeetingDraft,
	currentPersonId: string | null,
): Array<DutyPerson & { markers: CandidateMarker[] }> {
	const usedInMeeting = new Set(
		meeting.slots.flatMap((slot) =>
			slot.personId && slot.personId !== currentPersonId ? [slot.personId] : [],
		),
	);
	const conflictRole = new Map(
		meeting.conflictRoles.map((conflict) => [conflict.personId, conflict.role]),
	);

	return people
		.filter((person) => person.id === currentPersonId || person[sector])
		.map((person) => {
			const markers: CandidateMarker[] = [];

			if (usedInMeeting.has(person.id)) {
				markers.push({ kind: "used" });
			}

			const role = conflictRole.get(person.id);

			if (
				role &&
				(meeting.excludedAll.includes(person.id) ||
					(sector === "mic" && meeting.excludedMic.includes(person.id)))
			) {
				markers.push({ kind: "conflict", role });
			}

			return { ...person, markers };
		});
}

function MeetingCard({
	meeting,
	people,
	onSelect,
	onRemove,
}: {
	meeting: DutyMeetingDraft;
	people: DutyPerson[];
	onSelect: (slotKey: string, personId: string | null) => void;
	onRemove: () => void;
}) {
	const t = useTranslations("Duties");
	const tMeetings = useTranslations("Meetings");

	return (
		<article className="space-y-2 rounded-3xl border border-border p-4">
			<div className="flex items-start justify-between gap-2">
				<h3 className="text-sm font-semibold text-foreground">
					{formatDateLabel(meeting.date)} ·{" "}
					{meeting.kind === "MIDWEEK"
						? tMeetings("midweek")
						: tMeetings("weekend")}{" "}
					· {t(`weekday.${weekdayOf(meeting.date)}`)}
				</h3>

				<button
					type="button"
					onClick={onRemove}
					className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
					aria-label={t("removeMeeting")}
				>
					<HiOutlineTrash className="h-4 w-4" />
				</button>
			</div>

			{meeting.keyPeople.length > 0 ? (
				<p className="text-xs text-muted-foreground">
					{meeting.keyPeople.map((keyPerson, index) => (
						<span key={`${keyPerson.role}-${keyPerson.name}`}>
							{index > 0 ? " · " : null}
							{t(`role.${keyPerson.role}`)}:{" "}
							<span className="font-medium text-red-600">{keyPerson.name}</span>
						</span>
					))}
				</p>
			) : null}

			<div className="space-y-2">
				{meeting.slots.map((slot) => {
					const candidates = candidatesForSlot(
						people,
						slot.sector,
						meeting,
						slot.personId,
					);

					return (
						<div
							key={slot.key}
							className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
						>
							<Label className="min-w-0 flex-1 text-sm">
								<span className="font-medium">
									{t(`sector.${slot.sector}`)}
								</span>
								{slot.postLabel ? (
									<span className="text-muted-foreground">
										{" "}
										· {slot.postLabel}
									</span>
								) : null}
								{slot.isManual ? (
									<span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
										{t("manual")}
									</span>
								) : null}
							</Label>

							<select
								value={slot.personId ?? ""}
								onChange={(event) =>
									onSelect(slot.key, event.target.value || null)
								}
								className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm sm:max-w-64"
								aria-label={`${t(`sector.${slot.sector}`)}${slot.postLabel ? ` · ${slot.postLabel}` : ""}`}
							>
								<option value="">{t("vacant")}</option>
								{candidates.map((person) => {
									const hasConflict = person.markers.some(
										(marker) => marker.kind === "conflict",
									);

									return (
										<option
											key={person.id}
											value={person.id}
											className={hasConflict ? "text-red-600" : undefined}
										>
											{person.name}
											{person.markers.map((marker) =>
												marker.kind === "used"
													? ` · ${t("alreadyAssigned")}`
													: ` · ${t(`role.${marker.role}`)}`,
											)}
										</option>
									);
								})}
							</select>
						</div>
					);
				})}
			</div>
		</article>
	);
}

function weekdayOf(iso: string): number {
	const [year, month, day] = iso.split("-").map(Number);

	return new Date(year, (month ?? 1) - 1, day).getDay();
}

export function DutyRosterEditor({
	slug,
	organizationName,
	draft,
	people,
	onChange,
	onSaved,
	onDiscard,
}: {
	slug: string;
	organizationName: string;
	draft: DutyRosterDraft;
	people: DutyPerson[];
	onChange: (draft: DutyRosterDraft) => void;
	onSaved: () => void;
	onDiscard: () => void;
}) {
	const t = useTranslations("Duties");
	const tMeetings = useTranslations("Meetings");
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const midweekMeetings = draft.meetings.filter(
		(meeting) => meeting.kind === "MIDWEEK",
	);
	const weekendMeetings = draft.meetings.filter(
		(meeting) => meeting.kind === "WEEKEND",
	);

	function updateSlot(
		meetingId: string,
		slotKey: string,
		personId: string | null,
	) {
		const person = personId
			? people.find((candidate) => candidate.id === personId)
			: undefined;

		onChange({
			...draft,
			meetings: draft.meetings.map((meeting) => {
				if (meetingKey(meeting) !== meetingId) {
					return meeting;
				}

				return {
					...meeting,
					slots: meeting.slots.map((slot) => {
						if (slot.key !== slotKey) {
							return slot;
						}

						return {
							...slot,
							personId,
							personName: person?.name ?? "",
							isManual: true,
						};
					}),
				};
			}),
		});
	}

	function handleSave() {
		if (draft.meetings.length === 0) {
			setError(t("noMeetings"));
			return;
		}

		startTransition(async () => {
			const result = await saveDutyListAction({
				slug,
				listId: draft.listId ?? null,
				periodFrom: draft.periodFrom,
				periodTo: draft.periodTo,
				meetings: draft.meetings.map((meeting) => ({
					date: meeting.date,
					kind: meeting.kind,
					slots: meeting.slots.map((slot) => ({
						sector: slot.sector,
						postLabel: slot.postLabel,
						side: slot.side,
						position: slot.position,
						personId: slot.personId,
						isManual: slot.isManual,
					})),
				})),
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setError(null);
			onSaved();
		});
	}

	function removeMeeting(meetingId: string) {
		onChange({
			...draft,
			meetings: draft.meetings.filter(
				(meeting) => meetingKey(meeting) !== meetingId,
			),
		});
	}

	function renderCard(meeting: DutyMeetingDraft) {
		const id = meetingKey(meeting);

		return (
			<MeetingCard
				key={id}
				meeting={meeting}
				people={people}
				onSelect={(slotKey, personId) => updateSlot(id, slotKey, personId)}
				onRemove={() => removeMeeting(id)}
			/>
		);
	}

	return (
		<section className="space-y-4 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
			<header className="flex flex-wrap items-center justify-between gap-2">
				<div className="space-y-1">
					<h2 className="text-headline text-foreground">{t("draftTitle")}</h2>
					<p className="text-sm text-muted-foreground">
						{t("draftHint", {
							from: formatDateLabel(draft.periodFrom),
							to: formatDateLabel(draft.periodTo),
						})}
					</p>
				</div>

				<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
					{t("notSavedYet")}
				</span>
			</header>

			<div className="space-y-4 md:hidden">
				{draft.meetings.map(renderCard)}
			</div>

			<div className="hidden gap-4 md:grid md:grid-cols-2">
				<div className="space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						{tMeetings("midweek")}
					</h3>
					{midweekMeetings.map(renderCard)}
				</div>

				<div className="space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						{tMeetings("weekend")}
					</h3>
					{weekendMeetings.map(renderCard)}
				</div>
			</div>

			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					disabled={pending}
					onClick={handleSave}
					className="h-11 rounded-4xl bg-primary text-primary-foreground"
				>
					{pending ? t("saving") : t("saveProgram")}
				</Button>

				<Button
					type="button"
					variant="outline"
					disabled={pending}
					onClick={onDiscard}
					className="h-11 rounded-4xl"
				>
					{t("discard")}
				</Button>

				<DownloadDutyPdfButton
					organizationName={organizationName}
					periodFrom={draft.periodFrom}
					periodTo={draft.periodTo}
					meetings={draft.meetings}
				/>
			</div>
		</section>
	);
}
