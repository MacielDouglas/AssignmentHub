// import type {
// 	CleaningAssignmentMode,
// 	CleaningType,
// 	CleaningWeekday,
// } from "../schemas/save-cleaning-settings.schema";

// export const CLEANING_TYPES = {
// 	MEETING: "MEETING",
// 	WEEKLY: "WEEKLY",
// 	GENERAL: "GENERAL",
// } as const;

// export const CLEANING_ASSIGNMENT_MODES = {
// 	GROUP: "GROUP",
// 	FAMILY: "FAMILY",
// 	PERSON: "PERSON",
// } as const;

// export const WEEKDAYS = {
// 	MONDAY: "MONDAY",
// 	TUESDAY: "TUESDAY",
// 	WEDNESDAY: "WEDNESDAY",
// 	THURSDAY: "THURSDAY",
// 	FRIDAY: "FRIDAY",
// 	SATURDAY: "SATURDAY",
// 	SUNDAY: "SUNDAY",
// } as const;

// export const CLEANING_TYPE_LABELS: Record<CleaningType, string> = {
// 	MEETING: "Limpeza por reunião",
// 	WEEKLY: "Limpeza semanal",
// 	GENERAL: "Limpeza geral",
// };

// export const CLEANING_ASSIGNMENT_MODE_LABELS: Record<
// 	CleaningAssignmentMode,
// 	string
// > = {
// 	GROUP: "Grupo",
// 	FAMILY: "Família",
// 	PERSON: "Pessoa",
// };

// export const WEEKDAY_LABELS: Record<CleaningWeekday, string> = {
// 	MONDAY: "Segunda",
// 	TUESDAY: "Terça",
// 	WEDNESDAY: "Quarta",
// 	THURSDAY: "Quinta",
// 	FRIDAY: "Sexta",
// 	SATURDAY: "Sábado",
// 	SUNDAY: "Domingo",
// };

// export const WEEKDAY_OPTIONS = Object.entries(WEEKDAY_LABELS).map(
// 	([value, label]) => ({
// 		value: value as CleaningWeekday,
// 		label,
// 	}),
// );

// export const CLEANING_ASSIGNMENT_MODE_OPTIONS = Object.entries(
// 	CLEANING_ASSIGNMENT_MODE_LABELS,
// ).map(([value, label]) => ({
// 	value: value as CleaningAssignmentMode,
// 	label,
// }));
