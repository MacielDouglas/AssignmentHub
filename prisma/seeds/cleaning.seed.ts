import {
	CleaningAssignmentMode,
	CleaningType,
	Weekday,
} from "@/generated/prisma/client";
import { logSeedStep, prisma } from "./utils";

type SectorSeed = {
	name: string;
	description?: string | null;
	peopleRequired?: number | null;
	sortOrder: number;
};

const meetingSectors: SectorSeed[] = [
	{
		name: "Varrer ou aspirar o chão",
		description: "Passe um pano umedecido no chão ou use mop se necessário.",
		peopleRequired: 2,
		sortOrder: 1,
	},
	{
		name: "Limpar banheiro",
		description:
			"Limpe o vaso sanitário, o mictório e a parede ao redor com desinfetante. Recolha o lixo. Passe um pano com desinfetante no chão. Limpe os espelhos, pias e torneiras.",
		peopleRequired: 2,
		sortOrder: 2,
	},
	{
		name: "Abastecer dispensers",
		description:
			"Papel higiênico, papel toalha, porta-copos, saboneteira e álcool em gel, se necessário.",
		peopleRequired: 1,
		sortOrder: 3,
	},
	{
		name: "Recolher e descartar o lixo",
		description: null,
		peopleRequired: 1,
		sortOrder: 4,
	},
];

const weeklySectors: SectorSeed[] = [
	{
		name: "Retirar teias de aranha",
		description: null,
		peopleRequired: null,
		sortOrder: 1,
	},
	{
		name: "Varrer ou aspirar chão e passar pano umedecido",
		description: null,
		peopleRequired: null,
		sortOrder: 2,
	},
	{
		name: "Limpar portas, janelas, vidros e pingadeiras",
		description: "Com pano levemente umedecido, se necessário.",
		peopleRequired: null,
		sortOrder: 3,
	},
	{
		name: "Limpar maçanetas, tribuna, mesa do palco, bebedouro, interruptores, balcões e dispensers de álcool gel",
		description: "Usando pano umedecido com água e detergente.",
		peopleRequired: null,
		sortOrder: 4,
	},
	{
		name: "Higienizar microfones e cabos",
		description: "Nunca use um pano encharcado.",
		peopleRequired: null,
		sortOrder: 5,
	},
	{
		name: "Limpar braços, assentos e encostos das cadeiras",
		description: "Use pano umedecido em água e algumas gotas de detergente.",
		peopleRequired: null,
		sortOrder: 6,
	},
	{
		name: "Varrer as calçadas e recolher sujeira da área externa",
		description: "Inclui estacionamento, área externa e jardins.",
		peopleRequired: null,
		sortOrder: 7,
	},
	{
		name: "Lavar panos",
		description: null,
		peopleRequired: null,
		sortOrder: 8,
	},
	{
		name: "Remover objetos",
		description: null,
		peopleRequired: null,
		sortOrder: 9,
	},
];

const generalSectors: SectorSeed[] = [
	{
		name: "Remover manchas das paredes",
		description: null,
		peopleRequired: null,
		sortOrder: 1,
	},
	{
		name: "Limpar persianas e cortinas",
		description: null,
		peopleRequired: null,
		sortOrder: 2,
	},
	{
		name: "Limpar ventiladores",
		description: null,
		peopleRequired: null,
		sortOrder: 3,
	},
	{
		name: "Limpar revestimentos das paredes e divisórias dos banheiros",
		description: null,
		peopleRequired: null,
		sortOrder: 4,
	},
	{
		name: "Limpar grades e portão",
		description: null,
		peopleRequired: null,
		sortOrder: 5,
	},
	{
		name: "Cortar a grama e remover ervas daninhas",
		description: null,
		peopleRequired: null,
		sortOrder: 6,
	},
	{
		name: "Lavar calçadas e outras áreas concretadas",
		description: null,
		peopleRequired: null,
		sortOrder: 7,
	},
	{
		name: "Organizar a sala de limpeza e lavar as lixeiras",
		description: null,
		peopleRequired: null,
		sortOrder: 8,
	},
];

async function replaceWeekdays(
	cleaningTypeConfigId: string,
	weekdays: { weekday: Weekday; sortOrder: number }[],
) {
	await prisma.cleaningWeekday.deleteMany({
		where: { cleaningTypeConfigId },
	});

	if (weekdays.length > 0) {
		await prisma.cleaningWeekday.createMany({
			data: weekdays.map((item) => ({
				cleaningTypeConfigId,
				weekday: item.weekday,
				sortOrder: item.sortOrder,
			})),
		});
	}
}

