import type { PublicTalkRepository } from "../../domain/repositories/public-talk.repository";
import type { PublicTalkHistoryRepository } from "../../domain/repositories/public-talk-history.repository";
import type { SpeakerEligibilityRepository } from "../../domain/repositories/speaker-eligibility.repository";
import type { RegisterPublicTalkHistoryInput } from "../dto/public-talk-history.dto";

export async function registerPublicTalkHistoryUseCase(
	deps: {
		publicTalkRepository: PublicTalkRepository;
		historyRepository: PublicTalkHistoryRepository;
		speakerRepository: SpeakerEligibilityRepository;
	},
	input: RegisterPublicTalkHistoryInput,
) {
	const publicTalk = await deps.publicTalkRepository.findById(
		input.publicTalkId,
	);

	if (!publicTalk) {
		return {
			ok: false as const,
			error: "Discurso não encontrado.",
		};
	}

	const hasPerson = Boolean(input.speakerPersonId);
	const hasSubPerson = Boolean(input.speakerSubPersonId);

	if (hasPerson === hasSubPerson) {
		return {
			ok: false as const,
			error: "Selecione exatamente um orador: organização ou sub-organização.",
		};
	}

	if (hasPerson && input.speakerPersonId) {
		const speaker = await deps.speakerRepository.findEligiblePerson({
			organizationId: input.organizationId,
			personId: input.speakerPersonId,
		});

		if (!speaker) {
			return {
				ok: false as const,
				error: "A pessoa selecionada não está apta para discurso público.",
			};
		}

		const created = await deps.historyRepository.create({
			organizationId: input.organizationId,
			publicTalkId: input.publicTalkId,
			performedAt: input.performedAt,
			notes: input.notes?.trim() || null,
			speakerPersonId: speaker.id,
			speakerNameSnapshot: speaker.name,
		});

		return {
			ok: true as const,
			data: created,
		};
	}

	if (input.speakerSubPersonId) {
		const speaker = await deps.speakerRepository.findEligibleSubPerson({
			organizationId: input.organizationId,
			subPersonId: input.speakerSubPersonId,
		});

		if (!speaker) {
			return {
				ok: false as const,
				error:
					"A pessoa da sub-organização selecionada não está apta para discurso público.",
			};
		}

		const created = await deps.historyRepository.create({
			organizationId: input.organizationId,
			publicTalkId: input.publicTalkId,
			performedAt: input.performedAt,
			notes: input.notes?.trim() || null,
			speakerSubPersonId: speaker.id,
			speakerNameSnapshot: speaker.name,
		});

		return {
			ok: true as const,
			data: created,
		};
	}

	return {
		ok: false as const,
		error: "Não foi possível registrar o histórico.",
	};
}
