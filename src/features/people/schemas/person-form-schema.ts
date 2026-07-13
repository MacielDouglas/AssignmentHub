import { z } from "zod";

export const personFormSchema = z
	.object({
		slug: z.string().min(1, "Organização inválida."),
		personId: z.string().uuid().optional(),
		name: z.string().trim().min(2, "Informe o nome."),
		sex: z.enum(["MALE", "FEMALE"]),
		isActive: z.boolean(),
		isStudent: z.boolean(),

		isFamilyHead: z.boolean(),
		familyName: z.string().trim().optional(),
		familyId: z.string().uuid().optional(),

		baptized: z.boolean(),
		young: z.boolean(),
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
				message:
					"Nome da família só pode ser informado quando a pessoa for chefe.",
			});
		}

		if (data.isFamilyHead && data.familyId) {
			ctx.addIssue({
				code: "custom",
				path: ["familyId"],
				message: "Chefe de família não deve selecionar uma família existente.",
			});
		}
	});

export type PersonFormInput = z.infer<typeof personFormSchema>;
