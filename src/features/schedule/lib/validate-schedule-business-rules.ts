import type { SaveScheduleSettingsInput } from "../schemas/save-schedule-settings.schema";

function startOfDay(date: Date) {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

function diffInDays(start: Date, end: Date) {
	const ms = startOfDay(end).getTime() - startOfDay(start).getTime();
	return Math.round(ms / 86400000);
}

function getWeekKey(date: Date) {
	const copy = startOfDay(date);
	const day = copy.getDay();
	const diff = (day + 6) % 7;
	copy.setDate(copy.getDate() - diff);
	return copy.toISOString().slice(0, 10);
}

export function validateScheduleBusinessRules(
	input: SaveScheduleSettingsInput,
) {
	const errors: string[] = [];
	const meetings = input.items.filter((item) => item.type === "MEETINGS");
	const specialMeetings = input.items.filter(
		(item) => item.type === "SPECIAL_MEETING",
	);
	const weeklyCleaning = input.items.filter(
		(item) => item.type === "WEEKLY_CLEANING",
	);

	const rangeBlockers = input.items.filter((item) =>
		[
			"CONVENTION",
			"CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER",
			"CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE",
		].includes(item.type),
	);

	for (const item of meetings) {
		if (item.mode !== "WEEKLY_RECURRING") {
			errors.push("Reuniões devem usar modo semanal recorrente.");
		}

		if (item.weeklyRules.length !== 2) {
			errors.push("Reuniões devem ter exatamente 2 dias/horários por semana.");
		}

		if (item.occurrences.length > 0) {
			errors.push("Reuniões recorrentes não devem salvar ocorrências avulsas.");
		}
	}

	if (meetings.length > 2) {
		errors.push(
			"Existem muitas versões de reuniões. Mantenha somente a atual e a futura.",
		);
	}

	for (const item of specialMeetings) {
		if (item.mode !== "MULTIPLE_DATETIME") {
			errors.push("Reunião especial deve usar múltiplas datas com horário.");
		}

		if (item.weeklyRules.length > 0) {
			errors.push("Reunião especial não deve possuir regra semanal.");
		}

		for (const occurrence of item.occurrences) {
			const day = occurrence.startDate.getDay();
			if (day !== 0 && day !== 6) {
				errors.push("Reunião especial deve ocorrer sempre no fim de semana.");
			}
		}
	}

	for (const item of input.items) {
		if (item.type === "CONVENTION") {
			if (item.mode !== "DATE_RANGE") {
				errors.push("Congresso deve usar intervalo de datas.");
			}

			for (const occurrence of item.occurrences) {
				if (
					!occurrence.endDate ||
					diffInDays(occurrence.startDate, occurrence.endDate) !== 2
				) {
					errors.push("Congresso deve durar exatamente 3 dias.");
				}
			}
		}

		if (item.type === "TRAVELING_OVERSEER_VISIT") {
			if (item.mode !== "DATE_RANGE") {
				errors.push("Visita do viajante deve usar intervalo de datas.");
			}

			for (const occurrence of item.occurrences) {
				if (
					!occurrence.endDate ||
					diffInDays(occurrence.startDate, occurrence.endDate) !== 5
				) {
					errors.push("Visita do viajante deve durar exatamente 6 dias.");
				}
			}
		}
	}

	const weeklyCleaningWeekMap = new Set<string>();

	for (const item of weeklyCleaning) {
		for (const occurrence of item.occurrences) {
			const weekKey = getWeekKey(occurrence.startDate);

			if (weeklyCleaningWeekMap.has(weekKey)) {
				errors.push(
					"Limpeza semanal permite no máximo uma ocorrência por semana.",
				);
			}

			weeklyCleaningWeekMap.add(weekKey);
		}
	}

	const blockedDays = new Set<string>();

	for (const item of rangeBlockers) {
		for (const occurrence of item.occurrences) {
			if (!occurrence.endDate) continue;

			const current = startOfDay(occurrence.startDate);
			const end = startOfDay(occurrence.endDate);

			while (current <= end) {
				blockedDays.add(current.toISOString().slice(0, 10));
				current.setDate(current.getDate() + 1);
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
