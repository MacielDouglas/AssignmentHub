import type {
	CleaningSettingsFormConfigMap,
	SectorItem,
	TypeFormState,
} from "../domain/cleaning-settings.types";
import type { CleaningType } from "../schemas/save-cleaning-settings.schema";

function createSector(
	type: CleaningType,
	index: number,
	input: Omit<SectorItem, "clientKey" | "sortOrder">,
): SectorItem {
	return {
		...input,
		clientKey: `${type}-default-${index}`,
		sortOrder: index,
	};
}

export function createSuggestedConfig(type: CleaningType): TypeFormState {
	if (type === "MEETING") {
		return {
			type,
			enabled: false,
			assignmentMode: "GROUP",
			notes: "Tarefas a serem realizadas após cada reunião.",
			timesPerWeek: "2",
			weekdays: ["WEDNESDAY", "SATURDAY"],
			dates: [],
			sectors: [
				createSector(type, 0, {
					name: "Varra ou aspire o chão",
					description:
						"Passe um pano umedecido no chão ou use o mop, se necessário.",
					peopleRequired: "2",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 1, {
					name: "Banheiro masculino",
					description:
						"Limpe o vaso sanitário, o mictório e a parede ao redor com desinfetante. Recolha o lixo. Passe um pano com desinfetante no chão.",
					peopleRequired: "1",
					allowYoung: true,
					targetSex: "MALE",
					isActive: true,
				}),
				createSector(type, 2, {
					name: "Banheiro feminino",
					description:
						"Limpe o vaso sanitário e a parede ao redor com desinfetante. Recolha o lixo. Passe um pano com desinfetante no chão.",
					peopleRequired: "1",
					allowYoung: true,
					targetSex: "FEMALE",
					isActive: true,
				}),
				createSector(type, 3, {
					name: "Abastecimento",
					description:
						"Abasteça os dispensers de papel higiênico, papel toalha, porta-copos, saboneteira e álcool em gel, se necessário.",
					peopleRequired: "1",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 4, {
					name: "Lixo",
					description: "Recolha e descarte o lixo.",
					peopleRequired: "1",
					allowYoung: true,
					isActive: true,
				}),
			],
		};
	}

	if (type === "WEEKLY") {
		return {
			type,
			enabled: false,
			assignmentMode: "GROUP",
			notes: "Limpeza Semanal",
			timesPerWeek: "1",
			weekdays: ["SATURDAY"],
			dates: [],
			sectors: [
				createSector(type, 0, {
					name: "Teias de aranha",
					description:
						"Retire as teias de aranha do teto e das luminárias com um espanador de cabo extensível.",
					peopleRequired: "2",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 1, {
					name: "Varrer chão",
					description:
						"Varra ou aspire o chão. Passe um pano umedecido no chão ou use o mop.",
					peopleRequired: "2",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 2, {
					name: "Portas e janelas",
					description:
						"Limpe as portas, janelas, vidros e pingadeiras com um pano levemente umedecido, se necessário.",
					peopleRequired: "4",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 3, {
					name: "Moveis",
					description:
						"Limpe as maçanetas, a tribuna, a mesa do palco, o bebedouro os interruptores, os balcões e os dispensers de álcool gel usando um pano umedecido com água e detergente.",
					peopleRequired: "2",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 4, {
					name: "Microfones",
					description:
						"Higienize os microfones e seus cabos com um pano levemente umedecido em água e detergente. Nunca use um pano encharcado.",
					peopleRequired: "1",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 5, {
					name: "Cadeiras",
					description:
						"Limpe os braços, assentos e encostos das cadeiras com um pano umedecido em água e algumas gotas de detergente.",
					peopleRequired: "4",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 6, {
					name: "Calçadas",
					description:
						"Varra as calçadas. Recolha folhas e sujeira do estacionamento, área externa e jardins.",
					peopleRequired: "2",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 7, {
					name: "Panos",
					description: "Lave os panos.",
					peopleRequired: "1",
					allowYoung: true,
					isActive: true,
				}),
				createSector(type, 8, {
					name: "Objetos",
					description: "Retire objetos pessoais deixados no Salão do Reino.",
					peopleRequired: "1",
					allowYoung: true,
					isActive: true,
				}),
			],
		};
	}

	return {
		type,
		enabled: false,
		assignmentMode: "GROUP",
		notes:
			"Essa é uma limpeza mais completa, que pode envolver toda a congregação ou vários grupos de saída de campo. Deve ser realizada conforme a necessidade, no mínimo uma vez por ano.",
		timesPerWeek: "",
		weekdays: [],
		dates: [],
		sectors: [
			createSector(type, 0, {
				name: "Paredes",
				description:
					"Remova manchas das paredes internas e externas usando uma solução de água e detergente neutro e uma esponja macia.",
				peopleRequired: "4",
				allowYoung: false,
				isActive: true,
			}),
			createSector(type, 1, {
				name: "Persinas ou Cortinas",
				description: "Limpe as persianas ou cortinas.",
				peopleRequired: "2",
				allowYoung: false,
				isActive: true,
			}),
			createSector(type, 2, {
				name: "Ventiladores",
				description: "Limpe os ventiladores.",
				peopleRequired: "2",
				allowYoung: false,
				isActive: true,
			}),
			createSector(type, 3, {
				name: "Banheiros",
				description:
					"Limpe os revestimentos das paredes e divisórias dos banheiros com pano umedecido e detergente. Limpe as divisórias próximas ao vaso sanitário e mictório com um pano umedecido e desinfetante.",
				peopleRequired: "4",
				allowYoung: false,
				isActive: true,
			}),
			createSector(type, 4, {
				name: "Grades",
				description: "Limpe as grades e o portão.",
				peopleRequired: "2",
				allowYoung: false,
				isActive: true,
			}),
			createSector(type, 5, {
				name: "Jardim",
				description:
					"Corte a grama e remova ervas daninhas dos jardins e do estacionamento. Faça a poda das plantas ornamentais e arbustos.",
				peopleRequired: "4",
				allowYoung: false,
				isActive: true,
			}),
			createSector(type, 6, {
				name: "Calçadas",
				description: "Lave as calçadas e outras áreas concretadas.",
				peopleRequired: "2",
				allowYoung: false,
				isActive: true,
			}),
			createSector(type, 7, {
				name: "Sala de limpeza",
				description: "Organize a sala de limpeza e lave as lixeiras.",
				peopleRequired: "2",
				allowYoung: false,
				isActive: true,
			}),
		],
	};
}

export function createSuggestedConfigMap(): CleaningSettingsFormConfigMap {
	return {
		MEETING: createSuggestedConfig("MEETING"),
		WEEKLY: createSuggestedConfig("WEEKLY"),
		GENERAL: createSuggestedConfig("GENERAL"),
	};
}
