"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
	HiOutlineHeart,
	HiOutlineShieldCheck,
	HiOutlineUser,
	HiOutlineUsers,
} from "react-icons/hi2";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { createPersonAction } from "@/features/people/actions/create-person-action";
import type { PersonActionState } from "@/features/people/actions/person-action-state";
import { updatePersonAction } from "@/features/people/actions/update-person-action";
import { cn } from "@/lib/utils";
import type { FamilyOption, PersonListItem } from "../lib/people-view";

const initialState: PersonActionState = {
	success: false,
	message: "",
};

function HiddenBoolean({ name, value }: { name: string; value: boolean }) {
	return <input type="hidden" name={name} value={value ? "true" : "false"} />;
}

function FieldError({ error }: { error?: string[] }) {
	if (!error?.length) return null;
	return <p className="text-xs text-red-600 dark:text-red-400">{error[0]}</p>;
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			disabled={pending}
			className="h-11 rounded-2xl bg-linear-to-r from-blue-600 to-violet-600 px-5 text-white shadow-lg shadow-blue-600/20"
		>
			{pending
				? "Salvando..."
				: mode === "create"
					? "Criar pessoa"
					: "Salvar alterações"}
		</Button>
	);
}

function SwitchField({
	name,
	label,
	checked,
	onCheckedChange,
	description,
	disabled,
}: {
	name: string;
	label: string;
	checked: boolean;
	onCheckedChange: (value: boolean) => void;
	description?: string;
	disabled?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900",
				disabled && "opacity-60",
			)}
		>
			<div className="min-w-0">
				<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
					{label}
				</p>
				{description ? (
					<p className="text-xs text-slate-500 dark:text-slate-400">
						{description}
					</p>
				) : null}
			</div>

			<div className="shrink-0">
				<HiddenBoolean name={name} value={checked} />
				<Switch
					checked={checked}
					onCheckedChange={onCheckedChange}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}

function SectionCard({
	icon,
	title,
	description,
	children,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
			<header className="mb-4 flex items-start gap-3">
				<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
					{icon}
				</div>

				<div className="min-w-0">
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
						{title}
					</h3>
					<p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
						{description}
					</p>
				</div>
			</header>

			<div className="grid gap-4">{children}</div>
		</section>
	);
}

