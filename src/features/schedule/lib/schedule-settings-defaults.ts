import type {
	OccurrenceFormState,
	ScheduleItemFormState,
} from "../domain/schedule-settings.types";
import type {
	ScheduleType,
	ScheduleVariant,
} from "../schemas/save-schedule-settings.schema";

function createId(type: ScheduleType, variant: ScheduleVariant = "DEFAULT") {
	return `${type.toLowerCase()}-${variant.toLowerCase()}-default`;
}

function emptyOccurrence(
	type: ScheduleType,
	index: number,
	isAllDay = false,
): OccurrenceFormState {
	return {
		clientKey: `occ-${type}-${index}-${crypto.randomUUID()}`,
		type,
		startDate: "",
		endDate: "",
		time: "",
		isAllDay,
		leaderPersonId: "",
		location: "",
		notes: "",
		sortOrder: index,
	};
}

function createItem(
	type: ScheduleType,
	config: Partial<ScheduleItemFormState>,
): ScheduleItemFormState {
	return {
		clientKey: createId(type, config.variant),
		type,
		variant: config.variant ?? "DEFAULT",
		effectiveFromYear: config.effectiveFromYear ?? null,
		mode: config.mode ?? "SINGLE_DATETIME",
		title: config.title ?? "",
		description: config.description ?? "",
		isActive: config.isActive ?? false,
		weeklyRules: config.weeklyRules ?? [],
		occurrences: config.occurrences ?? [],
	};
}

export function createDefaultScheduleItems(): ScheduleItemFormState[] {
	return [
		createItem("MEETINGS", {
			variant: "DEFAULT",
			mode: "WEEKLY_RECURRING",
			title: "Reuniões",
			description: "Agenda semanal principal da congregação.",
			isActive: true,
			weeklyRules: [
				{ weekday: "THURSDAY", time: "19:00", sortOrder: 0 },
				{ weekday: "SATURDAY", time: "18:00", sortOrder: 1 },
			],
			occurrences: [],
		}),
		createItem("MEETINGS", {
			variant: "NEXT_YEAR",
			effectiveFromYear: new Date().getFullYear() + 1,
			mode: "WEEKLY_RECURRING",
			title: "Reuniões do próximo ano",
			description:
				"Agenda semanal opcional que entra em vigor em 01/01 do ano informado.",
			isActive: true,
			weeklyRules: [
				{ weekday: "THURSDAY", time: "19:00", sortOrder: 0 },
				{ weekday: "SATURDAY", time: "18:00", sortOrder: 1 },
			],
			occurrences: [],
		}),
		createItem("SPECIAL_MEETING", {
			mode: "MULTIPLE_DATETIME",
			title: "Reunião especial",
			description:
				"Pode substituir uma reunião. Permite várias ocorrências no ano.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("SPECIAL_MEETING", 0)],
		}),
		createItem("TRAVELING_OVERSEER_VISIT", {
			mode: "DATE_RANGE",
			title: "Visita do viajante",
			description: "Pode ocorrer várias vezes no ano com data inicial e final.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("TRAVELING_OVERSEER_VISIT", 0)],
		}),
		createItem("CELEBRATION", {
			mode: "SINGLE_DATETIME",
			title: "Celebração",
			description:
				"Ocorre apenas uma vez ao ano com data, horário e observações.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("CELEBRATION", 0)],
		}),
		createItem("SPECIAL_TALK", {
			mode: "MULTIPLE_DATES",
			title: "Discurso especial",
			description: "Pode ocorrer várias vezes no ano com data e observações.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("SPECIAL_TALK", 0)],
		}),
		createItem("CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER", {
			mode: "MULTIPLE_DATES",
			title: "Assembleia com viajante",
			description: "Evento de dia inteiro com data e observações.",
			isActive: false,
			weeklyRules: [],
			occurrences: [
				emptyOccurrence("CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER", 0, true),
			],
		}),
		createItem("CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE", {
			mode: "MULTIPLE_DATES",
			title: "Assembleia com representante",
			description: "Evento de dia inteiro com data e observações.",
			isActive: false,
			weeklyRules: [],
			occurrences: [
				emptyOccurrence("CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE", 0, true),
			],
		}),
		createItem("CONVENTION", {
			mode: "DATE_RANGE",
			title: "Congresso",
			description:
				"Ocorre apenas uma vez por ano com data inicial, final e observações.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("CONVENTION", 0)],
		}),
		createItem("WEEKLY_CLEANING", {
			mode: "MULTIPLE_DATETIME",
			title: "Limpeza semanal",
			description:
				"No máximo uma ocorrência por semana, com local e observações.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("WEEKLY_CLEANING", 0)],
		}),
		createItem("GENERAL_CLEANING", {
			mode: "MULTIPLE_DATETIME",
			title: "Limpeza geral",
			description: "Pode ocorrer poucas vezes no ano com local e observações.",
			isActive: false,
			weeklyRules: [],
			occurrences: [emptyOccurrence("GENERAL_CLEANING", 0)],
		}),
	];
}
