"use client";

import { Baby, BadgeCheck, Crown, Trash2, User, Users } from "lucide-react";
import {
	type ReactElement,
	useActionState,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { createGroupAction } from "@/features/groups/actions/create-group-action";
import { deleteGroupAction } from "@/features/groups/actions/delete-group-action";
import type { GroupActionState } from "@/features/groups/actions/group-action-state";
import { updateGroupAction } from "@/features/groups/actions/update-group-action";
import { generateGroupSlug } from "@/features/groups/lib/group-slug";

type GroupSelectablePerson = {
	id: string;
	name: string;
	sex: "MALE" | "FEMALE";
	young: boolean;
	baptized: boolean;
	familyId: string | null;
	groupId: string | null;
	headedFamily?: { id: string; name: string } | null;
	family?: { id: string; name: string } | null;
};

type GroupDialogInput = {
	id: string;
	name: string;
	slug: string;
	superintendentId: string;
	assistantId: string;
	members: Array<{
		id: string;
		name: string;
	}>;
};

type GroupFormDialogProps = {
	mode: "create" | "edit";
	organizationSlug: string;
	organizationId: string;
	people: GroupSelectablePerson[];
	trigger: ReactElement;
	group?: GroupDialogInput;
};

const initialState: GroupActionState = {
	success: false,
	message: "",
};

function isEligibleGroupRolePerson(person: GroupSelectablePerson) {
	return person.sex === "MALE" && !person.young && person.baptized;
}

export function GroupFormDialog({
	mode,
	organizationSlug,
	organizationId,
	people,
	trigger,
	group,
}: GroupFormDialogProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(group?.name ?? "");
	const [slug, setSlug] = useState(group?.slug ?? "");
	const [slugTouched, setSlugTouched] = useState(Boolean(group?.slug));
	const [superintendentId, setSuperintendentId] = useState(
		group?.superintendentId ?? "",
	);
	const [assistantId, setAssistantId] = useState(group?.assistantId ?? "");
	const [memberIds, setMemberIds] = useState<string[]>(
		group?.members.map((member) => member.id) ?? [],
	);
	const [includeFamiliesByHeadIds, setIncludeFamiliesByHeadIds] = useState<
		string[]
	>([]);
	const [conflictOverrides, setConflictOverrides] = useState<string[]>([]);

	const action = mode === "create" ? createGroupAction : updateGroupAction;
	const [state, formAction, pending] = useActionState(action, initialState);
	const [deleteState, deleteFormAction, deleting] = useActionState(
		deleteGroupAction,
		initialState,
	);

	useEffect(() => {
		if (!slugTouched) {
			setSlug(generateGroupSlug(name));
		}
	}, [name, slugTouched]);

	useEffect(() => {
		if (state.success || deleteState.success) {
			setOpen(false);
		}
	}, [state.success, deleteState.success]);

	useEffect(() => {
		const conflicts = state.conflictPeople ?? [];
		if (conflicts.length) {
			setConflictOverrides((current) => {
				const currentSet = new Set(current);
				for (const person of conflicts) {
					currentSet.delete(person.id);
				}
				return [...currentSet];
			});
		}
	}, [state.conflictPeople]);

	const eligibleRolePeople = useMemo(
		() => people.filter(isEligibleGroupRolePerson),
		[people],
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

	const conflictPeople = state.conflictPeople ?? [];

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex"
			>
				{trigger}
			</button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>
							{mode === "create" ? "Novo grupo" : "Editar grupo"}
						</DialogTitle>
					</DialogHeader>

					<form action={formAction} className="space-y-6">
						<input
							type="hidden"
							name="organizationSlug"
							value={organizationSlug}
						/>
						<input type="hidden" name="organizationId" value={organizationId} />
						{group?.id ? (
							<input type="hidden" name="groupId" value={group.id} />
						) : null}

						{memberIds.map((id) => (
							<input
								key={`member-${id}`}
								type="hidden"
								name="memberIds"
								value={id}
							/>
						))}

						{includeFamiliesByHeadIds.map((id) => (
							<input
								key={`family-${id}`}
								type="hidden"
								name="includeFamiliesByHeadIds"
								value={id}
							/>
						))}

						{conflictOverrides.map((id) => (
							<input
								key={`override-${id}`}
								type="hidden"
								name="conflictOverrides"
								value={id}
							/>
						))}

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<label htmlFor="group-name" className="text-sm font-medium">
									Nome
								</label>
								<input
									id="group-name"
									name="name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									className="w-full rounded-md border px-3 py-2"
									placeholder="Ex.: Grupo Centro"
								/>
								{state.fieldErrors?.name?.[0] ? (
									<p className="text-sm text-red-600">
										{state.fieldErrors.name[0]}
									</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label htmlFor="group-slug" className="text-sm font-medium">
									Slug
								</label>
								<input
									id="group-slug"
									name="slug"
									value={slug}
									onChange={(event) => {
										setSlugTouched(true);
										setSlug(event.target.value);
									}}
									className="w-full rounded-md border px-3 py-2"
									placeholder="grupo-centro"
								/>
								{state.fieldErrors?.slug?.[0] ? (
									<p className="text-sm text-red-600">
										{state.fieldErrors.slug[0]}
									</p>
								) : null}
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<label
									htmlFor="group-superintendent"
									className="text-sm font-medium"
								>
									Superintendente
								</label>
								<select
									id="group-superintendent"
									name="superintendentId"
									value={superintendentId}
									onChange={(event) => {
										setSuperintendentId(event.target.value);
										if (!memberIds.includes(event.target.value)) {
											setMemberIds((current) => [
												...current,
												event.target.value,
											]);
										}
									}}
									className="w-full rounded-md border px-3 py-2"
								>
									<option value="">Selecione</option>
									{eligibleRolePeople.map((person) => (
										<option key={person.id} value={person.id}>
											{person.name}
										</option>
									))}
								</select>
								{state.fieldErrors?.superintendentId?.[0] ? (
									<p className="text-sm text-red-600">
										{state.fieldErrors.superintendentId[0]}
									</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label
									htmlFor="group-assistant"
									className="text-sm font-medium"
								>
									Ajudante
								</label>
								<select
									id="group-assistant"
									name="assistantId"
									value={assistantId}
									onChange={(event) => {
										setAssistantId(event.target.value);
										if (!memberIds.includes(event.target.value)) {
											setMemberIds((current) => [
												...current,
												event.target.value,
											]);
										}
									}}
									className="w-full rounded-md border px-3 py-2"
								>
									<option value="">Selecione</option>
									{eligibleRolePeople.map((person) => (
										<option key={person.id} value={person.id}>
											{person.name}
										</option>
									))}
								</select>
								{state.fieldErrors?.assistantId?.[0] ? (
									<p className="text-sm text-red-600">
										{state.fieldErrors.assistantId[0]}
									</p>
								) : null}
							</div>
						</div>

						<div className="space-y-3">
							<div>
								<h3 className="text-sm font-medium">Membros</h3>
								<p className="text-xs text-muted-foreground">
									Selecione pessoas da organização e, se quiser, leve a família
									junto ao marcar um chefe de família.
								</p>
								{state.fieldErrors?.memberIds?.[0] ? (
									<p className="mt-1 text-sm text-red-600">
										{state.fieldErrors.memberIds[0]}
									</p>
								) : null}
							</div>

							<div className="grid gap-3">
								{people.map((person) => {
									const isHead = Boolean(person.headedFamily);
									const inOtherGroup =
										person.groupId &&
										!group?.members.some((member) => member.id === person.id);

									return (
										<div key={person.id} className="rounded-md border p-3">
											<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
												<div className="space-y-2">
													<label className="flex items-center gap-3">
														<input
															type="checkbox"
															checked={memberIds.includes(person.id)}
															onChange={() => toggleMember(person.id)}
														/>
														<span className="inline-flex items-center gap-2 text-sm font-medium">
															{person.young ? (
																<Baby className="h-4 w-4 text-muted-foreground" />
															) : (
																<User className="h-4 w-4 text-muted-foreground" />
															)}
															{person.name}
														</span>
													</label>

													<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
														<span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
															{person.sex === "MALE" ? "Masculino" : "Feminino"}
														</span>
														<span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
															{person.young ? "Jovem" : "Adulto"}
														</span>
														{person.baptized ? (
															<span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
																<BadgeCheck className="h-3.5 w-3.5" />
																Batizado(a)
															</span>
														) : null}

														{person.headedFamily ? (
															<span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
																<Crown className="h-3.5 w-3.5" />
																Chefe da família {person.headedFamily.name}
															</span>
														) : person.family ? (
															<span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
																<Users className="h-3.5 w-3.5" />
																Família {person.family.name}
															</span>
														) : (
															<span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
																Sem família
															</span>
														)}

														{inOtherGroup ? (
															<span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-amber-700">
																Já está em outro grupo
															</span>
														) : null}
													</div>
												</div>

												{isHead ? (
													<label className="flex items-center gap-2 text-xs text-muted-foreground">
														<input
															type="checkbox"
															checked={includeFamiliesByHeadIds.includes(
																person.id,
															)}
															onChange={() => toggleIncludeFamily(person.id)}
														/>
														Levar família junto
													</label>
												) : null}
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{conflictPeople.length > 0 ? (
							<div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-3">
								<div>
									<p className="font-medium text-amber-900">
										Conflitos encontrados
									</p>
									<p className="text-sm text-amber-800">
										Selecione individualmente quem deve sair do grupo atual e
										entrar neste grupo.
									</p>
								</div>

								<div className="space-y-2">
									{conflictPeople.map((person) => (
										<label
											key={person.id}
											className="flex items-start gap-3 rounded-md border border-amber-200 bg-white p-3"
										>
											<input
												type="checkbox"
												checked={conflictOverrides.includes(person.id)}
												onChange={() => toggleConflictOverride(person.id)}
											/>
											<div className="text-sm">
												<p className="font-medium">{person.name}</p>
												<p className="text-muted-foreground">
													Atualmente pertence ao grupo {person.currentGroupName}
													.
												</p>
											</div>
										</label>
									))}
								</div>
							</div>
						) : null}

						{state.message ? (
							<p
								className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}
							>
								{state.message}
							</p>
						) : null}

						<div className="flex items-center justify-between gap-3">
							{mode === "edit" && group ? (
								<button
									type="submit"
									formAction={deleteFormAction}
									className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
									disabled={deleting}
								>
									<Trash2 className="h-4 w-4" />
									{deleting ? "Excluindo..." : "Excluir grupo"}
								</button>
							) : (
								<div />
							)}

							<button
								type="submit"
								disabled={pending}
								className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
							>
								{pending
									? mode === "create"
										? "Criando..."
										: "Salvando..."
									: mode === "create"
										? "Criar grupo"
										: "Salvar alterações"}
							</button>
						</div>

						{deleteState.message ? (
							<p
								className={`text-sm ${deleteState.success ? "text-green-600" : "text-red-600"}`}
							>
								{deleteState.message}
							</p>
						) : null}
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