export default function PersonFormContent({
	slug,
	mode,
	families,
	person,
	formKey,
	onCancel,
	onSuccess,
}: {
	slug: string;
	mode: "create" | "edit";
	families: FamilyOption[];
	person?: PersonListItem;
	formKey: number;
	onCancel: () => void;
	onSuccess: () => void;
}) {
	const action = mode === "create" ? createPersonAction : updatePersonAction;
	const [state, formAction] = useActionState(action, initialState);

	const defaultFamilyId = person?.headedFamily?.id ?? person?.familyId ?? "";
	const [sex, setSex] = useState<"MALE" | "FEMALE">(person?.sex ?? "MALE");
	const [isActive, setIsActive] = useState<boolean>(person?.isActive ?? true);
	const [isStudent, setIsStudent] = useState<boolean>(
		person?.isStudent ?? true,
	);
	const [young, setYoung] = useState<boolean>(person?.young ?? true);
	const [baptized, setBaptized] = useState<boolean>(person?.baptized ?? false);
	const [cleaning, setCleaning] = useState<boolean>(person?.cleaning ?? true);
	const [isMarried, setIsMarried] = useState<boolean>(
		person?.isMarried ?? false,
	);
	const [isFamilyHead, setIsFamilyHead] = useState<boolean>(
		Boolean(person?.headedFamily),
	);
	const [familyId, setFamilyId] = useState<string>(defaultFamilyId);

	const [initiatingConversations, setInitiatingConversations] = useState(
		person?.initiatingConversations ?? false,
	);
	const [cultivatingInterest, setCultivatingInterest] = useState(
		person?.cultivatingInterest ?? false,
	);
	const [makingDisciples, setMakingDisciples] = useState(
		person?.makingDisciples ?? false,
	);
	const [explainingBeliefs, setExplainingBeliefs] = useState(
		person?.explainingBeliefs ?? false,
	);

	const [privilegePrayer, setPrivilegePrayer] = useState(
		person?.privilegePrayer ?? false,
	);
	const [bibleReading, setBibleReading] = useState(
		person?.bibleReading ?? false,
	);
	const [roamingMic, setRoamingMic] = useState(person?.roamingMic ?? false);
	const [sound, setSound] = useState(person?.sound ?? false);
	const [video, setVideo] = useState(person?.video ?? false);
	const [stage, setStage] = useState(person?.stage ?? false);
	const [bibleStudyReader, setBibleStudyReader] = useState(
		person?.bibleStudyReader ?? false,
	);
	const [watchtowerReader, setWatchtowerReader] = useState(
		person?.watchtowerReader ?? false,
	);
	const [attendant, setAttendant] = useState(person?.attendant ?? false);

	const [elder, setElder] = useState(person?.servicePrivilege?.elder ?? false);
	const [publicTalk, setPublicTalk] = useState(
		person?.servicePrivilege?.publicTalk ?? false,
	);
	const [spiritualGems, setSpiritualGems] = useState(
		person?.servicePrivilege?.spiritualGems ?? false,
	);
	const [treasuresFromGodsWordTalk, setTreasuresFromGodsWordTalk] = useState(
		person?.servicePrivilege?.treasuresFromGodsWordTalk ?? false,
	);
	const [lifeAndMinistryChairman, setLifeAndMinistryChairman] = useState(
		person?.servicePrivilege?.lifeAndMinistryChairman ?? false,
	);
	const [weekendChairman, setWeekendChairman] = useState(
		person?.servicePrivilege?.weekendChairman ?? false,
	);
	const [ourChristianLifeAssignment, setOurChristianLifeAssignment] = useState(
		person?.servicePrivilege?.ourChristianLifeAssignment ?? false,
	);
	const [localNeeds, setLocalNeeds] = useState(
		person?.servicePrivilege?.localNeeds ?? false,
	);
	const [bibleStudyConductor, setBibleStudyConductor] = useState(
		person?.servicePrivilege?.bibleStudyConductor ?? false,
	);
	const [watchtowerConductor, setWatchtowerConductor] = useState(
		person?.servicePrivilege?.watchtowerConductor ?? false,
	);

	const isMale = sex === "MALE";
	const isMaleAndBaptized = isMale && baptized;

	useEffect(() => {
		if (state.success) onSuccess();
	}, [state.success, onSuccess]);

	function resetMaleFields() {
		setBibleReading(false);
		setRoamingMic(false);
		setSound(false);
		setVideo(false);
		setStage(false);
		setBibleStudyReader(false);
		setWatchtowerReader(false);
		setAttendant(false);
		setPrivilegePrayer(false);
		setElder(false);
		setPublicTalk(false);
		setSpiritualGems(false);
		setTreasuresFromGodsWordTalk(false);
		setLifeAndMinistryChairman(false);
		setWeekendChairman(false);
		setOurChristianLifeAssignment(false);
		setLocalNeeds(false);
		setBibleStudyConductor(false);
		setWatchtowerConductor(false);
	}

	function resetBaptizedFields() {
		setBibleStudyReader(false);
		setWatchtowerReader(false);
		setAttendant(false);
		setPrivilegePrayer(false);
		setElder(false);
		setPublicTalk(false);
		setSpiritualGems(false);
		setTreasuresFromGodsWordTalk(false);
		setLifeAndMinistryChairman(false);
		setWeekendChairman(false);
		setOurChristianLifeAssignment(false);
		setLocalNeeds(false);
		setBibleStudyConductor(false);
		setWatchtowerConductor(false);
	}

	function handleSexChange(nextSex: "MALE" | "FEMALE") {
		setSex(nextSex);
		if (nextSex === "FEMALE") resetMaleFields();
	}

	function handleBaptizedChange(nextValue: boolean) {
		setBaptized(nextValue);
		if (!nextValue) resetBaptizedFields();
	}

	function handleYoungChange(nextValue: boolean) {
		setYoung(nextValue);
		if (nextValue) {
			setIsMarried(false);
		}
	}

	function handleMarriedChange(nextValue: boolean) {
		if (young && nextValue) return;
		setIsMarried(nextValue);
	}

	return (
		<form
			key={formKey}
			action={formAction}
			className="flex h-full min-h-0 flex-col"
		>
			<input type="hidden" name="slug" value={slug} />
			{person ? (
				<input type="hidden" name="personId" value={person.id} />
			) : null}

			<HiddenBoolean name="isActive" value={isActive} />
			<HiddenBoolean name="isStudent" value={isStudent} />
			<HiddenBoolean name="young" value={young} />
			<HiddenBoolean name="baptized" value={baptized} />
			<HiddenBoolean name="cleaning" value={cleaning} />
			<HiddenBoolean name="isMarried" value={isMarried} />
			<HiddenBoolean name="isFamilyHead" value={isFamilyHead} />
			<HiddenBoolean
				name="initiatingConversations"
				value={initiatingConversations}
			/>
			<HiddenBoolean name="cultivatingInterest" value={cultivatingInterest} />
			<HiddenBoolean name="makingDisciples" value={makingDisciples} />
			<HiddenBoolean name="explainingBeliefs" value={explainingBeliefs} />
			<HiddenBoolean name="privilegePrayer" value={privilegePrayer} />
			<HiddenBoolean name="bibleReading" value={bibleReading} />
			<HiddenBoolean name="roamingMic" value={roamingMic} />
			<HiddenBoolean name="sound" value={sound} />
			<HiddenBoolean name="video" value={video} />
			<HiddenBoolean name="stage" value={stage} />
			<HiddenBoolean name="bibleStudyReader" value={bibleStudyReader} />
			<HiddenBoolean name="watchtowerReader" value={watchtowerReader} />
			<HiddenBoolean name="attendant" value={attendant} />
			<HiddenBoolean name="elder" value={elder} />
			<HiddenBoolean name="publicTalk" value={publicTalk} />
			<HiddenBoolean name="spiritualGems" value={spiritualGems} />
			<HiddenBoolean
				name="treasuresFromGodsWordTalk"
				value={treasuresFromGodsWordTalk}
			/>
			<HiddenBoolean
				name="lifeAndMinistryChairman"
				value={lifeAndMinistryChairman}
			/>
			<HiddenBoolean name="weekendChairman" value={weekendChairman} />
			<HiddenBoolean
				name="ourChristianLifeAssignment"
				value={ourChristianLifeAssignment}
			/>
			<HiddenBoolean name="localNeeds" value={localNeeds} />
			<HiddenBoolean name="bibleStudyConductor" value={bibleStudyConductor} />
			<HiddenBoolean name="watchtowerConductor" value={watchtowerConductor} />

			<DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
				<DialogTitle className="text-left text-xl font-semibold text-slate-900 dark:text-slate-50">
					{mode === "create" ? "Nova pessoa" : "Editar pessoa"}
				</DialogTitle>
				<p className="text-left text-sm text-slate-500 dark:text-slate-400">
					Fluxo mobile first, semântica melhor, segurança no servidor e
					casamento automático por família.
				</p>
			</DialogHeader>

			<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 dark:bg-slate-950">
				<div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.12fr_0.88fr]">
					<div className="grid gap-4">
						<SectionCard
							icon={<HiOutlineUser className="h-5 w-5" />}
							title="Dados principais"
							description="Informações básicas e estado geral da pessoa."
						>
							<div className="grid gap-2">
								<Label htmlFor="name">Nome</Label>
								<Input
									id="name"
									name="name"
									defaultValue={person?.name ?? ""}
									placeholder="Nome completo"
									className="h-11 rounded-2xl"
								/>
								<FieldError error={state.fieldErrors?.name} />
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="sex">Sexo</Label>
									<Select
										value={sex}
										onValueChange={(value) =>
											handleSexChange(value as "MALE" | "FEMALE")
										}
									>
										<SelectTrigger id="sex" className="h-11 rounded-2xl">
											<SelectValue placeholder="Selecione" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="MALE">Masculino</SelectItem>
											<SelectItem value="FEMALE">Feminino</SelectItem>
										</SelectContent>
									</Select>
									<input type="hidden" name="sex" value={sex} />
									<FieldError error={state.fieldErrors?.sex} />
								</div>

								<div className="grid gap-2">
									<Label htmlFor="status">Situação</Label>
									<Select
										value={isActive ? "true" : "false"}
										onValueChange={(value) => setIsActive(value === "true")}
									>
										<SelectTrigger id="status" className="h-11 rounded-2xl">
											<SelectValue placeholder="Selecione" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="true">Ativo</SelectItem>
											<SelectItem value="false">Inativo</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<SwitchField
									name="isStudent"
									label="Estudante"
									checked={isStudent}
									onCheckedChange={setIsStudent}
								/>
								<SwitchField
									name="young"
									label="Jovem"
									checked={young}
									onCheckedChange={handleYoungChange}
								/>
								<SwitchField
									name="baptized"
									label={sex === "MALE" ? "Batizado" : "Batizada"}
									checked={baptized}
									onCheckedChange={handleBaptizedChange}
								/>
								<SwitchField
									name="cleaning"
									label="Limpeza"
									checked={cleaning}
									onCheckedChange={setCleaning}
								/>
							</div>
						</SectionCard>

						<SectionCard
							icon={<HiOutlineHeart className="h-5 w-5" />}
							title="Família e casamento"
							description="Chefia é tratada em ação específica; casamento é calculado automaticamente."
						>
							<SwitchField
								name="isFamilyHead"
								label="Chefe de família"
								checked={isFamilyHead}
								onCheckedChange={(value) => {
									setIsFamilyHead(value);
									if (value) setFamilyId("");
								}}
								description={
									mode === "edit" && person?.headedFamily
										? "Para remover chefia, use a ação específica no card da pessoa."
										: undefined
								}
								disabled={mode === "edit" && Boolean(person?.headedFamily)}
							/>

							{isFamilyHead ? (
								<div className="grid gap-2">
									<Label htmlFor="familyName">Nome da família</Label>
									<Input
										id="familyName"
										name="familyName"
										defaultValue={person?.headedFamily?.name ?? ""}
										placeholder="Ex.: Família Silva"
										className="h-11 rounded-2xl"
									/>
									<FieldError error={state.fieldErrors?.familyName} />
								</div>
							) : (
								<div className="grid gap-2">
									<Label htmlFor="familyId-select">Família</Label>
									<Select
										value={familyId || "__none__"}
										onValueChange={(value) =>
											setFamilyId(value === "__none__" ? "" : value)
										}
									>
										<SelectTrigger
											id="familyId-select"
											className="h-11 rounded-2xl"
										>
											<SelectValue placeholder="Sem família" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__">Sem família</SelectItem>
											{families.map((family) => (
												<SelectItem key={family.id} value={family.id}>
													{family.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<input type="hidden" name="familyId" value={familyId} />
									<FieldError error={state.fieldErrors?.familyId} />
								</div>
							)}

							<SwitchField
								name="isMarried"
								label="Pessoa casada"
								checked={isMarried}
								onCheckedChange={handleMarriedChange}
								disabled={young}
								description={
									young
										? "Jovens não podem permanecer casados nesta regra."
										: "O sistema calcula o cônjuge automaticamente com base na família."
								}
							/>
							<FieldError error={state.fieldErrors?.isMarried} />
						</SectionCard>

						<SectionCard
							icon={<HiOutlineUsers className="h-5 w-5" />}
							title="Atividades gerais"
							description="Permissões e indicadores comuns da pessoa."
						>
							<div className="grid gap-3 sm:grid-cols-2">
								<SwitchField
									name="initiatingConversations"
									label="Inicia conversas"
									checked={initiatingConversations}
									onCheckedChange={setInitiatingConversations}
								/>
								<SwitchField
									name="cultivatingInterest"
									label="Cultiva interesse"
									checked={cultivatingInterest}
									onCheckedChange={setCultivatingInterest}
								/>
								<SwitchField
									name="makingDisciples"
									label="Faz discípulos"
									checked={makingDisciples}
									onCheckedChange={setMakingDisciples}
								/>
								<SwitchField
									name="explainingBeliefs"
									label="Explica crenças"
									checked={explainingBeliefs}
									onCheckedChange={setExplainingBeliefs}
								/>
							</div>
						</SectionCard>
					</div>

					<aside className="grid gap-4">
						{isMale ? (
							<SectionCard
								icon={<HiOutlineShieldCheck className="h-5 w-5" />}
								title="Designações"
								description="Campos disponíveis apenas para homens."
							>
								<div className="grid gap-3">
									<SwitchField
										name="bibleReading"
										label="Leitura da Bíblia"
										checked={bibleReading}
										onCheckedChange={setBibleReading}
									/>
									<SwitchField
										name="roamingMic"
										label="Microfone volante"
										checked={roamingMic}
										onCheckedChange={setRoamingMic}
									/>
									<SwitchField
										name="sound"
										label="Som"
										checked={sound}
										onCheckedChange={setSound}
									/>
									<SwitchField
										name="video"
										label="Vídeo"
										checked={video}
										onCheckedChange={setVideo}
									/>
									<SwitchField
										name="stage"
										label="Palco"
										checked={stage}
										onCheckedChange={setStage}
									/>
								</div>
							</SectionCard>
						) : null}

						{isMaleAndBaptized ? (
							<SectionCard
								icon={<HiOutlineShieldCheck className="h-5 w-5" />}
								title="Masculino batizado"
								description="Privilégios habilitados apenas para homem batizado."
							>
								<div className="grid gap-3">
									<SwitchField
										name="bibleStudyReader"
										label="Leitor estudo bíblico"
										checked={bibleStudyReader}
										onCheckedChange={setBibleStudyReader}
									/>
									<SwitchField
										name="watchtowerReader"
										label="Leitor sentinela"
										checked={watchtowerReader}
										onCheckedChange={setWatchtowerReader}
									/>
									<SwitchField
										name="attendant"
										label="Indicador"
										checked={attendant}
										onCheckedChange={setAttendant}
									/>
									<SwitchField
										name="privilegePrayer"
										label="Oração"
										checked={privilegePrayer}
										onCheckedChange={setPrivilegePrayer}
									/>
									<Separator className="my-1" />
									<SwitchField
										name="elder"
										label="Ancião"
										checked={elder}
										onCheckedChange={setElder}
									/>
									<SwitchField
										name="treasuresFromGodsWordTalk "
										label="Discurso Tesouros da Palavra de Deus"
										checked={treasuresFromGodsWordTalk}
										onCheckedChange={setTreasuresFromGodsWordTalk}
									/>
									<SwitchField
										name="spiritualGems "
										label="Joias espirituais"
										checked={spiritualGems}
										onCheckedChange={setSpiritualGems}
									/>
									<SwitchField
										name="publicTalk"
										label="Discurso público"
										checked={publicTalk}
										onCheckedChange={setPublicTalk}
									/>
									<SwitchField
										name="lifeAndMinistryChairman"
										label="Presidente vida e ministério"
										checked={lifeAndMinistryChairman}
										onCheckedChange={setLifeAndMinistryChairman}
									/>
									<SwitchField
										name="weekendChairman"
										label="Presidente fim de semana"
										checked={weekendChairman}
										onCheckedChange={setWeekendChairman}
									/>
									<SwitchField
										name="ourChristianLifeAssignment"
										label="Nossa vida cristã"
										checked={ourChristianLifeAssignment}
										onCheckedChange={setOurChristianLifeAssignment}
									/>
									<SwitchField
										name="localNeeds"
										label="Necessidades locais"
										checked={localNeeds}
										onCheckedChange={setLocalNeeds}
									/>
									<SwitchField
										name="bibleStudyConductor"
										label="Condutor estudo bíblico"
										checked={bibleStudyConductor}
										onCheckedChange={setBibleStudyConductor}
									/>
									<SwitchField
										name="watchtowerConductor"
										label="Condutor sentinela"
										checked={watchtowerConductor}
										onCheckedChange={setWatchtowerConductor}
									/>
								</div>
							</SectionCard>
						) : (
							<section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-950">
								<div className="flex items-center gap-2">
									<Badge className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300">
										Reativo
									</Badge>
									<Badge className="rounded-full bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-950/50 dark:text-violet-300">
										Seguro
									</Badge>
								</div>
								<p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
									Os privilégios avançados aparecem apenas quando sexo e batismo
									permitem, reduzindo erro de preenchimento e mantendo o front
									mais limpo.
								</p>
							</section>
						)}
					</aside>
				</div>
			</div>

			<div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-h-5">
						{state.message ? (
							<p
								className={cn(
									"text-sm",
									state.success
										? "text-emerald-600 dark:text-emerald-400"
										: "text-red-600 dark:text-red-400",
								)}
							>
								{state.message}
							</p>
						) : null}
					</div>

					<div className="flex flex-col-reverse gap-3 sm:flex-row">
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							className="h-11 rounded-2xl"
						>
							Cancelar
						</Button>
						<SubmitButton mode={mode} />
					</div>
				</div>
			</div>
		</form>
	);
}
