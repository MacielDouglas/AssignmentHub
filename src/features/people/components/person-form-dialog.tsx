"use client";

import { type ReactElement, useActionState, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createPersonAction } from "@/features/people/actions/create-person-action";
import type { PersonActionState } from "@/features/people/actions/person-action-state";
import { updatePersonAction } from "@/features/people/actions/update-person-action";

type FamilyOption = {
	id: string;
	name: string;
};

type ServicePrivilegeInput = {
	elder: boolean;
	publicTalk: boolean;
	lifeAndMinistryChairman: boolean;
	weekendChairman: boolean;
	ourChristianLifeAssignment: boolean;
	localNeeds: boolean;
	bibleStudyConductor: boolean;
	watchtowerConductor: boolean;
};

type PersonDialogInput = {
	id: string;
	name: string;
	sex: "MALE" | "FEMALE";
	isActive: boolean;
	isStudent: boolean;
	familyId: string | null;
	headedFamily?: {
		id: string;
		name: string;
	} | null;
	baptized: boolean;
	young: boolean;
	initiatingConversations: boolean;
	cultivatingInterest: boolean;
	makingDisciples: boolean;
	explainingBeliefs: boolean;
	cleaning: boolean;
	privilegePrayer: boolean;
	bibleReading: boolean;
	roamingMic: boolean;
	sound: boolean;
	video: boolean;
	stage: boolean;
	bibleStudyReader: boolean;
	watchtowerReader: boolean;
	attendant: boolean;
	servicePrivilege?: ServicePrivilegeInput | null;
};

type PersonFormDialogProps = {
	slug: string;
	mode: "create" | "edit";
	trigger: ReactElement;
	families: FamilyOption[];
	person?: PersonDialogInput;
};

type SexValue = "MALE" | "FEMALE";

const NO_FAMILY = "__NO_FAMILY__";

const initialState: PersonActionState = {
	success: false,
	message: "",
};

function SwitchField({
	name,
	label,
	description,
	checked,
	onCheckedChange,
	disabled = false,
}: {
	name: string;
	label: string;
	description?: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<div className="rounded-lg border p-3">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-1">
					<p className="text-sm font-medium">{label}</p>
					{description ? (
						<p className="text-xs text-muted-foreground">{description}</p>
					) : null}
				</div>

				<div className="relative">
					<Switch
						checked={checked}
						onCheckedChange={onCheckedChange}
						disabled={disabled}
					/>
				</div>
			</div>

			<input type="hidden" name={name} value={String(checked)} />
		</div>
	);
}

function FieldError({
	errors,
	name,
}: {
	errors?: Record<string, string[] | undefined>;
	name: string;
}) {
	const message = errors?.[name]?.[0];

	if (!message) {
		return null;
	}

	return <p className="text-sm text-red-600">{message}</p>;
}

