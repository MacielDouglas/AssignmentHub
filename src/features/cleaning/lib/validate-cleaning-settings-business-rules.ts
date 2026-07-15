import type { SaveCleaningSettingsInput } from "../schemas/save-cleaning-settings.schema";

const TYPE_LABEL: Record<
	SaveCleaningSettingsInput["configs"][number]["type"],
	string
> = {
	MEETING: "Limpeza por reunião",
	WEEKLY: "Limpeza semanal",
	GENERAL: "Limpeza geral",
};

export function validateCleaningSettingsBusinessRules(
	input: SaveCleaningSettingsInput,
) {
	const errors: string[] = [];

	for (const config of input.configs) {
		if (!config.enabled) {
			continue;
		}

		if (!config.assignmentMode) {
			errors.push(
				`${TYPE_LABEL[config.type]}: selecione o modo de designação.`,
			);
		}

		if (config.type === "MEETING" || config.type === "WEEKLY") {
			if (config.timesPerWeek == null) {
				errors.push(
					`${TYPE_LABEL[config.type]}: informe quantas vezes por semana.`,
				);
			} else {
				if (config.timesPerWeek < 1 || config.timesPerWeek > 7) {
					errors.push(
						`${TYPE_LABEL[config.type]}: a frequência semanal deve estar entre 1 e 7.`,
					);
				}

				if (config.weekdays.length !== config.timesPerWeek) {
					errors.push(
						`${TYPE_LABEL[config.type]}: a quantidade de dias selecionados deve ser igual à frequência semanal.`,
					);
				}
			}
		}

		if (config.type === "GENERAL") {
			if (config.dates.length === 0) {
				errors.push("Limpeza geral: selecione pelo menos uma data.");
			}
		}

		for (const [index, sector] of config.sectors.entries()) {
			if (!sector.name.trim()) {
				errors.push(
					`${TYPE_LABEL[config.type]}: o setor ${index + 1} precisa ter um nome.`,
				);
			}
		}
	}

	const enabledMap = {
		MEETING: input.cleaningPerMeeting,
		WEEKLY: input.weeklyCleaning,
		GENERAL: input.generalCleaning,
	};

	for (const config of input.configs) {
		if (enabledMap[config.type] !== config.enabled) {
			errors.push(
				`${TYPE_LABEL[config.type]}: estado de ativação inconsistente entre resumo e configuração.`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