async function replaceSectors(
	cleaningTypeConfigId: string,
	sectors: SectorSeed[],
) {
	await prisma.cleaningSector.deleteMany({
		where: { cleaningTypeConfigId },
	});

	if (sectors.length > 0) {
		await prisma.cleaningSector.createMany({
			data: sectors.map((sector) => ({
				cleaningTypeConfigId,
				name: sector.name,
				description: sector.description ?? null,
				peopleRequired: sector.peopleRequired ?? null,
				sortOrder: sector.sortOrder,
			})),
		});
	}
}

async function seedCleaningForOrganization(organizationId: string) {
	const settings = await prisma.organizationCleaningSettings.upsert({
		where: { organizationId },
		update: {
			cleaningPerMeeting: true,
			weeklyCleaning: true,
			generalCleaning: true,
		},
		create: {
			organizationId,
			cleaningPerMeeting: true,
			weeklyCleaning: true,
			generalCleaning: true,
		},
		select: { id: true },
	});

	const meetingConfig = await prisma.cleaningTypeConfig.upsert({
		where: {
			settingsId_type: {
				settingsId: settings.id,
				type: CleaningType.MEETING,
			},
		},
		update: {
			enabled: true,
			assignmentMode: CleaningAssignmentMode.PERSON,
			timesPerWeek: 2,
			timesPerYear: null,
			intervalDays: null,
			notes: "Limpeza após cada reunião.",
			groupId: null,
			familyId: null,
			personId: null,
		},
		create: {
			settingsId: settings.id,
			type: CleaningType.MEETING,
			enabled: true,
			assignmentMode: CleaningAssignmentMode.PERSON,
			timesPerWeek: 2,
			notes: "Limpeza após cada reunião.",
		},
		select: { id: true },
	});

	const weeklyConfig = await prisma.cleaningTypeConfig.upsert({
		where: {
			settingsId_type: {
				settingsId: settings.id,
				type: CleaningType.WEEKLY,
			},
		},
		update: {
			enabled: true,
			assignmentMode: CleaningAssignmentMode.FAMILY,
			timesPerWeek: 1,
			timesPerYear: null,
			intervalDays: null,
			notes: "Limpeza semanal.",
			groupId: null,
			familyId: null,
			personId: null,
		},
		create: {
			settingsId: settings.id,
			type: CleaningType.WEEKLY,
			enabled: true,
			assignmentMode: CleaningAssignmentMode.FAMILY,
			timesPerWeek: 1,
			notes: "Limpeza semanal.",
		},
		select: { id: true },
	});

	const generalConfig = await prisma.cleaningTypeConfig.upsert({
		where: {
			settingsId_type: {
				settingsId: settings.id,
				type: CleaningType.GENERAL,
			},
		},
		update: {
			enabled: true,
			assignmentMode: CleaningAssignmentMode.GROUP,
			timesPerWeek: null,
			timesPerYear: 2,
			intervalDays: null,
			notes: "Limpeza geral conforme necessidade.",
			groupId: null,
			familyId: null,
			personId: null,
		},
		create: {
			settingsId: settings.id,
			type: CleaningType.GENERAL,
			enabled: true,
			assignmentMode: CleaningAssignmentMode.GROUP,
			timesPerYear: 2,
			notes: "Limpeza geral conforme necessidade.",
		},
		select: { id: true },
	});

	await prisma.cleaningDate.deleteMany({
		where: {
			cleaningTypeConfigId: {
				in: [meetingConfig.id, weeklyConfig.id, generalConfig.id],
			},
		},
	});

	await replaceWeekdays(meetingConfig.id, [
		{ weekday: Weekday.THURSDAY, sortOrder: 1 },
		{ weekday: Weekday.SUNDAY, sortOrder: 2 },
	]);

	await replaceWeekdays(weeklyConfig.id, [
		{ weekday: Weekday.SATURDAY, sortOrder: 1 },
	]);

	await replaceWeekdays(generalConfig.id, []);

	await replaceSectors(meetingConfig.id, meetingSectors);
	await replaceSectors(weeklyConfig.id, weeklySectors);
	await replaceSectors(generalConfig.id, generalSectors);
}

export async function seedCleaningSettings() {
	logSeedStep("Aplicando configurações de limpeza...");

	const organizations = await prisma.organization.findMany({
		select: {
			id: true,
			name: true,
		},
		orderBy: {
			name: "asc",
		},
	});

	for (const organization of organizations) {
		logSeedStep(`Configurando limpeza: ${organization.name}`);
		await seedCleaningForOrganization(organization.id);
	}

	logSeedStep("Configurações de limpeza concluídas.");
}
