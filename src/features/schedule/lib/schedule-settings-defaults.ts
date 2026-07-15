import type {
	OccurrenceFormState,
	ScheduleItemFormState,
} from "../domain/schedule-settings.types";
import type { ScheduleType } from "../schemas/save-schedule-settings.schema";

function createId(type: ScheduleType) {
	return `${type.toLowerCase()}-default`;
}

function emptyOccurrence(
	type: ScheduleType,
	index: number,
): OccurrenceFormState {
	return {
		clientKey: `occ-${type}-${index}-${crypto.randomUUID()}`,
		type,
		startDate: "",
		endDate: "",
		time: "",
		isAllDay: false,
		leaderPersonId: "",
		location: "",
		notes: "",
		sortOrder: index,
	};
}

export function createDefaultScheduleItems(): ScheduleItemFormState[] {
	return [
		{
			clientKey: createId("MEETINGS"),
			type: "MEETINGS",
			mode: "WEEKLY_RECURRING",
			title: "Reuniões",
			description: "Agenda semanal principal da congregação.",
			isActive: true,
			weeklyRules: [
				{ weekday: "THURSDAY", time: "19:00", sortOrder: 0 },
				{ weekday: "SATURDAY", time: "18:00", sortOrder: 1 },
			],
			occurrences: [],
		},
		{
			clientKey: createId("SPECIAL_MEETING"),
			type: "SPECIAL_MEETING",
			mode: "MULTIPLE_DATETIME",
			title: "Reunião especial",
			description: "Substitui a reunião de fim de semana correspondente.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("SPECIAL_MEETING", 0)],
		},
		{
			clientKey: createId("TRAVELING_OVERSEER_VISIT"),
			type: "TRAVELING_OVERSEER_VISIT",
			mode: "DATE_RANGE",
			title: "Visita viajante",
			description: "Evento com duração de seis dias.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("TRAVELING_OVERSEER_VISIT", 0)],
		},
		{
			clientKey: createId("CELEBRATION"),
			type: "CELEBRATION",
			mode: "SINGLE_DATETIME",
			title: "Celebração",
			description: "Evento único anual com data e horário.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("CELEBRATION", 0)],
		},
		{
			clientKey: createId("SPECIAL_TALK"),
			type: "SPECIAL_TALK",
			mode: "MULTIPLE_DATES",
			title: "Discurso especial",
			description: "Pode ocorrer várias vezes no ano.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("SPECIAL_TALK", 0)],
		},
		{
			clientKey: createId("CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER"),
			type: "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
			mode: "MULTIPLE_DATES",
			title: "Assembleia com viajante",
			description: "Evento de dia inteiro.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER", 0)],
		},
		{
			clientKey: createId("CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE"),
			type: "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
			mode: "MULTIPLE_DATES",
			title: "Assembleia com representante",
			description: "Evento de dia inteiro.",
			isActive: false,
			weeklyRules: [],
			occurrences: [
				emptyOccurrence("CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE", 0),
			],
		},
		{
			clientKey: createId("CONVENTION"),
			type: "CONVENTION",
			mode: "DATE_RANGE",
			title: "Congresso",
			description: "Evento anual com duração de três dias.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("CONVENTION", 0)],
		},
		{
			clientKey: createId("WEEKLY_CLEANING"),
			type: "WEEKLY_CLEANING",
			mode: "MULTIPLE_DATETIME",
			title: "Limpeza semanal",
			description: "No máximo uma ocorrência por semana.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("WEEKLY_CLEANING", 0)],
		},
		{
			clientKey: createId("GENERAL_CLEANING"),
			type: "GENERAL_CLEANING",
			mode: "MULTIPLE_DATETIME",
			title: "Limpeza geral",
			description: "Pode ocorrer várias vezes no ano.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("GENERAL_CLEANING", 0)],
		},
	];
}
