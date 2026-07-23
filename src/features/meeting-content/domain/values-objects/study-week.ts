export type ParsedStudyWeek = {
  weekStart: string;
  weekEnd: string;
  weekLabelRaw: string;
};

const MONTHS: Record<string, number> = {
  janeiro: 1,
  enero: 1,
  january: 1,

  fevereiro: 2,
  febrero: 2,
  february: 2,

  março: 3,
  marco: 3,
  marzo: 3,
  march: 3,

  abril: 4,
  april: 4,

  maio: 5,
  mayo: 5,
  may: 5,

  junho: 6,
  junio: 6,
  june: 6,

  julho: 7,
  julio: 7,
  july: 7,

  agosto: 8,
  august: 8,

  setembro: 9,
  setiembre: 9,
  septiembre: 9,
  september: 9,

  outubro: 10,
  octubre: 10,
  october: 10,

  novembro: 11,
  noviembre: 11,
  november: 11,

  dezembro: 12,
  diciembre: 12,
  december: 12,
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeMonth(value: string): number | null {
  const key = normalizeText(value).replace(/[.,]/g, "").trim();
  return MONTHS[key] ?? null;
}

function utcDate(year: number, month: number, day: number): Date {
  const date = new Date(Date.UTC(year, month - 1, day));

  /*
   * Date.UTC normaliza datas inválidas, por exemplo:
   * 31/09 vira 01/10. Rejeitamos isso explicitamente.
   */
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Data inválida: ${year}-${month}-${day}`);
  }

  return date;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoToUtcDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) {
    throw new Error(`Data ISO inválida: ${iso}`);
  }

  return utcDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  );
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function toMonday(date: Date): Date {
  const weekday = date.getUTCDay();
  const daysToMonday = weekday === 0 ? -6 : 1 - weekday;
  return addDays(date, daysToMonday);
}

function isPlausibleYear(value: number): boolean {
  return value >= 2000 && value <= 2100;
}

function extractYear(text: string, fallbackYear?: number): number | null {
  const match = /\b(20\d{2})\b/.exec(text);

  if (match) {
    const year = Number(match[1]);
    return isPlausibleYear(year) ? year : null;
  }

  if (fallbackYear && isPlausibleYear(fallbackYear)) {
    return fallbackYear;
  }

  return null;
}

/*
 * Aceita rótulos como:
 *
 * Espanhol:
 * - 7-13 DE SEPTIEMBRE DE 2026
 * - 28 DE SEPTIEMBRE-4 DE OCTUBRE DE 2026
 * - 28 DE SEPTIEMBRE - 4 DE OCTUBRE DE 2026
 *
 * Português:
 * - 7-13 DE SETEMBRO DE 2026
 * - 28 DE SETEMBRO-4 DE OUTUBRO DE 2026
 *
 * Também aceita versões sem "DE":
 * - 28 SEPTIEMBRE - 4 OCTUBRE 2026
 */
export function parseStudyWeekLabel(
  raw: string,
  fallbackYear?: number,
): ParsedStudyWeek | null {
  const weekLabelRaw = raw.trim();

  if (!weekLabelRaw) {
    return null;
  }

  const normalized = normalizeText(weekLabelRaw);
  const year = extractYear(normalized, fallbackYear);

  if (!year) {
    return null;
  }

  /*
   * Primeiro tenta semanas que cruzam mês:
   *
   * 28 de septiembre - 4 de octubre de 2026
   * 28 septiembre - 4 octubre 2026
   *
   * Grupos:
   * 1: dia inicial
   * 2: mês inicial
   * 3: dia final
   * 4: mês final
   */
  const crossMonth = /(\d{1,2})\s*(?:de\s+)?([a-záéíóúüñç]+)\s*-\s*(\d{1,2})\s*(?:de\s+)?([a-záéíóúüñç]+)(?:\s+de)?(?:\s+20\d{2})?/iu.exec(
    normalized,
  );

  if (crossMonth) {
    const startDay = Number(crossMonth[1]);
    const startMonth = normalizeMonth(crossMonth[2] ?? "");
    const endDay = Number(crossMonth[3]);
    const endMonth = normalizeMonth(crossMonth[4] ?? "");

    if (!startMonth || !endMonth) {
      return null;
    }

    /*
     * Se a semana passa de dezembro para janeiro, o início pertence
     * ao ano anterior. Ex.: 29 de diciembre-4 de enero de 2027.
     */
    const startYear = startMonth > endMonth ? year - 1 : year;

    try {
      const statedStart = utcDate(startYear, startMonth, startDay);
      const statedEnd = utcDate(year, endMonth, endDay);

      /*
       * A base deve sempre ser segunda-feira e domingo, mas preservar
       * as datas explícitas da revista quando já forem segunda/domingo.
       */
      const weekStart = toMonday(statedStart);
      const weekEnd = addDays(weekStart, 6);

      /*
       * Proteção: se o texto não for uma semana válida (7 dias),
       * ainda retornamos apenas se a data final explícita estiver dentro
       * da semana calculada. Normalmente ela será o domingo.
       */
      const endDiff =
        Math.floor(
          (statedEnd.getTime() - weekStart.getTime()) /
            (1000 * 60 * 60 * 24),
        );

      if (endDiff < 0 || endDiff > 6) {
        return null;
      }

      return {
        weekStart: toIsoDate(weekStart),
        weekEnd: toIsoDate(weekEnd),
        weekLabelRaw,
      };
    } catch {
      return null;
    }
  }

  /*
   * Depois tenta semana dentro do mesmo mês:
   *
   * 7-13 de septiembre de 2026
   * 7 a 13 de setembro de 2026
   */
  const sameMonth = /(\d{1,2})\s*(?:-|a)\s*(\d{1,2})\s*(?:de\s+)?([a-záéíóúüñç]+)(?:\s+de)?(?:\s+20\d{2})?/iu.exec(
    normalized,
  );

  if (sameMonth) {
    const startDay = Number(sameMonth[1]);
    const endDay = Number(sameMonth[2]);
    const month = normalizeMonth(sameMonth[3] ?? "");

    if (!month) {
      return null;
    }

    try {
      const statedStart = utcDate(year, month, startDay);
      const statedEnd = utcDate(year, month, endDay);
      const weekStart = toMonday(statedStart);
      const weekEnd = addDays(weekStart, 6);

      const endDiff =
        Math.floor(
          (statedEnd.getTime() - weekStart.getTime()) /
            (1000 * 60 * 60 * 24),
        );

      if (endDiff < 0 || endDiff > 6) {
        return null;
      }

      return {
        weekStart: toIsoDate(weekStart),
        weekEnd: toIsoDate(weekEnd),
        weekLabelRaw,
      };
    } catch {
      return null;
    }
  }

  return null;
}
