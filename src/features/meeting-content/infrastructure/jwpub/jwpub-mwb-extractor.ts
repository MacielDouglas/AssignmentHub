import { randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { MwbExtract } from "../../application/dto/mwb-extract.dto";
import type MwbExtractor from "../../application/ports/mwb-extractor";
import type { ExtractMwbInput } from "../../application/ports/mwb-extractor";
import { extractMwbFromJwpubFile } from "./extract-mwb";

export default class JwpubMwbExtractor implements MwbExtractor {
	async extract(input: ExtractMwbInput): Promise<MwbExtract> {
		let tempDir: string | null = null;

		try {
			const buffer = Buffer.from(input.buffer);

			if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
				throw new Error(
					"Arquivo .jwpub inválido: o conteúdo ZIP não foi encontrado.",
				);
			}

			tempDir = await mkdtemp(join(tmpdir(), "assignmenthub-mwb-"));

			const filePath = join(tempDir, `${randomUUID()}.jwpub`);

			await writeFile(filePath, buffer);

			return await extractMwbFromJwpubFile(filePath, tempDir);
		} finally {
			if (tempDir) {
				try {
					await rm(tempDir, {
						recursive: true,
						force: true,
					});
				} catch {
					/*
					 * A limpeza é melhor esforço. Em especial no Windows,
					 * o SO pode manter um handle do ZIP por alguns milissegundos.
					 */
				}
			}
		}
	}
}
