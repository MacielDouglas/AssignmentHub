import { getMeetingPartMeta } from "@/features/meetings/domain/meeting-part-meta";
import type { MeetingPartDto } from "@/features/meetings/domain/meeting-types";
import type { MeetingAssignmentRole } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { AssignmentDialog } from "./assignment-dialog";

type Props = {
	slug: string;
	part: MeetingPartDto;
	startTime: string | null;
	canManage: boolean;
	disableEdit?: boolean;
};

function getAssignableRoles(part: MeetingPartDto): MeetingAssignmentRole[] {
	const meta = getMeetingPartMeta(part.kind);
	if (!meta?.roles[0]) return [];

	if (part.kind === "MIDWEEK_CHAIRMAN") return ["CHAIRMAN"];

	return meta.roles;
}

function getAssignmentForRole(
	part: MeetingPartDto,
	role: MeetingAssignmentRole,
) {
	return part.assignments.find((a) => a.role === role);
}

export function MeetingPartRow({
	slug,
	part,
	startTime,
	canManage,
	disableEdit,
}: Props) {
	if (part.kind === "MIDWEEK_CHAIRMAN") {
		return (
			<ChairmanRow
				slug={slug}
				part={part}
				canManage={canManage}
				disableEdit={disableEdit}
			/>
		);
	}

	const assignableRoles = getAssignableRoles(part);
	const title = getPartDisplayTitle(part);

	return (
		<article
			className={cn(
				"rounded-2xl px-2 py-2.5 transition-colors sm:px-3",
				canManage && "hover:bg-muted/55",
				part.isDisabled && "opacity-60",
			)}
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

							{part.theme && !part.songNumber ? (
								<p className="mt-0.5 wrap-break-word text-caption text-muted-foreground">
									{part.theme}
								</p>
							) : null}
						</div>
					</div>
				</div>

				<div className="flex min-w-0 shrink-0 flex-col items-end gap-0.5 text-right">
					{assignableRoles.length > 0 ? (
						assignableRoles.map((role) => {
							const assignment = getAssignmentForRole(part, role);
							return (
								<AssignmentValue
									key={role}
									slug={slug}
									part={part}
									assignment={assignment}
									canManage={canManage}
									disableEdit={disableEdit}
									fallbackLabel={
										canManage ? "Não designado" : "Sem programação"
									}
									roleFallback={role}
								/>
							);
						})
					) : (
						<span className="max-w-40 truncate text-label text-muted-foreground sm:max-w-56">
							{canManage ? "Não designado" : "Sem programação"}
						</span>
					)}
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

function ChairmanRow({
	slug,
	part,
	canManage,
	disableEdit,
}: {
	slug: string;
	part: MeetingPartDto;
	canManage: boolean;
	disableEdit?: boolean;
}) {
	const assignment = part.assignments[0];
	const assigneeName = assignment?.assigneeName ?? null;

	return (
		<article className="flex min-h-11 items-center justify-between gap-4 rounded-xl px-2 py-1.5 sm:px-3">
			<span className="text-label font-medium text-foreground">Presidente</span>

			<AssignmentValue
				slug={slug}
				part={part}
				assignment={assignment}
				canManage={canManage}
				disableEdit={disableEdit}
				fallbackLabel={canManage ? "Não designado" : "Sem programação"}
				roleFallback="CHAIRMAN"
			/>

			{assigneeName ? null : null}
		</article>
	);
}

function AssignmentValue({
	slug,
	part,
	assignment,
	canManage,
	disableEdit,
	fallbackLabel,
	roleFallback,
}: {
	slug: string;
	part: MeetingPartDto;
	assignment: MeetingPartDto["assignments"][number] | undefined;
	canManage: boolean;
	disableEdit?: boolean;
	fallbackLabel: string;
	roleFallback?: MeetingAssignmentRole;
}) {
	const label = assignment?.assigneeName ?? fallbackLabel;
	const meta = getMeetingPartMeta(part.kind);
	const assignmentRole = assignment?.role ?? roleFallback ?? meta?.roles[0];

	if (!canManage || !assignmentRole || disableEdit) {
		return (
			<span className="max-w-40 truncate text-label text-muted-foreground sm:max-w-56">
				{label}
			</span>
		);
	}

	return (
		<AssignmentDialog
			slug={slug}
			partId={part.id}
			partTitle={part.title}
			assignmentRole={assignmentRole}
			trigger={
				<button
					type="button"
					className="min-h-11 max-w-40 rounded-md px-1 text-right text-label text-foreground underline decoration-dotted underline-offset-4 transition hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:max-w-56"
					aria-label={`Alterar designação de ${part.title}. Atual: ${label}`}
				>
					<span className="block truncate">{label}</span>
				</button>
			}
		/>
	);
}

function getPartDisplayTitle(part: MeetingPartDto) {
	if (!part.songNumber) {
		return part.title;
	}

	const songTitle = part.songTitle ? ` — ${part.songTitle}` : "";

	return `Cântico ${part.songNumber}${songTitle}`;
}

function formatDuration(durationInMinutes: number) {
	const safeDuration = Math.max(0, durationInMinutes);

	return `${safeDuration} ${safeDuration === 1 ? "min" : "min"}`;
}
