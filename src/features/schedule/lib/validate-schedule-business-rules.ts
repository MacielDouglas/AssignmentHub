import type { SaveScheduleSettingsInput } from "../schemas/save-schedule-settings.schema";

function startOfDay(date: Date) {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

function getWeekKeyMondayToSunday(date: Date) {
	const copy = startOfDay(date);
	const day = copy.getDay();
	const diff = (day + 6) % 7;
	copy.setDate(copy.getDate() - diff);
	return copy.toISOString().slice(0, 10);
}

function getYear(date: Date) {
	return startOfDay(date).getFullYear();
}

function isWeekend(date: Date) {
	const day = startOfDay(date).getDay();
	return day === 0 || day === 6;
}

export function validateScheduleBusinessRules(
	input: SaveScheduleSettingsInput,
) {
	const errors: string[] = [];

	const meetings = input.items.filter((item) => item.type === "MEETINGS");
	const weeklyCleaningItems = input.items.filter(
		(item) => item.type === "WEEKLY_CLEANING",
	);
	const conventions = input.items.filter((item) => item.type === "CONVENTION");
	const celebrations = input.items.filter(
		(item) => item.type === "CELEBRATION",
	);

	if (meetings.length > 2) {
		errors.push(
			"Mantenha no máximo a agenda atual e a agenda opcional do próximo ano.",
		);
	}

	const nextYearMeetings = meetings.filter(
		(item) => item.variant === "NEXT_YEAR",
	);
	if (nextYearMeetings.length > 1) {
		errors.push("Pode existir apenas uma agenda de reuniões do próximo ano.");
	}

	for (const item of meetings) {
		if (item.mode !== "WEEKLY_RECURRING") {
			errors.push("Reuniões devem usar modo semanal recorrente.");
		}

		if (item.weeklyRules.length < 1 || item.weeklyRules.length > 2) {
			errors.push("Reuniões devem ter de 1 a 2 regras semanais.");
		}

		if (item.occurrences.length > 0) {
			errors.push("Reuniões semanais não devem possuir ocorrências avulsas.");
		}

		if (item.variant === "NEXT_YEAR") {
			if (!item.effectiveFromYear) {
				errors.push("Informe o ano de vigência da agenda do próximo ano.");
			}

			if (
				item.effectiveFromYear &&
				item.effectiveFromYear < new Date().getFullYear()
			) {
				errors.push(
					"O ano da agenda futura não pode ser anterior ao ano atual.",
				);
			}
		}
	}

	for (const item of input.items) {
		if (item.type === "SPECIAL_MEETING") {
			if (item.mode !== "MULTIPLE_DATETIME") {
				errors.push("Reunião especial deve usar múltiplas datas com horário.");
			}

			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (!occurrence.time && !occurrence.isAllDay) {
					errors.push(
						"Reunião especial deve ter horário quando não for marcada como dia inteiro.",
					);
				}

				if (!isWeekend(occurrence.startDate)) {
					errors.push("Reunião especial deve ocorrer no fim de semana.");
				}
			}
		}

		if (item.type === "WEEKLY_CLEANING") {
			if (item.mode !== "MULTIPLE_DATETIME") {
				errors.push("Limpeza semanal deve usar múltiplas datas com horário.");
			}

			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (!occurrence.time) {
					errors.push("Limpeza semanal deve ter horário.");
				}

				if (!occurrence.location) {
					errors.push("Limpeza semanal deve informar local.");
				}

				if (occurrence.isAllDay) {
					errors.push("Limpeza semanal não pode ser marcada como dia inteiro.");
				}
			}
		}

		if (item.type === "GENERAL_CLEANING") {
			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (!occurrence.time) {
					errors.push("Limpeza geral deve ter horário.");
				}

				if (!occurrence.location) {
					errors.push("Limpeza geral deve informar local.");
				}

				if (occurrence.isAllDay) {
					errors.push("Limpeza geral não pode ser marcada como dia inteiro.");
				}
			}
		}

		if (item.type === "TRAVELING_OVERSEER_VISIT") {
			if (item.mode !== "DATE_RANGE") {
				errors.push("Visita do viajante deve usar intervalo de datas.");
			}

			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (!occurrence.endDate) {
					errors.push("Visita do viajante deve informar data final.");
				}
			}
		}

		if (item.type === "SPECIAL_TALK") {
			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (occurrence.endDate) {
					errors.push("Discurso especial não deve ter data final.");
				}
			}
		}

		if (
			item.type === "CIRCUIT_ASSEMBLY_BRANCH_REPRESENTATIVE" ||
			item.type === "CIRCUIT_ASSEMBLY_TRAVELING_OVERSEER"
		) {
			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (!occurrence.isAllDay) {
					errors.push(
						"Assembleias devem ser sempre marcadas como dia inteiro.",
					);
				}
			}
		}

		if (item.type === "CONVENTION") {
			if (item.mode !== "DATE_RANGE") {
				errors.push("Congresso deve usar intervalo de datas.");
			}

			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (!occurrence.endDate) {
					errors.push("Congresso deve informar data final.");
				}
			}
		}

		if (item.type === "CELEBRATION") {
			if (item.mode !== "SINGLE_DATETIME") {
				errors.push("Celebração deve usar data e horário únicos.");
			}

			for (const occurrence of item.occurrences) {
				if (!occurrence.startDate) continue;

				if (!occurrence.time) {
					errors.push("Celebração deve informar horário.");
				}
			}
		}
	}

	const weeklyCleaningWeekMap = new Set<string>();

	for (const item of weeklyCleaningItems) {
		for (const occurrence of item.occurrences) {
			if (!occurrence.startDate) continue;

			const weekKey = getWeekKeyMondayToSunday(occurrence.startDate);

			if (weeklyCleaningWeekMap.has(weekKey)) {
				errors.push(
					"Limpeza semanal permite no máximo uma ocorrência por semana.",
				);
			}

			weeklyCleaningWeekMap.add(weekKey);
		}
	}

	const conventionYears = new Set<number>();
	for (const item of conventions) {
		for (const occurrence of item.occurrences) {
			if (!occurrence.startDate) continue;

			const year = getYear(occurrence.startDate);

			if (conventionYears.has(year)) {
				errors.push("Congresso pode ocorrer apenas uma vez por ano.");
			}

			conventionYears.add(year);
		}
	}

	const celebrationYears = new Set<number>();
	for (const item of celebrations) {
		for (const occurrence of item.occurrences) {
			if (!occurrence.startDate) continue;

			const year = getYear(occurrence.startDate);

			if (celebrationYears.has(year)) {
				errors.push("Celebração pode ocorrer apenas uma vez por ano.");
			}

			celebrationYears.add(year);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
