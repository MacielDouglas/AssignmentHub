"use client";

import { type ReactNode, useMemo, useState, useTransition } from "react";
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

import {
	clearMeetingAssignmentAction,
	loadAssignmentDialogAction,
	saveMeetingAssignmentAction,
} from "../../application/actions/assign-meeting-part.action";
import type {
	AssignmentDialogDataDto,
	MeetingCandidateDto,
} from "../../domain/meeting-types";

type Props = {
	slug: string;
	partId: string;
	partTitle: string;
	role: MeetingAssignmentRole;
	trigger: ReactNode;
};

function roleLabel(role: MeetingAssignmentRole) {
	switch (role) {
		case "CHAIRMAN":
			return "Presidente";
		case "READER":
			return "Leitor";
		case "ASSISTANT":
			return "Ajudante";
		case "PRAYER":
			return "Oração";
		case "SPEAKER":
			return "Orador";
		case "CONDUCTOR":
			return "Dirigente";
		default:
			return "Designado";
	}
}

function formatHistory(candidate: MeetingCandidateDto) {
	if (!candidate.history.lastSameKindAt) {
		return "Nunca nesta parte";
	}
	return `Última: ${candidate.history.lastSameKindAt}`;
}

/**
 * Define a cor de destaque do candidato baseado no tempo desde a última designação.
 * Verde: nunca designado ou última designação há muito tempo
 * Amarelo: tempo médio
 * Vermelho: designado recentemente
 */
function candidateTimeLevel(
	candidate: MeetingCandidateDto,
): "none" | "green" | "yellow" | "red" {
	if (!candidate.history.lastSameKindAt) return "green";

	const lastDate = new Date(
		`${candidate.history.lastSameKindAt}T00:00:00.000Z`,
	);
	const now = new Date();
	const diffMonths =
		(now.getFullYear() - lastDate.getFullYear()) * 12 +
		(now.getMonth() - lastDate.getMonth());

	if (diffMonths >= 6) return "green";
	if (diffMonths >= 3) return "yellow";
	return "red";
}

function CandidateButton({
	candidate,
	pending,
	onSelect,
}: {
	candidate: MeetingCandidateDto;
	pending: boolean;
	onSelect: () => void;
}) {
	const level = candidateTimeLevel(candidate);

	const borderColor = {
		none: "border-border",
		green:
			"border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50",
		yellow:
			"border-amber-200 bg-amber-50/70 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
		red: "border-red-200 bg-red-50/70 hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 dark:hover:bg-red-950/50",
	};

	const labelColor = {
		none: "text-muted-foreground",
		green: "text-emerald-700 dark:text-emerald-300",
		yellow: "text-amber-700 dark:text-amber-300",
		red: "text-red-700 dark:text-red-300",
	};

	return (
		<button
			type="button"
			disabled={pending}
			onClick={onSelect}
			className={[
				"flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left transition",
				level === "none"
					? "border-border bg-card hover:bg-muted"
					: borderColor[level],
			].join(" ")}
		>
			<span className="min-w-0 flex-1">
				<span className="flex items-center gap-1.5 truncate text-title text-foreground">
					{candidate.hasSameDayAssignment ? (
						<span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 motion-safe:animate-pulse">
							<HiOutlineExclamationCircle className="h-3 w-3 text-white" />
						</span>
					) : null}
					{candidate.name}
				</span>
				{candidate.subtitle ? (
					<span className="mt-0.5 block truncate text-xs text-muted-foreground">
						{candidate.subtitle}
						{candidate.kind === "SUB_PERSON" ? " · visitante" : ""}
					</span>
				) : null}
			</span>
			<span
				className={[
					"inline-flex shrink-0 items-center gap-1 text-caption",
					labelColor[level],
				].join(" ")}
			>
				{candidate.history.lastSameKindAt === null ? (
					<HiOutlineSparkles className="h-3.5 w-3.5" />
				) : (
					<HiOutlineClock className="h-3.5 w-3.5" />
				)}
				{formatHistory(candidate)}
			</span>
		</button>
	);
}

