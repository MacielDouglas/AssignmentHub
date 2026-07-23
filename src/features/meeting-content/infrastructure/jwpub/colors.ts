import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { decode } from "jpeg-js";

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type ManifestImage = {
  fileName?: string;
  type?: string;
};

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function rgbToHsv({ r, g, b }: Rgb): {
  h: number;
  s: number;
  v: number;
} {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

function luminance({ r, g, b }: Rgb): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
      (a.g - b.g) ** 2 +
      (a.b - b.b) ** 2,
  );
}

function quantize(color: Rgb, step = 16): Rgb {
  return {
    r: Math.min(255, Math.floor(color.r / step) * step + step / 2),
    g: Math.min(255, Math.floor(color.g / step) * step + step / 2),
    b: Math.min(255, Math.floor(color.b / step) * step + step / 2),
  };
}

function colorKey(color: Rgb): string {
  return `${color.r}:${color.g}:${color.b}`;
}

/**
 * Lê a capa JPG do JWPUB e retorna cores de destaque.
 * Ignora branco, preto, cinza e pixels muito pouco saturados.
 */
export function extractDominantColors(
  image: Buffer,
  maxColors = 3,
): string[] {
  const decoded = decode(image, { useTArray: true });
  const buckets = new Map<string, { color: Rgb; score: number }>();

  // A amostragem reduz custo para capas grandes.
  for (let y = 0; y < decoded.height; y += 4) {
    for (let x = 0; x < decoded.width; x += 4) {
      const index = (y * decoded.width + x) * 4;
      const color: Rgb = {
        r: decoded.data[index] ?? 0,
        g: decoded.data[index + 1] ?? 0,
        b: decoded.data[index + 2] ?? 0,
      };

      const hsv = rgbToHsv(color);
      const light = luminance(color);

      // Exclui texto preto/branco, fundo branco e cinzas.
      if (light < 0.1 || light > 0.9 || hsv.s < 0.2) {
        continue;
      }

      const bucket = quantize(color);
      const key = colorKey(bucket);
      const current = buckets.get(key);

      // Saturação pesa mais: tende a selecionar o elemento visual da capa.
      const score = 1 + hsv.s * 2;

      if (current) {
        current.score += score;
      } else {
        buckets.set(key, { color: bucket, score });
      }
    }
  }

  const selected: Rgb[] = [];

  for (const item of [...buckets.values()].sort(
    (a, b) => b.score - a.score,
  )) {
    // Evita retornar vários tons quase idênticos.
    if (selected.some((existing) => colorDistance(existing, item.color) < 55)) {
      continue;
    }

    selected.push(item.color);

    if (selected.length >= maxColors) {
      break;
    }
  }

  return selected.length > 0
    ? selected.map(rgbToHex)
    : [DEFAULT_FALLBACK_COLOR];
}

const DEFAULT_FALLBACK_COLOR = "#4A6FA5";

export async function extractCoverColors(
  innerDir: string,
  images: ManifestImage[] | undefined,
): Promise<string[]> {
  const cover = images?.find((image) => image.type === "c");

  if (!cover?.fileName) {
    return [DEFAULT_FALLBACK_COLOR];
  }

  try {
    const imageBuffer = await readFile(join(innerDir, cover.fileName));
    return extractDominantColors(imageBuffer);
  } catch {
    return [DEFAULT_FALLBACK_COLOR];
  }
}

/**
 * A capa costuma representar duas semanas por cor.
 * Ex.: quatro estudos e duas cores => cor A, A, cor B, cor B.
 */
export function assignColorsToStudies(
  colors: string[],
  studyCount: number,
): string[] {
  const usable = colors.length > 0 ? colors : [DEFAULT_FALLBACK_COLOR];

  return Array.from({ length: studyCount }, (_, index) => {
    const colorIndex = Math.floor(index / 2) % usable.length;
    return usable[colorIndex] ?? DEFAULT_FALLBACK_COLOR;
  });
}
