"use client";

import {
	type ReactNode,
	useDeferredValue,
	useMemo,
	useState,
	useTransition,
} from "react";
import {
	HiOutlineClock,
	HiOutlineExclamationCircle,
	HiOutlineMagnifyingGlass,
	HiOutlineSparkles,
	HiOutlineTrash,
	HiOutlineUserPlus,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { MeetingAssignmentRole } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

import {
	clearMeetingAssignmentAction,
	loadAssignmentDialogAction,
	saveMeetingAssignmentAction,
} from "../../application/actions/assign-meeting-part.action";
import type {
	AssignmentDialogDataDto,
	MeetingCandidateDto,
} from "../../domain/meeting-types";

export type AssignmentSelection = {
	partId: string;
	role: MeetingAssignmentRole;
	source: "PERSON" | "SUB_PERSON" | "EXTERNAL";
	personId: string | null;
	subPersonId: string | null;
	externalName: string | null;
	assigneeName: string;
};

type Props = {
	slug: string;
	partId: string;
	partTitle: string;
	assignmentRole: MeetingAssignmentRole;
	trigger: ReactNode;
	onSelect?: (selection: AssignmentSelection) => void;
	autoClose?: boolean;
};

type CandidateTimeLevel = "green" | "yellow" | "red";

const ROLE_LABEL: Record<MeetingAssignmentRole, string> = {
	PRIMARY: "Principal",
	CHAIRMAN: "Presidente",
	READER: "Leitor",
	ASSISTANT: "Ajudante",
	PRAYER: "Oração",
	SPEAKER: "Orador",
	CONDUCTOR: "Dirigente",
};

const CANDIDATE_LEVEL_STYLES: Record<
	CandidateTimeLevel,
	{
		container: string;
		history: string;
	}
> = {
	green: {
		container:
			"border-emerald-200 bg-emerald-50/70 hover:border-emerald-300 hover:bg-emerald-50",
		history: "text-emerald-800",
	},
	yellow: {
		container:
			"border-amber-200 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50",
		history: "text-amber-800",
	},
	red: {
		container:
			"border-red-200 bg-red-50/70 hover:border-red-300 hover:bg-red-50",
		history: "text-red-800",
	},
};

function getRoleLabel(role: MeetingAssignmentRole) {
	return ROLE_LABEL[role];
}

function normalizeExternalName(value: string) {
	return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

function normalizeSearch(value: string) {
	return value.trim().toLocaleLowerCase("pt-BR");
}

function candidateMatchesSearch(
	candidate: MeetingCandidateDto,
	search: string,
) {
	const query = normalizeSearch(search);

	if (!query) {
		return true;
	}

	return [candidate.name, candidate.subtitle]
		.filter((value): value is string => Boolean(value))
		.some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
}

function formatCandidateHistory(candidate: MeetingCandidateDto) {
	const lastAssignedAt = candidate.history.lastSameKindAt;

	if (!lastAssignedAt) {
		return "Nunca designado nesta parte";
	}

	return `Última vez: ${lastAssignedAt}`;
}

function getCandidateTimeLevel(
	candidate: MeetingCandidateDto,
): CandidateTimeLevel {
	const lastAssignedAt = candidate.history.lastSameKindAt;

	if (!lastAssignedAt) {
		return "green";
	}

	/**
	 * Meio-dia em UTC evita que uma data YYYY-MM-DD seja deslocada
	 * para o dia anterior em fusos horários negativos.
	 */
	const lastAssignedDate = new Date(`${lastAssignedAt}T12:00:00.000Z`);

	if (Number.isNaN(lastAssignedDate.getTime())) {
		return "green";
	}

	const now = new Date();

	const monthsSinceLastAssignment =
		(now.getFullYear() - lastAssignedDate.getFullYear()) * 12 +
		now.getMonth() -
		lastAssignedDate.getMonth();

	if (monthsSinceLastAssignment >= 6) {
		return "green";
	}

	if (monthsSinceLastAssignment >= 3) {
		return "yellow";
	}

	return "red";
}

function CandidateButton({
	candidate,
	pending,
	onSelect,
}: {
	candidate: MeetingCandidateDto;
	pending: boolean;
	onSelect: (candidate: MeetingCandidateDto) => void;
}) {
	const level = getCandidateTimeLevel(candidate);
	const styles = CANDIDATE_LEVEL_STYLES[level];
	const history = formatCandidateHistory(candidate);

	return (
		<button
			type="button"
			disabled={pending}
			onClick={() => onSelect(candidate)}
			className={cn(
				"flex min-h-14 w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
				styles.container,
			)}
			aria-label={`Designar ${candidate.name}. ${history}${
				candidate.hasSameDayAssignment
					? ". Esta pessoa já possui uma designação neste dia"
					: ""
			}`}
		>
			<span className="min-w-0 flex-1">
				<span className="flex items-center gap-1.5">
					{candidate.hasSameDayAssignment ? (
						<span
							aria-hidden="true"
							className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500"
						>
							<HiOutlineExclamationCircle
								aria-hidden="true"
								className="size-3 text-white"
							/>
						</span>
					) : null}

					<span className="truncate text-title text-foreground">
						{candidate.name}
					</span>
				</span>

				{candidate.subtitle ? (
					<span className="mt-0.5 block truncate text-caption text-muted-foreground">
						{candidate.subtitle}
						{candidate.kind === "SUB_PERSON" ? " · visitante" : ""}
					</span>
				) : null}
			</span>

			<span
				className={cn(
					"inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-caption",
					styles.history,
				)}
			>
				{candidate.history.lastSameKindAt ? (
					<HiOutlineClock aria-hidden="true" className="size-3.5" />
				) : (
					<HiOutlineSparkles aria-hidden="true" className="size-3.5" />
				)}

				{history}
			</span>
		</button>
	);
}

function CandidateList({
	title,
	candidates,
	pending,
	onSelect,
	tone = "default",
}: {
	title: string;
	candidates: MeetingCandidateDto[];
	pending: boolean;
	onSelect: (candidate: MeetingCandidateDto) => void;
	tone?: "default" | "success";
}) {
	if (candidates.length === 0) {
		return null;
	}

	return (
		<section aria-label={title} className="space-y-2">
			<h3
				className={cn(
					"text-label font-semibold uppercase tracking-wide",
					tone === "success" ? "text-emerald-800" : "text-muted-foreground",
				)}
			>
				{title}
			</h3>

			<div className="space-y-2">
				{candidates.map((candidate) => (
					<CandidateButton
						key={`${candidate.kind}-${candidate.id}`}
						candidate={candidate}
						pending={pending}
						onSelect={onSelect}
					/>
				))}
			</div>
		</section>
	);
}

export function AssignmentDialog({
	slug,
	partId,
	partTitle,
	assignmentRole,
	trigger,
	onSelect,
	autoClose = true,
}: Props) {
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();

	const [data, setData] = useState<AssignmentDialogDataDto | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [externalName, setExternalName] = useState("");
	const [selectedRole, setSelectedRole] = useState(assignmentRole);
	const [pendingSelection, setPendingSelection] =
		useState<AssignmentSelection | null>(null);

	const deferredSearch = useDeferredValue(search);

	const filteredCandidates = useMemo(() => {
		if (!data) {
			return [];
		}

		return data.candidates.filter((candidate) =>
			candidateMatchesSearch(candidate, deferredSearch),
		);
	}, [data, deferredSearch]);

	const neverAssignedCandidates = useMemo(
		() =>
			filteredCandidates.filter(
				(candidate) => candidate.history.lastSameKindAt === null,
			),
		[filteredCandidates],
	);

	const candidatesWithHistory = useMemo(
		() =>
			filteredCandidates.filter(
				(candidate) => candidate.history.lastSameKindAt !== null,
			),
		[filteredCandidates],
	);

	function resetState() {
		setData(null);
		setError(null);
		setSearch("");
		setExternalName("");
		setSelectedRole(assignmentRole);
		setPendingSelection(null);
	}

	function loadDialogData(role: MeetingAssignmentRole) {
		startTransition(async () => {
			const result = await loadAssignmentDialogAction({
				slug,
				partId,
				role,
			});

			if (!result.ok) {
				setData(null);
				setError(result.error);
				return;
			}

			setData(result.data);
			setError(null);
		});
	}

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);

		if (nextOpen) {
			resetState();
			loadDialogData(assignmentRole);
			return;
		}

		if (!pending) {
			resetState();
		}
	}

	function handleRoleChange(nextRole: MeetingAssignmentRole) {
		if (pending || nextRole === selectedRole) {
			return;
		}

		setSelectedRole(nextRole);
		setSearch("");
		setExternalName("");
		setError(null);
		loadDialogData(nextRole);
	}

	function handleCandidateSelect(candidate: MeetingCandidateDto) {
		const selection: AssignmentSelection = {
			partId,
			role: selectedRole,
			source: candidate.kind,
			personId: candidate.kind === "PERSON" ? candidate.id : null,
			subPersonId: candidate.kind === "SUB_PERSON" ? candidate.id : null,
			externalName: null,
			assigneeName: candidate.name,
		};

		if (onSelect) {
			if (autoClose) {
				onSelect(selection);
				setOpen(false);
				resetState();
			} else {
				setPendingSelection(selection);
			}
			return;
		}

		startTransition(async () => {
			const result = await saveMeetingAssignmentAction({
				slug,
				partId,
				role: selectedRole,
				source: candidate.kind,
				personId: candidate.kind === "PERSON" ? candidate.id : null,
				subPersonId: candidate.kind === "SUB_PERSON" ? candidate.id : null,
				externalName: null,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
			resetState();
		});
	}

	function handleExternalNameChange(value: string) {
		setExternalName(normalizeExternalName(value));
	}

	function handleExternalNameSave() {
		const normalizedName = normalizeExternalName(externalName);

		if (normalizedName.length < 2) {
			setError("Informe um nome com pelo menos dois caracteres.");
			return;
		}

		const selection: AssignmentSelection = {
			partId,
			role: selectedRole,
			source: "EXTERNAL",
			personId: null,
			subPersonId: null,
			externalName: normalizedName,
			assigneeName: normalizedName,
		};

		if (onSelect) {
			if (autoClose) {
				onSelect(selection);
				setOpen(false);
				resetState();
			} else {
				setPendingSelection(selection);
			}
			return;
		}

		startTransition(async () => {
			const result = await saveMeetingAssignmentAction({
				slug,
				partId,
				role: selectedRole,
				source: "EXTERNAL",
				personId: null,
				subPersonId: null,
				externalName: normalizedName,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
			resetState();
		});
	}

	function handleClearAssignment() {
		startTransition(async () => {
			const result = await clearMeetingAssignmentAction({
				slug,
				partId,
				role: selectedRole,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
			resetState();
		});
	}

	const showEmptyState =
		data !== null && !pending && filteredCandidates.length === 0;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>

			<DialogContent className="flex max-h-[min(760px,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl border-border bg-background p-0 sm:max-w-xl">
				<DialogHeader className="sticky top-0 z-10 border-b border-border bg-background/95 px-5 py-4 text-left backdrop-blur-md">
					<DialogTitle className="pr-8 text-title text-foreground">
						Designar parte
					</DialogTitle>

					<p className="mt-1 text-body-sm text-muted-foreground">{partTitle}</p>

					<p className="mt-0.5 text-caption font-medium text-primary">
						Papel: {getRoleLabel(selectedRole)}
					</p>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
					<div className="space-y-5">
						{data && data.roles.length > 1 ? (
							<div
								role="tablist"
								aria-label="Selecionar papel da designação"
								className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-border bg-muted p-1"
							>
								{data.roles.map((role) => {
									const isSelected = selectedRole === role;

									return (
										<button
											key={role}
											type="button"
											role="tab"
											aria-selected={isSelected}
											disabled={pending}
											onClick={() => handleRoleChange(role)}
											className={cn(
												"min-h-10 shrink-0 rounded-xl px-3 text-body-sm font-medium transition",
												"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
												"disabled:cursor-not-allowed disabled:opacity-60",
												isSelected
													? "bg-background text-foreground shadow-sm"
													: "text-muted-foreground hover:text-foreground",
											)}
										>
											{getRoleLabel(role)}
										</button>
									);
								})}
							</div>
						) : null}

						<div className="relative">
							<HiOutlineMagnifyingGlass
								aria-hidden="true"
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
							/>

							<Input
								value={search}
								disabled={!data || pending}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Buscar por nome ou grupo"
								aria-label="Buscar candidato por nome ou grupo"
								className="min-h-11 rounded-2xl pl-9"
							/>
						</div>

						{error ? (
							<div
								role="alert"
								className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-body-sm text-destructive"
							>
								{error}
							</div>
						) : null}

						{pending && !data ? (
							<div
								role="status"
								aria-live="polite"
								className="rounded-2xl border border-border bg-muted/25 px-3 py-3 text-body-sm text-muted-foreground"
							>
								Carregando candidatos elegíveis…
							</div>
						) : null}

						{data && data.candidates.length > 0 ? (
							<div className="rounded-2xl border border-border bg-muted/25 p-3">
								<p className="text-label font-medium text-foreground">
									Prioridade de designação
								</p>

								<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-caption text-muted-foreground">
									<span className="inline-flex items-center gap-1.5">
										<span
											aria-hidden="true"
											className="size-2.5 rounded-full bg-emerald-500"
										/>
										Há mais tempo
									</span>

									<span className="inline-flex items-center gap-1.5">
										<span
											aria-hidden="true"
											className="size-2.5 rounded-full bg-amber-500"
										/>
										Tempo intermediário
									</span>

									<span className="inline-flex items-center gap-1.5">
										<span
											aria-hidden="true"
											className="size-2.5 rounded-full bg-red-500"
										/>
										Designado recentemente
									</span>

									<span className="inline-flex items-center gap-1.5">
										<HiOutlineExclamationCircle
											aria-hidden="true"
											className="size-3.5 text-amber-600"
										/>
										Já possui parte no dia
									</span>
								</div>
							</div>
						) : null}

						<CandidateList
							title="Nunca designados nos últimos 12 meses"
							candidates={neverAssignedCandidates}
							pending={pending}
							onSelect={handleCandidateSelect}
							tone="success"
						/>

						<CandidateList
							title="Candidatos com histórico"
							candidates={candidatesWithHistory}
							pending={pending}
							onSelect={handleCandidateSelect}
						/>

						{showEmptyState ? (
							<div className="rounded-2xl border border-dashed border-border bg-muted/25 p-5 text-center">
								<p className="text-body-sm font-medium text-foreground">
									Nenhum candidato encontrado
								</p>
								<p className="mt-1 text-caption text-muted-foreground">
									Ajuste a busca ou altere o papel para ver outros elegíveis.
								</p>
							</div>
						) : null}

						{data?.canUseExternalName ? (
							<>
								<Separator />

								<section className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/20 p-3">
									<div>
										<Label
											htmlFor="assignment-external-name"
											className="inline-flex items-center gap-1.5 text-label"
										>
											<HiOutlineUserPlus
												aria-hidden="true"
												className="size-4"
											/>
											Nome manual ou visitante
										</Label>

										<p className="mt-1 text-caption text-muted-foreground">
											Use esta opção somente quando a pessoa não estiver
											cadastrada.
										</p>
									</div>

									<Input
										id="assignment-external-name"
										value={externalName}
										disabled={pending}
										maxLength={120}
										autoComplete="name"
										onChange={(event) =>
											handleExternalNameChange(event.target.value)
										}
										className="min-h-11 rounded-xl"
										placeholder="Nome completo"
									/>

									<Button
										type="button"
										disabled={pending || externalName.trim().length < 2}
										onClick={handleExternalNameSave}
										className="min-h-11 w-full rounded-xl sm:w-auto"
									>
										Salvar nome manual
									</Button>
								</section>
							</>
						) : null}
					</div>
				</div>

				<DialogFooter className="sticky bottom-0 z-10 flex-row justify-between gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-md sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						disabled={pending}
						onClick={handleClearAssignment}
						className="min-h-11 rounded-xl px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
					>
						<HiOutlineTrash aria-hidden="true" className="mr-1.5 size-4" />
						Remover
					</Button>

					{pendingSelection && onSelect ? (
						<Button
							type="button"
							disabled={pending}
							onClick={() => {
								onSelect(pendingSelection);
								setOpen(false);
								resetState();
							}}
							className="min-h-11 rounded-xl"
						>
							Confirmar
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							disabled={pending}
							onClick={() => setOpen(false)}
							className="min-h-11 rounded-xl"
						>
							Fechar
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
