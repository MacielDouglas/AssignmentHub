"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
	MeetingPartDto,
	MeetingProgramDto,
} from "@/features/meetings/domain/meeting-types";
import { updateSpeakerCongregationAction } from "../../../application/actions/assign-meeting-part.action";
import { SectionHeader } from "./section-header";
import {
	WeekendSongDialog,
	WeekendStudyThemeDialog,
	WeekendTalkDialog,
} from "./weekend-edit-dialogs";

type Props = {
	slug: string;
	program: MeetingProgramDto;
	parts: MeetingPartDto[];
	canManage: boolean;
	startTimes: Map<string, string>;
	renderPartRow: (part: MeetingPartDto) => ReactNode;
};

function findPart(parts: MeetingPartDto[], kind: MeetingPartDto["kind"]) {
	return parts.find((part) => part.kind === kind);
}

function formatDuration(durationInMinutes: number) {
	const safeDuration = Math.max(0, durationInMinutes);

	return `${safeDuration} ${safeDuration === 1 ? "min" : "min"}`;
}

function WeekendSongDisplay({
	part,
	startTime,
}: {
	part: MeetingPartDto;
	startTime: string | null;
}) {
	const title = part.songNumber
		? `Cântico ${part.songNumber}${part.songTitle ? ` — ${part.songTitle}` : ""}`
		: part.title;

	return (
		<article
			className={
				"rounded-2xl px-2 py-2.5 transition-colors sm:px-3" +
				(part.isDisabled ? " opacity-60" : "")
			}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-start gap-2.5">
						{startTime ? (
							<time
								dateTime={startTime}
								className="mt-0.5 shrink-0 font-medium tabular-nums text-body-sm text-foreground"
							>
								{startTime}
							</time>
						) : null}

						<div className="min-w-0">
							<p className="wrap-break-word text-body-sm font-medium text-foreground">
								{title}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-1.5 flex items-center gap-2 pl-15.5">
				{part.durationMin != null ? (
					<span className="text-caption tabular-nums text-muted-foreground">
						{formatDuration(part.durationMin)}
					</span>
				) : null}

				{part.isDisabled ? (
					<span className="rounded-full bg-muted px-2 py-0.5 text-caption font-medium text-muted-foreground">
						Indisponível
					</span>
				) : null}
			</div>
		</article>
	);
}