export function AssignmentDialog({
	slug,
	partId,
	partTitle,
	role,
	trigger,
}: Props) {
	const [open, setOpen] = useState(false);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<AssignmentDialogDataDto | null>(null);
	const [search, setSearch] = useState("");
	const [externalName, setExternalName] = useState("");
	const [selectedRole, setSelectedRole] = useState(role);
	const [primaryPersonId, setPrimaryPersonId] = useState<string | null>(null);

	const filtered = useMemo(() => {
		if (!data) return [];
		const query = search.trim().toLowerCase();
		if (!query) return data.candidates;
		return data.candidates.filter((candidate) => {
			return (
				candidate.name.toLowerCase().includes(query) ||
				candidate.subtitle?.toLowerCase().includes(query)
			);
		});
	}, [data, search]);

	// Separa candidatos por família quando role = ASSISTANT
	const { mainList, familyList } = useMemo(() => {
		if (selectedRole !== "ASSISTANT" || !primaryPersonId || !data) {
			return { mainList: filtered, familyList: [] as MeetingCandidateDto[] };
		}

		const primary = data.candidates.find(
			(c) => c.id === primaryPersonId && c.kind === "PERSON",
		);
		if (!primary?.familyId) {
			return { mainList: filtered, familyList: [] as MeetingCandidateDto[] };
		}

		const main: MeetingCandidateDto[] = [];
		const family: MeetingCandidateDto[] = [];

		for (const candidate of filtered) {
			const isSameFamily =
				candidate.familyId != null && candidate.familyId === primary.familyId;
			const isOppositeSex = candidate.sex !== primary.sex;

			if (isSameFamily && isOppositeSex) {
				family.push(candidate);
			} else {
				main.push(candidate);
			}
		}

		return { mainList: main, familyList: family };
	}, [filtered, selectedRole, primaryPersonId, data]);

	const neverAssigned = mainList.filter(
		(candidate) => candidate.history.lastSameKindAt === null,
	);
	const withHistory = mainList.filter(
		(candidate) => candidate.history.lastSameKindAt !== null,
	);

	function openAndLoad() {
		setOpen(true);
		setError(null);
		setSearch("");
		setExternalName("");
		setSelectedRole(role);
		setPrimaryPersonId(null);

		startTransition(async () => {
			const result = await loadAssignmentDialogAction({
				slug,
				partId,
				role,
			});

			if (!result.ok) {
				setError(result.error);
				setData(null);
				return;
			}

			setData(result.data);

			// Detecta o ID da pessoa PRIMARY para filtrar família
			if (role === "ASSISTANT") {
				// A designação PRIMARY já existente é obtida via server action
			}
		});
	}

	async function loadCandidatesForRole(newRole: MeetingAssignmentRole) {
		setSelectedRole(newRole);

		startTransition(async () => {
			const result = await loadAssignmentDialogAction({
				slug,
				partId,
				role: newRole,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setData(result.data);
		});
	}

	function saveCandidate(candidate: MeetingCandidateDto) {
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
		});
	}

	function saveExternal() {
		startTransition(async () => {
			const result = await saveMeetingAssignmentAction({
				slug,
				partId,
				role: selectedRole,
				source: "EXTERNAL",
				personId: null,
				subPersonId: null,
				externalName,
			});

			if (!result.ok) {
				setError(result.error);
				return;
			}

			setOpen(false);
		});
	}

	function clearAssignment() {
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
		});
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (next) {
					openAndLoad();
					return;
				}
				setOpen(false);
			}}
		>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-hidden rounded-4xl p-0 sm:max-w-xl">
				<DialogHeader className="border-b border-border px-5 py-4 text-left">
					<DialogTitle className="text-title text-foreground">
						Designar · {partTitle}
					</DialogTitle>
					<p className="text-sm text-muted-foreground">
						Papel: {roleLabel(selectedRole)}
					</p>
				</DialogHeader>

				<div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
					{data && data.roles.length > 1 ? (
						<div className="inline-flex rounded-4xl border border-border bg-muted p-1">
							{data.roles.map((item) => (
								<button
									key={item}
									type="button"
									className={[
										"min-h-10 rounded-xl px-4 text-sm font-medium transition",
										selectedRole === item
											? "bg-card text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									].join(" ")}
									onClick={() => loadCandidatesForRole(item)}
								>
									{roleLabel(item)}
								</button>
							))}
						</div>
					) : null}

					<div className="relative">
						<HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Buscar por nome ou grupo"
							className="min-h-11 rounded-3xl pl-9"
						/>
					</div>

					{error ? (
						<p className="rounded-4xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</p>
					) : null}

					{pending && !data ? (
						<p className="text-sm text-muted-foreground">
							Carregando candidatos…
						</p>
					) : null}

					{/* Legenda de cores */}
					{data && data.candidates.length > 0 ? (
						<div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
							<span className="inline-flex items-center gap-1">
								<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
								Há mais tempo
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
								Tempo médio
							</span>
							<span className="inline-flex items-center gap-1">
								<span className="h-2.5 w-2.5 rounded-full bg-red-400" />
								Designado recentemente
							</span>
							<span className="inline-flex items-center gap-1">
								<HiOutlineExclamationCircle className="h-3 w-3 text-amber-500" />
								Já designado neste dia
							</span>
						</div>
					) : null}

					{neverAssigned.length > 0 ? (
						<div className="space-y-2">
							<p className="inline-flex items-center gap-1.5 text-label uppercase text-emerald-700 dark:text-emerald-300">
								<HiOutlineSparkles className="h-3.5 w-3.5" />
								Nunca designados (12 meses)
							</p>
							<div className="space-y-2">
								{neverAssigned.map((candidate) => (
									<CandidateButton
										key={`${candidate.kind}-${candidate.id}`}
										candidate={candidate}
										pending={pending}
										onSelect={() => saveCandidate(candidate)}
									/>
								))}
							</div>
						</div>
					) : null}

					{withHistory.length > 0 ? (
						<div className="space-y-2">
							<p className="text-label uppercase text-muted-foreground">
								Com histórico
							</p>
							<div className="space-y-2">
								{withHistory.map((candidate) => (
									<CandidateButton
										key={`${candidate.kind}-${candidate.id}`}
										candidate={candidate}
										pending={pending}
										onSelect={() => saveCandidate(candidate)}
									/>
								))}
							</div>
						</div>
					) : null}

					{/* Familiares de sexo oposto (apenas para ASSISTANT) */}
					{familyList.length > 0 ? (
						<div className="space-y-2">
							<Separator className="my-2" />
							<p className="text-label uppercase text-muted-foreground">
								Familiares (mesma família, sexo oposto)
							</p>
							<div className="space-y-2">
								{familyList.map((candidate) => (
									<CandidateButton
										key={`${candidate.kind}-${candidate.id}`}
										candidate={candidate}
										pending={pending}
										onSelect={() => saveCandidate(candidate)}
									/>
								))}
							</div>
						</div>
					) : null}

					{data && filtered.length === 0 && familyList.length === 0 ? (
						<div className="rounded-4xl border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
							Nenhum candidato elegível para este filtro.
						</div>
					) : null}

					{data?.canUseExternalName ? (
						<div className="space-y-2 rounded-4xl border border-dashed border-border p-3">
							<Label
								htmlFor="external-name"
								className="inline-flex items-center gap-1.5"
							>
								<HiOutlineUserPlus className="h-4 w-4" />
								Nome manual / visitante
							</Label>
							<Input
								id="external-name"
								value={externalName}
								onChange={(event) => setExternalName(event.target.value)}
								className="min-h-11 rounded-2xl"
								placeholder="Nome completo"
							/>
							<Button
								type="button"
								className="min-h-11 rounded-2xl"
								disabled={pending || externalName.trim().length < 2}
								onClick={saveExternal}
							>
								Salvar nome manual
							</Button>
						</div>
					) : null}
				</div>

				<DialogFooter className="gap-2 border-t border-border px-5 py-4 sm:justify-between">
					<Button
						type="button"
						variant="ghost"
						className="min-h-11 rounded-4xl text-destructive hover:bg-destructive/10"
						disabled={pending}
						onClick={clearAssignment}
					>
						<HiOutlineTrash className="mr-1.5 h-4 w-4" />
						Remover
					</Button>
					<Button
						type="button"
						variant="outline"
						className="min-h-11 rounded-2xl"
						onClick={() => setOpen(false)}
					>
						Fechar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
