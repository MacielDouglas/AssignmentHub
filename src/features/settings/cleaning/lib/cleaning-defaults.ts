import type {
	CleaningSectorTargetSex,
	CleaningType,
} from "@/generated/prisma/client";

export type DefaultSector = {
	name: string;
	description: string;
	peopleRequired: number | null;
	allowYoung: boolean;
	targetSex: CleaningSectorTargetSex | null;
	sortOrder: number;
};

const MEETING_TASK_FLOOR =
	"Varra ou aspire o chão. Passe um pano umedecido no chão ou use o mop, se necessário. Para evitar acidentes, faça isso quando houver poucas pessoas no local.";

const MEETING_TASK_BATH =
	"Limpe o vaso sanitário, o mictório e a parede ao redor com desinfetante. Recolha o lixo. Passe um pano com desinfetante no chão. Limpe os espelhos com um pano umedecido com água e detergente. Limpe as pias e torneiras com um pano umedecido e detergente.";

const MEETING_TASK_BATH_FEMALE =
	"Limpe o vaso sanitário e a parede ao redor com desinfetante. Recolha o lixo. Passe um pano com desinfetante no chão. Limpe os espelhos com um pano umedecido com água e detergente. Limpe as pias e torneiras com um pano umedecido e detergente.";

export const DEFAULT_SECTORS: Record<CleaningType, DefaultSector[]> = {
	MEETING: [
		{
			name: "Auditório",
			description: MEETING_TASK_FLOOR,
			peopleRequired: 2,
			allowYoung: true,
			targetSex: null,
			sortOrder: 0,
		},
		{
			name: "Sala B",
			description: MEETING_TASK_FLOOR,
			peopleRequired: 1,
			allowYoung: true,
			targetSex: null,
			sortOrder: 1,
		},
		{
			name: "Banheiro Masculino",
			description: MEETING_TASK_BATH,
			peopleRequired: 1,
			allowYoung: false,
			targetSex: "MALE",
			sortOrder: 2,
		},
		{
			name: "Banheiro Feminino",
			description: MEETING_TASK_BATH_FEMALE,
			peopleRequired: 1,
			allowYoung: false,
			targetSex: "FEMALE",
			sortOrder: 3,
		},
		{
			name: "Banheiro Deficiente",
			description: MEETING_TASK_BATH,
			peopleRequired: 1,
			allowYoung: false,
			targetSex: null,
			sortOrder: 4,
		},
		{
			name: "Abastecimento",
			description:
				"Abasteça os dispensers de papel higiênico, papel toalha, porta-copos, saboneteira e álcool em gel, se necessário.",
			peopleRequired: 1,
			allowYoung: true,
			targetSex: null,
			sortOrder: 5,
		},
		{
			name: "Recolher Lixo",
			description: "Recolha e descarte o lixo.",
			peopleRequired: 1,
			allowYoung: true,
			targetSex: null,
			sortOrder: 6,
		},
	],
	WEEKLY: [
		{
			name: "Teias de aranha",
			description:
				"Retire as teias de aranha do teto e das luminárias com um espanador de cabo extensível.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 0,
		},
		{
			name: "Chão",
			description:
				"Varra ou aspire o chão. Passe um pano umedecido no chão ou use o mop.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 1,
		},
		{
			name: "Portas e Janelas",
			description:
				"Limpe as portas, janelas, vidros e pingadeiras com um pano levemente umedecido, se necessário.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 2,
		},
		{
			name: "Objetos",
			description:
				"Limpe as maçanetas, a tribuna, a mesa do palco, o bebedouro, os interruptores, os balcões e os dispensers de álcool gel usando um pano umedecido com água e detergente.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 3,
		},
		{
			name: "Microfones",
			description:
				"Higienize os microfones e seus cabos com um pano levemente umedecido em água e detergente. Nunca use um pano encharcado.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 4,
		},
		{
			name: "Cadeiras",
			description:
				"Limpe os braços, assentos e encostos das cadeiras com um pano umedecido em água e algumas gotas de detergente.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 5,
		},
		{
			name: "Jardins",
			description:
				"Varra as calçadas. Recolha folhas e sujeira do estacionamento, área externa e jardins.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 6,
		},
		{
			name: "Lavanderia",
			description: "Lave os panos.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 7,
		},
		{
			name: "Esquecidos",
			description: "Retire objetos pessoais deixados no Salão do Reino.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 8,
		},
	],
	GENERAL: [
		{
			name: "Paredes",
			description:
				"Remova manchas das paredes internas e externas usando uma solução de água e detergente neutro e uma esponja macia.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 0,
		},
		{
			name: "Persianas ou cortinas",
			description: "Limpar as persianas ou cortinas.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 1,
		},
		{
			name: "Ventiladores",
			description: "Limpe os ventiladores.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 2,
		},
		{
			name: "Banheiros",
			description:
				"Limpe os revestimentos das paredes e divisórias dos banheiros com pano umedecido e detergente. Limpe as divisórias próximas ao vaso sanitário e mictório (masculino) com um pano umedecido e desinfetante.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 3,
		},
		{
			name: "Grades e portão",
			description: "Limpe as grades e o portão.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 4,
		},
		{
			name: "Jardim",
			description:
				"Corte a grama e remova ervas daninhas dos jardins e do estacionamento. Faça a poda das plantas ornamentais e arbustos.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 5,
		},
		{
			name: "Calçadas",
			description: "Lave as calçadas e outras áreas concretadas.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 6,
		},
		{
			name: "Sala de Limpeza",
			description: "Organize a sala de limpeza e lave as lixeiras.",
			peopleRequired: null,
			allowYoung: true,
			targetSex: null,
			sortOrder: 7,
		},
	],
};

export const CLEANING_TYPE_LABEL: Record<CleaningType, string> = {
	MEETING: "Limpeza a cada reunião",
	WEEKLY: "Limpeza semanal",
	GENERAL: "Limpeza geral",
};

export const FOLLOW_VISIT_META = {
	on: "meta:followVisit=1",
	off: "meta:followVisit=0",
} as const;

export function parseFollowVisit(notes: string | null | undefined): boolean {
	if (!notes) return true;
	if (notes.includes(FOLLOW_VISIT_META.off)) return false;
	return true;
}

export function withFollowVisitMeta(
	notes: string | null | undefined,
	follow: boolean,
): string {
	const base = (notes ?? "")
		.replace(FOLLOW_VISIT_META.on, "")
		.replace(FOLLOW_VISIT_META.off, "")
		.trim();
	const flag = follow ? FOLLOW_VISIT_META.on : FOLLOW_VISIT_META.off;
	return base ? `${flag}\n${base}` : flag;
}
