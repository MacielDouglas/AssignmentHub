import type { WatchtowerStudyRepository } from "../../domain/repositories/watchtower-study.repository";
import { isoToUtcDate } from "../../domain/values-objects/study-week";
import type { WatchtowerStudyUpdateInput } from "../dto/watchtower-extract.dto";

type Dependencies = {
  studies: WatchtowerStudyRepository;
};

export async function updateWatchtowerStudyUseCase(
  dependencies: Dependencies,
  input: WatchtowerStudyUpdateInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const weekStart = isoToUtcDate(input.weekStart);
  const weekEnd = isoToUtcDate(input.weekEnd);

  if (weekEnd.getTime() < weekStart.getTime()) {
    return {
      ok: false,
      error: "A data final não pode ser anterior à data inicial.",
    };
  }

  const durationInDays =
    Math.round(
      (weekEnd.getTime() - weekStart.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

  if (durationInDays !== 7) {
    return {
      ok: false,
      error:
        "Um estudo de A Sentinela deve ter sete dias: segunda-feira até domingo.",
    };
  }

  const startWeekday = weekStart.getUTCDay();
  const endWeekday = weekEnd.getUTCDay();

  if (startWeekday !== 1 || endWeekday !== 0) {
    return {
      ok: false,
      error:
        "A semana deve começar em uma segunda-feira e terminar em um domingo.",
    };
  }

  const [openingSongId, closingSongId] = await Promise.all([
    dependencies.studies.findSongId(input.openingSong, input.locale),
    dependencies.studies.findSongId(input.closingSong, input.locale),
  ]);

  await dependencies.studies.updateById({
    id: input.id,
    locale: input.locale,
    weekStart,
    weekEnd,
    weekLabelRaw: input.weekLabelRaw,
    title: input.title,
    openingSongNum: input.openingSong,
    closingSongNum: input.closingSong,
    highlightColor: input.highlightColor,
    issueCode: input.issueCode,
    openingSongId,
    closingSongId,
  });

  return { ok: true };
}
