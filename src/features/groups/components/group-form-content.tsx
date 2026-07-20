"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
	HiOutlineCheckBadge,
	HiOutlineChevronDown,
	HiOutlineUser,
	HiOutlineUserGroup,
	HiOutlineUsers,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { createGroupAction } from "@/features/groups/actions/create-group-action";
import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import { updateGroupAction } from "@/features/groups/actions/update-group-action";
import { isEligibleGroupRolePerson } from "@/features/groups/lib/group-invariants";
import { generateGroupSlug } from "@/features/groups/lib/group-slug";
import type {
	GroupListItem,
	GroupSelectablePerson,
} from "@/features/groups/lib/groups-view";

type GroupFormContentProps = {
	mode: "create" | "edit";
	organizationSlug: string;
	people: GroupSelectablePerson[];
	group?: Pick<
		GroupListItem,
		"id" | "name" | "slug" | "superintendentId" | "assistantId" | "members"
	>;
	onSuccess?: () => void;
	onCancel?: () => void;
};

const initialState: GroupActionState = {
	success: false,
	message: "",
};

const fieldClassName =
	"h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-blue-500/30 focus:ring-4 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50";

export function GroupFormContent({
	mode,
	organizationSlug,
	people,
	group,
	onSuccess,
	onCancel,
}: GroupFormContentProps) {
	const action = mode === "create" ? createGroupAction : updateGroupAction;
	const [state, formAction, pending] = useActionState(action, initialState);

	const [name, setName] = useState(group?.name ?? "");
	const [slugManual, setSlugManual] = useState(group?.slug ?? "");
	const [slugAdvancedOpen, setSlugAdvancedOpen] = useState(false);
	const [slugTouched, setSlugTouched] = useState(Boolean(group?.slug));
	const [superintendentId, setSuperintendentId] = useState(
		group?.superintendentId ?? "",
	);
	const [assistantId, setAssistantId] = useState(group?.assistantId ?? "");
	const [memberIds, setMemberIds] = useState<string[]>(
		group?.members.map((m) => m.id) ?? [],
	);
	const [includeFamiliesByHeadIds, setIncludeFamiliesByHeadIds] = useState<
		string[]
	>([]);
	const [conflictOverrides, setConflictOverrides] = useState<string[]>([]);
	const [moveFamilyIds, setMoveFamilyIds] = useState<string[]>([]);
	// const [conflictBatchKey, setConflictBatchKey] = useState(0);

	const autoSlug = useMemo(() => generateGroupSlug(name), [name]);
	const slug = slugTouched ? slugManual : autoSlug;

	const eligibleRolePeople = useMemo(
		() => people.filter(isEligibleGroupRolePerson),
		[people],
	);

	const currentMemberIdSet = useMemo(
		() => new Set(group?.members.map((m) => m.id) ?? []),
		[group?.members],
	);

	const conflictPeople = useMemo(
		() => state.conflictPeople ?? [],
		[state.conflictPeople],
	);

	const conflictSignature = useMemo(
		() =>
			conflictPeople
				.map((p) => p.id)
				.sort()
				.join("|"),
		[conflictPeople],
	);

	// Só fecha o dialog no sucesso — sem setState de formulário
	useEffect(() => {
		if (state.success) {
			onSuccess?.();
		}
	}, [state.success, onSuccess]);

	// Reset de confirmações quando chega um NOVO conjunto de conflitos do server:
	// derivado: só consideramos overrides que ainda estão no lote atual.
	const activeConflictIds = useMemo(
		() => new Set(conflictPeople.map((p) => p.id)),
		[conflictPeople],
	);

	const effectiveConflictOverrides = useMemo(
		() => conflictOverrides.filter((id) => activeConflictIds.has(id)),
		[conflictOverrides, activeConflictIds],
	);

	const activeFamilyIds = useMemo(
		() =>
			new Set(
				conflictPeople
					.map((p) => p.familyId)
					.filter((id): id is string => Boolean(id)),
			),
		[conflictPeople],
	);

	const effectiveMoveFamilyIds = useMemo(
		() => moveFamilyIds.filter((id) => activeFamilyIds.has(id)),
		[moveFamilyIds, activeFamilyIds],
	);

	const toggleMember = (personId: string) => {
		setMemberIds((current) =>
			current.includes(personId)
				? current.filter((id) => id !== personId)
				: [...current, personId],
		);
	};

	const toggleIncludeFamily = (headId: string) => {
		setIncludeFamiliesByHeadIds((current) =>
			current.includes(headId)
				? current.filter((id) => id !== headId)
				: [...current, headId],
		);
	};

	const toggleConflictOverride = (personId: string) => {
		setConflictOverrides((current) =>
			current.includes(personId)
				? current.filter((id) => id !== personId)
				: [...current, personId],
		);
	};

	const toggleMoveFamily = (
		familyId: string,
		familyMemberIds: string[],
		checked: boolean,
	) => {
		setMoveFamilyIds((current) =>
			checked
				? current.includes(familyId)
					? current
					: [...current, familyId]
				: current.filter((id) => id !== familyId),
		);

		setConflictOverrides((current) => {
			const set = new Set(current);
			if (checked) {
				for (const id of familyMemberIds) set.add(id);
			} else {
				for (const id of familyMemberIds) set.delete(id);
			}
			return [...set];
		});

		if (checked) {
			setMemberIds((current) => {
				const set = new Set(current);
				for (const id of familyMemberIds) set.add(id);
				return [...set];
			});
		}
	};

	const ensureRoleInMembers = (personId: string) => {
		if (!personId) return;
		setMemberIds((current) =>
			current.includes(personId) ? current : [...current, personId],
		);
	};

	return (
		<form action={formAction} className="flex min-h-0 flex-1 flex-col">
			<input type="hidden" name="organizationSlug" value={organizationSlug} />
			<input type="hidden" name="slug" value={slug} />
			{group?.id ? (
				<input type="hidden" name="groupId" value={group.id} />
			) : null}

			{memberIds.map((id) => (
				<input key={`member-${id}`} type="hidden" name="memberIds" value={id} />
			))}
			{includeFamiliesByHeadIds.map((id) => (
				<input
					key={`family-head-${id}`}
					type="hidden"
					name="includeFamiliesByHeadIds"
					value={id}
				/>
			))}
			{effectiveConflictOverrides.map((id) => (
				<input
					key={`override-${id}`}
					type="hidden"
					name="conflictOverrides"
					value={id}
				/>
			))}
			{effectiveMoveFamilyIds.map((id) => (
				<input
					key={`move-family-${id}`}
					type="hidden"
					name="moveFamilyIds"
					value={id}
				/>
			))}

			<header className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
				<div className="flex items-start gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
						<HiOutlineUserGroup className="h-5 w-5" />
					</div>
					<div className="min-w-0 space-y-1">
						<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
							{mode === "create" ? "Novo grupo" : "Editar grupo"}
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Superintendente e ajudante devem ser homens adultos batizados e
							pessoas diferentes.
						</p>
					</div>
				</div>
			</header>

			<div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2 md:col-span-2">
						<label
							htmlFor="group-name"
							className="text-sm font-medium text-slate-800 dark:text-slate-200"
						>
							Nome
						</label>
						<input
							id="group-name"
							name="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={fieldClassName}
							placeholder="Ex.: Grupo Centro"
							autoComplete="off"
						/>
						{state.fieldErrors?.name?.[0] ? (
							<p className="text-sm text-red-600 dark:text-red-400">
								{state.fieldErrors.name[0]}
							</p>
						) : null}
					</div>

					<div className="space-y-2 md:col-span-2">
						<button
							type="button"
							onClick={() => setSlugAdvancedOpen((v) => !v)}
							className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"
						>
							<HiOutlineChevronDown
								className={`h-4 w-4 transition ${slugAdvancedOpen ? "rotate-180" : ""}`}
							/>
							Opções avançadas · slug
						</button>

						{slugAdvancedOpen ? (
							<div className="space-y-2 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
								<label
									htmlFor="group-slug"
									className="text-sm font-medium text-slate-800 dark:text-slate-200"
								>
									Slug
								</label>
								<input
									id="group-slug"
									value={slug}
									onChange={(e) => {
										setSlugTouched(true);
										setSlugManual(e.target.value);
									}}
									className={fieldClassName}
									placeholder="grupo-centro"
									autoComplete="off"
								/>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									Gerado automaticamente a partir do nome. Edite só se precisar
									de um identificador específico.
								</p>
								{state.fieldErrors?.slug?.[0] ? (
									<p className="text-sm text-red-600 dark:text-red-400">
										{state.fieldErrors.slug[0]}
									</p>
								) : null}
							</div>
						) : null}
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<label
							htmlFor="group-superintendent"
							className="text-sm font-medium text-slate-800 dark:text-slate-200"
						>
							Superintendente
						</label>
						<select
							id="group-superintendent"
							name="superintendentId"
							value={superintendentId}
							onChange={(e) => {
								setSuperintendentId(e.target.value);
								ensureRoleInMembers(e.target.value);
							}}
							className={fieldClassName}
						>
							<option value="">Selecione</option>
							{eligibleRolePeople.map((person) => (
								<option key={person.id} value={person.id}>
									{person.name}
								</option>
							))}
						</select>
						{state.fieldErrors?.superintendentId?.[0] ? (
							<p className="text-sm text-red-600 dark:text-red-400">
								{state.fieldErrors.superintendentId[0]}
							</p>
						) : null}
					</div>

					<div className="space-y-2">
						<label
							htmlFor="group-assistant"
							className="text-sm font-medium text-slate-800 dark:text-slate-200"
						>
							Ajudante
						</label>
						<select
							id="group-assistant"
							name="assistantId"
							value={assistantId}
							onChange={(e) => {
								setAssistantId(e.target.value);
								ensureRoleInMembers(e.target.value);
							}}
							className={fieldClassName}
						>
							<option value="">Selecione</option>
							{eligibleRolePeople.map((person) => (
								<option key={person.id} value={person.id}>
									{person.name}
								</option>
							))}
						</select>
						{state.fieldErrors?.assistantId?.[0] ? (
							<p className="text-sm text-red-600 dark:text-red-400">
								{state.fieldErrors.assistantId[0]}
							</p>
						) : null}
					</div>
				</div>

				<section className="space-y-3">
					<div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
							Membros
						</h3>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Selecione pessoas da organização. Em chefes de família, você pode
							levar a família junto.
						</p>
						{state.fieldErrors?.memberIds?.[0] ? (
							<p className="mt-1 text-sm text-red-600 dark:text-red-400">
								{state.fieldErrors.memberIds[0]}
							</p>
						) : null}
					</div>

					<div className="grid gap-3">
						{people.map((person) => {
							const isHead = Boolean(person.headedFamily);
							const inOtherGroup =
								Boolean(person.groupId) && !currentMemberIdSet.has(person.id);
							const selected = memberIds.includes(person.id);

							return (
								<div
									key={person.id}
									className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50"
								>
									<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div className="space-y-2">
											<label className="flex items-center gap-3">
												<input
													type="checkbox"
													checked={selected}
													onChange={() => toggleMember(person.id)}
													className="h-4 w-4 rounded border-slate-300"
												/>
												<span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50">
													<HiOutlineUser className="h-4 w-4 text-slate-400" />
													{person.name}
												</span>
											</label>

											<div className="flex flex-wrap gap-2">
												<StatusBadge
													label={
														person.sex === "MALE" ? "Masculino" : "Feminino"
													}
												/>
												<StatusBadge
													label={person.young ? "Jovem" : "Adulto"}
												/>
												{person.baptized ? (
													<StatusBadge label="Batizado(a)" tone="blue" />
												) : null}
												{person.headedFamily ? (
													<StatusBadge
														label={`Chefe · ${person.headedFamily.name}`}
														tone="violet"
													/>
												) : person.family ? (
													<StatusBadge
														label={`Família · ${person.family.name}`}
														tone="blue"
													/>
												) : (
													<StatusBadge label="Sem família" />
												)}
												{inOtherGroup ? (
													<StatusBadge
														label="Já está em outro grupo"
														tone="amber"
													/>
												) : null}
											</div>
										</div>

										{isHead ? (
											<label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
												<input
													type="checkbox"
													checked={includeFamiliesByHeadIds.includes(person.id)}
													onChange={() => toggleIncludeFamily(person.id)}
													className="h-4 w-4 rounded border-slate-300"
												/>
												<HiOutlineUsers className="h-4 w-4" />
												Levar família junto
											</label>
										) : null}
									</div>
								</div>
							);
						})}
					</div>
				</section>

				{conflictPeople.length > 0 ? (
					<section
						key={conflictSignature}
						className="space-y-3 rounded-[20px] border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"
					>
						<div>
							<p className="font-semibold text-amber-950 dark:text-amber-100">
								Confirmação de transferência
							</p>
							<p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
								Estas pessoas já estão em outro grupo. Confirme se deseja
								movê-las para este grupo. Se fizerem parte de uma família, você
								pode mover a família inteira.
							</p>
						</div>

						<div className="space-y-3">
							{conflictPeople.map((person) => {
								const confirmed = effectiveConflictOverrides.includes(
									person.id,
								);
								const familyChecked =
									person.familyId != null &&
									effectiveMoveFamilyIds.includes(person.familyId);

								return (
									<div
										key={person.id}
										className="space-y-3 rounded-[16px] border border-amber-200 bg-white p-3 dark:border-amber-900 dark:bg-slate-950"
									>
										<label className="flex items-start gap-3">
											<input
												type="checkbox"
												checked={confirmed}
												onChange={() => toggleConflictOverride(person.id)}
												className="mt-1 h-4 w-4 rounded border-slate-300"
											/>
											<div className="text-sm">
												<p className="font-medium text-slate-900 dark:text-slate-50">
													{person.name}
												</p>
												<p className="text-slate-600 dark:text-slate-300">
													Está no grupo{" "}
													<strong>{person.currentGroupName}</strong>. Tem
													certeza de que deseja mover para este grupo?
												</p>
											</div>
										</label>

										{person.familyId && person.familyName ? (
											<label className="ml-7 flex items-start gap-3 text-sm">
												<input
													type="checkbox"
													checked={familyChecked}
													onChange={(e) =>
														toggleMoveFamily(
															person.familyId as string,
															person.familyMemberIds,
															e.target.checked,
														)
													}
													className="mt-1 h-4 w-4 rounded border-slate-300"
												/>
												<span className="text-slate-700 dark:text-slate-200">
													{person.isFamilyHead
														? `Mover toda a família ${person.familyName} junto`
														: `Esta pessoa pertence à família ${person.familyName}. Mover a família inteira?`}
												</span>
											</label>
										) : null}
									</div>
								);
							})}
						</div>
					</section>
				) : null}

				{state.message ? (
					<p
						className={`text-sm ${
							state.success
								? "text-emerald-600 dark:text-emerald-400"
								: "text-red-600 dark:text-red-400"
						}`}
					>
						{state.message}
					</p>
				) : null}
			</div>

			<footer className="shrink-0 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						className="h-11 rounded-2xl"
						onClick={onCancel}
						disabled={pending}
					>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={pending}
						className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20"
					>
						<HiOutlineCheckBadge className="mr-2 h-4 w-4" />
						{pending
							? mode === "create"
								? "Criando..."
								: "Salvando..."
							: mode === "create"
								? "Criar grupo"
								: "Salvar alterações"}
					</Button>
				</div>
			</footer>
		</form>
	);
}
