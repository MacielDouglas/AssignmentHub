import { z } from "zod";

const maleOnlyFields = [
	"bibleReading",
	"roamingMic",
	"sound",
	"video",
	"stage",
	"bibleStudyReader",
	"watchtowerReader",
	"attendant",
	"privilegePrayer",
	"elder",
	"publicTalk",
	"lifeAndMinistryChairman",
	"weekendChairman",
	"ourChristianLifeAssignment",
	"localNeeds",
	"bibleStudyConductor",
	"watchtowerConductor",
] as const;

const maleBaptizedOnlyFields = [
	"bibleStudyReader",
	"watchtowerReader",
	"attendant",
	"privilegePrayer",
	"elder",
	"publicTalk",
	"lifeAndMinistryChairman",
	"weekendChairman",
	"ourChristianLifeAssignment",
	"localNeeds",
	"bibleStudyConductor",
	"watchtowerConductor",
] as const;

export const personFormSchema = z
	.object({
		slug: z.string().min(1, "Organização inválida."),
		personId: z.string().uuid().optional(),

		name: z
			.string()
			.trim()
			.min(2, "Informe o nome.")
			.max(120, "Nome muito longo."),
		sex: z.enum(["MALE", "FEMALE"]),
		isActive: z.boolean(),
		isStudent: z.boolean(),

		isFamilyHead: z.boolean(),
		familyName: z.string().trim().max(120).optional(),
		familyId: z.string().uuid().optional(),

		headRemovalAction: z.enum(["REASSIGN", "DISSOLVE"]).optional(),
		newHeadPersonId: z.string().uuid().optional(),

		baptized: z.boolean(),
		young: z.boolean(),
		isMarried: z.boolean(),

		initiatingConversations: z.boolean(),
		cultivatingInterest: z.boolean(),
		makingDisciples: z.boolean(),
		explainingBeliefs: z.boolean(),
		cleaning: z.boolean(),
		privilegePrayer: z.boolean(),

		bibleReading: z.boolean(),
		roamingMic: z.boolean(),
		sound: z.boolean(),
		video: z.boolean(),
		stage: z.boolean(),
		bibleStudyReader: z.boolean(),
		watchtowerReader: z.boolean(),
		attendant: z.boolean(),

		elder: z.boolean(),
		publicTalk: z.boolean(),
		lifeAndMinistryChairman: z.boolean(),
		weekendChairman: z.boolean(),
		ourChristianLifeAssignment: z.boolean(),
		localNeeds: z.boolean(),
		bibleStudyConductor: z.boolean(),
		watchtowerConductor: z.boolean(),
	})
	.superRefine((data, ctx) => {
		const familyName = data.familyName?.trim();

		if (data.isFamilyHead && !familyName) {
			ctx.addIssue({
				code: "custom",
				path: ["familyName"],
				message: "Informe o nome da família.",
			});
		}

		if (!data.isFamilyHead && familyName) {
			ctx.addIssue({
				code: "custom",
				path: ["familyName"],
				message: "Nome da família só pode ser informado para chefe.",
			});
		}

		if (data.isFamilyHead && data.familyId) {
			ctx.addIssue({
				code: "custom",
				path: ["familyId"],
				message: "Chefe de família não pode escolher uma família existente.",
			});
		}

		if (!data.isFamilyHead && !data.familyId && data.isMarried) {
			ctx.addIssue({
				code: "custom",
				path: ["familyId"],
				message: "Pessoa casada precisa pertencer a uma família.",
			});
		}

		if (data.young && data.isMarried) {
			ctx.addIssue({
				code: "custom",
				path: ["isMarried"],
				message: "Jovem não pode permanecer casado.",
			});
		}

		if (data.headRemovalAction === "REASSIGN" && !data.newHeadPersonId) {
			ctx.addIssue({
				code: "custom",
				path: ["newHeadPersonId"],
				message: "Selecione o novo chefe da família.",
			});
		}

		if (data.sex === "FEMALE") {
			for (const field of maleOnlyFields) {
				if (data[field]) {
					ctx.addIssue({
						code: "custom",
						path: [field],
						message: "Campo permitido apenas para homens.",
					});
				}
			}
		}

		if (data.sex === "MALE" && !data.baptized) {
			for (const field of maleBaptizedOnlyFields) {
				if (data[field]) {
					ctx.addIssue({
						code: "custom",
						path: [field],
						message: "Campo permitido apenas para homem batizado.",
					});
				}
			}
		}
	});

export type PersonFormValues = z.infer<typeof personFormSchema>;