function SpeakerCongregation({
	slug,
	part,
	canManage,
}: {
	slug: string;
	part: MeetingPartDto;
	canManage: boolean;
}) {
	const speaker = part.assignments.find(
		(assignment) => assignment.role === "SPEAKER",
	);
	const current = speaker?.externalCongregation ?? null;

	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState(current ?? "");
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	if (!speaker) {
		return null;
	}

	if (!canManage) {
		if (!current) {
			return null;
		}

		return (
			<p className="mt-0.5 truncate text-caption text-muted-foreground">
				{current}
			</p>
		);
	}

	if (!editing) {
		return (
			<div className="mt-0.5 flex min-w-0 items-center justify-end gap-2">
				{current ? (
					<span className="min-w-0 truncate text-caption text-muted-foreground">
						{current}
					</span>
				) : (
					<span className="text-caption italic text-muted-foreground">
						Congregação não informada
					</span>
				)}
				<button
					type="button"
					onClick={() => {
						setValue(current ?? "");
						setError(null);
						setEditing(true);
					}}
					className="shrink-0 rounded-md px-1 text-caption font-medium text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
					aria-label={`Editar congregação de ${speaker.assigneeName}`}
				>
					Editar
				</button>
			</div>
		);
	}

	function handleSave() {
		startTransition(async () => {
			const result = await updateSpeakerCongregationAction({
				slug,
				partId: part.id,
				role: "SPEAKER",
				congregation: value.trim() ? value.trim() : null,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setError(null);
			setEditing(false);
		});
	}

	return (
		<div className="mt-1 flex items-center justify-end gap-1.5">
			<Input
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder="Congregação do orador"
				maxLength={120}
				className="h-9 max-w-52 rounded-xl text-caption"
				aria-label="Congregação do orador"
			/>
			<Button
				type="button"
				size="sm"
				disabled={pending}
				onClick={handleSave}
				className="h-9 rounded-xl"
			>
				Salvar
			</Button>
			{error ? (
				<span role="alert" className="text-caption text-destructive">
					{error}
				</span>
			) : null}
		</div>
	);
}

function SongBlock({
	slug,
	part,
	canManage,
	startTime,
	renderPartRow,
	dialogLabel,
	isDisplayOnly,
}: {
	slug: string;
	part: MeetingPartDto;
	canManage: boolean;
	startTime: string | null;
	renderPartRow: (part: MeetingPartDto) => ReactNode;
	dialogLabel: string;
	isDisplayOnly?: boolean;
}) {
	return (
		<div>
			{canManage && !part.isDisabled ? (
				<div className="flex justify-end">
					<WeekendSongDialog
						slug={slug}
						partId={part.id}
						currentNumber={part.songNumber}
						label={dialogLabel}
					/>
				</div>
			) : null}
			{isDisplayOnly ? (
				<WeekendSongDisplay part={part} startTime={startTime} />
			) : (
				renderPartRow(part)
			)}
		</div>
	);
}

export function WeekendSections({
	slug,
	program,
	parts,
	canManage,
	startTimes,
	renderPartRow,
}: Props) {
	const chairman = findPart(parts, "WEEKEND_CHAIRMAN");
	const openingSong = findPart(parts, "WEEKEND_OPENING_SONG");
	const publicTalk = findPart(parts, "WEEKEND_PUBLIC_TALK");
	const circuitTalk = findPart(parts, "WEEKEND_CIRCUIT_OVERSEER_FINAL_TALK");
	const middleSong = findPart(parts, "WEEKEND_WATCHTOWER_OPENING_SONG");
	const study = findPart(parts, "WEEKEND_WATCHTOWER_STUDY");
	const closing = findPart(parts, "WEEKEND_CLOSING_SONG_AND_PRAYER");

	const editable = canManage && !program.isCancelled;

	return (
		<div className="space-y-5">
			<div className="space-y-2">
				{chairman ? renderPartRow(chairman) : null}
				{openingSong ? (
					<SongBlock
						slug={slug}
						part={openingSong}
						canManage={editable}
						startTime={startTimes.get(openingSong.id) ?? null}
						renderPartRow={renderPartRow}
						dialogLabel="Cântico inicial"
						isDisplayOnly
					/>
				) : null}
			</div>

			{publicTalk || circuitTalk ? (
				<div>
					<div className="mb-3">
						<SectionHeader label="Discurso público" />
					</div>
					<div className="space-y-2">
						{publicTalk ? (
							<div>
								{editable && !publicTalk.isDisabled ? (
									<div className="flex justify-end">
										<WeekendTalkDialog
											slug={slug}
											partId={publicTalk.id}
											currentNumber={publicTalk.publicTalkNumber}
										/>
									</div>
								) : null}
								{renderPartRow(publicTalk)}
								<div className="pr-2 sm:pr-3">
									<SpeakerCongregation
										slug={slug}
										part={publicTalk}
										canManage={editable && !publicTalk.isDisabled}
									/>
								</div>
							</div>
						) : null}
						{circuitTalk ? renderPartRow(circuitTalk) : null}
					</div>
				</div>
			) : null}

			{middleSong || study || closing ? (
				<div>
					<div className="mb-3">
						<SectionHeader
							label="Estudo de A Sentinela"
							color={
								study?.highlightColor ??
								program.parts.find((part) => part.highlightColor)
									?.highlightColor ??
								undefined
							}
						/>
					</div>
					<div className="space-y-2">
						{middleSong ? (
							<SongBlock
								slug={slug}
								part={middleSong}
								canManage={editable}
								startTime={startTimes.get(middleSong.id) ?? null}
								renderPartRow={renderPartRow}
								dialogLabel="Cântico para o estudo"
								isDisplayOnly
							/>
						) : null}
						{study ? (
							<div>
								{editable && !study.isDisabled ? (
									<div className="flex justify-end">
										<WeekendStudyThemeDialog
											slug={slug}
											partId={study.id}
											currentTitle={study.title}
										/>
									</div>
								) : null}
								{renderPartRow(study)}
							</div>
						) : null}
						{closing ? (
							<SongBlock
								slug={slug}
								part={closing}
								canManage={editable}
								startTime={startTimes.get(closing.id) ?? null}
								renderPartRow={renderPartRow}
								dialogLabel="Cântico final"
							/>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}