function PersonForm({
	slug,
	mode,
	person,
	families,
	onSuccess,
}: {
	slug: string;
	mode: "create" | "edit";
	person?: PersonDialogInput;
	families: FamilyOption[];
	onSuccess: () => void;
}) {
	const action = mode === "create" ? createPersonAction : updatePersonAction;
	const [state, formAction, pending] = useActionState(action, initialState);

	const [name, setName] = useState(person?.name ?? "");
	const [sex, setSex] = useState<SexValue>(person?.sex ?? "MALE");
	const [isActive, setIsActive] = useState(person?.isActive ?? true);
	const [isStudent, setIsStudent] = useState(person?.isStudent ?? true);

	const [isFamilyHead, setIsFamilyHead] = useState(
		Boolean(person?.headedFamily),
	);
	const [familyName, setFamilyName] = useState(
		person?.headedFamily?.name ?? "",
	);
	const [familyId, setFamilyId] = useState<string | undefined>(
		person?.familyId ?? undefined,
	);

	const [baptized, setBaptized] = useState(person?.baptized ?? false);
	const [young, setYoung] = useState(person?.young ?? true);
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
	const [cleaning, setCleaning] = useState(person?.cleaning ?? true);

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
	const [privilegePrayer, setPrivilegePrayer] = useState(
		person?.privilegePrayer ?? false,
	);
	const [publicTalk, setPublicTalk] = useState(
		person?.servicePrivilege?.publicTalk ?? false,
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

	const availableFamilies =
		isFamilyHead && person?.headedFamily
			? families.filter((family) => family.id !== person.headedFamily?.id)
			: families;

	useEffect(() => {
		if (state.success) {
			onSuccess();
		}
	}, [state.success, onSuccess]);

	const handleFamilyHeadChange = (checked: boolean) => {
		setIsFamilyHead(checked);

		if (checked) {
			setFamilyId(undefined);
			setFamilyName(person?.headedFamily?.name ?? "");
			return;
		}

		setFamilyName("");
	};

	const handleSexChange = (value: string) => {
		const nextSex: SexValue = value === "FEMALE" ? "FEMALE" : "MALE";
		setSex(nextSex);

		if (nextSex === "FEMALE") {
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
			setLifeAndMinistryChairman(false);
			setWeekendChairman(false);
			setOurChristianLifeAssignment(false);
			setLocalNeeds(false);
			setBibleStudyConductor(false);
			setWatchtowerConductor(false);
		}
	};

	const handleBaptizedChange = (checked: boolean) => {
		setBaptized(checked);

		if (!checked) {
			setBibleStudyReader(false);
			setWatchtowerReader(false);
			setAttendant(false);
			setPrivilegePrayer(false);
			setElder(false);
			setPublicTalk(false);
			setLifeAndMinistryChairman(false);
			setWeekendChairman(false);
			setOurChristianLifeAssignment(false);
			setLocalNeeds(false);
			setBibleStudyConductor(false);
			setWatchtowerConductor(false);
		}
	};

	const handleFamilySelectChange = (value: string) => {
		setFamilyId(value === NO_FAMILY ? undefined : value);
	};

	return (
		<form action={formAction} className="space-y-6">
			<input type="hidden" name="slug" value={slug} />
			{person?.id ? (
				<input type="hidden" name="personId" value={person.id} />
			) : null}
			<input
				type="hidden"
				name="familyId"
				value={isFamilyHead ? "" : (familyId ?? "")}
			/>

			<section className="space-y-4">
				<div className="space-y-2">
					<label htmlFor="person-name" className="text-sm font-medium">
						Nome
					</label>
					<input
						id="person-name"
						name="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						className="w-full rounded-md border px-3 py-2"
						placeholder="Nome da pessoa"
						aria-invalid={Boolean(state.fieldErrors?.name?.length)}
					/>
					<FieldError errors={state.fieldErrors} name="name" />
				</div>

				<div className="space-y-2">
					<label htmlFor="person-sex" className="text-sm font-medium">
						Sexo
					</label>

					<Select name="sex" value={sex} onValueChange={handleSexChange}>
						<SelectTrigger id="person-sex" className="w-full">
							<SelectValue placeholder="Selecione o sexo" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="MALE">Homem</SelectItem>
							<SelectItem value="FEMALE">Mulher</SelectItem>
						</SelectContent>
					</Select>

					<FieldError errors={state.fieldErrors} name="sex" />
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					<SwitchField
						name="isActive"
						label="Ativo"
						description="Controla se a pessoa está ativa."
						checked={isActive}
						onCheckedChange={setIsActive}
					/>
					<SwitchField
						name="isStudent"
						label="Estudante"
						description="Marca a pessoa como estudante."
						checked={isStudent}
						onCheckedChange={setIsStudent}
					/>
				</div>
			</section>

			<section className="space-y-4 rounded-lg border p-4">
				<div className="space-y-1">
					<h3 className="font-medium">Família</h3>
					<p className="text-sm text-muted-foreground">
						Defina se a pessoa é chefe de família ou se pertence a uma família
						existente.
					</p>
				</div>

				<SwitchField
					name="isFamilyHead"
					label="Chefe de família"
					description="Se ativado, a pessoa criará ou editará a família que chefia."
					checked={isFamilyHead}
					onCheckedChange={handleFamilyHeadChange}
				/>

				{isFamilyHead ? (
					<div className="space-y-2">
						<label htmlFor="person-family-name" className="text-sm font-medium">
							Nome da família
						</label>
						<input
							id="person-family-name"
							name="familyName"
							value={familyName}
							onChange={(event) => setFamilyName(event.target.value)}
							className="w-full rounded-md border px-3 py-2"
							placeholder="Ex.: Silva Goulart"
							aria-invalid={Boolean(state.fieldErrors?.familyName?.length)}
						/>
						<FieldError errors={state.fieldErrors} name="familyName" />
					</div>
				) : (
					<div className="space-y-2">
						<label htmlFor="person-family-id" className="text-sm font-medium">
							Família
						</label>

						<Select
							value={familyId ?? NO_FAMILY}
							onValueChange={handleFamilySelectChange}
						>
							<SelectTrigger id="person-family-id" className="w-full">
								<SelectValue placeholder="Sem família" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NO_FAMILY}>Sem família</SelectItem>
								{availableFamilies.length > 0 ? (
									availableFamilies.map((family) => (
										<SelectItem key={family.id} value={family.id}>
											{family.name}
										</SelectItem>
									))
								) : (
									<SelectItem value="__empty" disabled>
										Nenhuma família disponível
									</SelectItem>
								)}
							</SelectContent>
						</Select>

						<FieldError errors={state.fieldErrors} name="familyId" />
					</div>
				)}
			</section>

			<section className="space-y-4 rounded-lg border p-4">
				<div className="space-y-1">
					<h3 className="font-medium">Atributos gerais</h3>
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					<SwitchField
						name="baptized"
						label="Batizada"
						checked={baptized}
						onCheckedChange={handleBaptizedChange}
					/>
					<SwitchField
						name="young"
						label="Jovem"
						checked={young}
						onCheckedChange={setYoung}
					/>
					<SwitchField
						name="initiatingConversations"
						label="Iniciando conversas"
						checked={initiatingConversations}
						onCheckedChange={setInitiatingConversations}
					/>
					<SwitchField
						name="cultivatingInterest"
						label="Cultivando o interesse"
						checked={cultivatingInterest}
						onCheckedChange={setCultivatingInterest}
					/>
					<SwitchField
						name="makingDisciples"
						label="Fazendo discípulos"
						checked={makingDisciples}
						onCheckedChange={setMakingDisciples}
					/>
					<SwitchField
						name="explainingBeliefs"
						label="Explicando suas crenças"
						checked={explainingBeliefs}
						onCheckedChange={setExplainingBeliefs}
					/>
					<SwitchField
						name="cleaning"
						label="Limpeza"
						checked={cleaning}
						onCheckedChange={setCleaning}
					/>
				</div>
			</section>

			{isMale ? (
				<section className="space-y-4 rounded-lg border p-4">
					<div className="space-y-1">
						<h3 className="font-medium">Atribuições masculinas</h3>
					</div>

					<div className="grid gap-3 md:grid-cols-2">
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
				</section>
			) : null}

			{isMaleAndBaptized ? (
				<section className="space-y-4 rounded-lg border p-4">
					<div className="space-y-1">
						<h3 className="font-medium">Masculinos batizados</h3>
					</div>

					<div className="grid gap-3 md:grid-cols-2">
						<SwitchField
							name="bibleStudyReader"
							label="Leitor Estudo Bíblico"
							checked={bibleStudyReader}
							onCheckedChange={setBibleStudyReader}
						/>
						<SwitchField
							name="watchtowerReader"
							label="Leitor A Sentinela"
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
					</div>
				</section>
			) : null}

			{isMaleAndBaptized ? (
				<section className="space-y-4 rounded-lg border p-4">
					<div className="space-y-1">
						<h3 className="font-medium">Privilégio de serviço</h3>
					</div>

					<div className="grid gap-3 md:grid-cols-2">
						<SwitchField
							name="elder"
							label="Ancião"
							checked={elder}
							onCheckedChange={setElder}
						/>
						<SwitchField
							name="publicTalk"
							label="Discurso público"
							checked={publicTalk}
							onCheckedChange={setPublicTalk}
						/>
						<SwitchField
							name="lifeAndMinistryChairman"
							label="Presidente Vida e Ministério"
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
							label="Designação Nossa Vida Cristã"
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
							label="Dirigente Estudo Bíblico"
							checked={bibleStudyConductor}
							onCheckedChange={setBibleStudyConductor}
						/>
						<SwitchField
							name="watchtowerConductor"
							label="Dirigente Estudo Sentinela"
							checked={watchtowerConductor}
							onCheckedChange={setWatchtowerConductor}
						/>
					</div>
				</section>
			) : null}

			{state.message ? (
				<p
					className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}
				>
					{state.message}
				</p>
			) : null}

			<div className="flex justify-end">
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
							? "Criar pessoa"
							: "Salvar alterações"}
				</button>
			</div>
		</form>
	);
}

export function PersonFormDialog({
	slug,
	mode,
	trigger,
	families,
	person,
}: PersonFormDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<span
				onClick={() => setOpen(true)}
				className="inline-flex"
				role="button"
				tabIndex={0}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						setOpen(true);
					}
				}}
			>
				{trigger}
			</span>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>
							{mode === "create" ? "Nova pessoa" : "Editar pessoa"}
						</DialogTitle>
					</DialogHeader>

					<PersonForm
						slug={slug}
						mode={mode}
						person={person}
						families={families}
						onSuccess={() => {
							setOpen(false);
						}}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
