import { readFile } from "node:fs/promises";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

let sqlPromise: Promise<SqlJsStatic> | null = null;

function getSql(): Promise<SqlJsStatic> {
	if (!sqlPromise) {
		sqlPromise = initSqlJs({
			// Next/Node: usa wasm do pacote
			locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
		});
	}
	return sqlPromise;
}

export async function openSqliteFile(dbPath: string): Promise<Database> {
	const SQL = await getSql();
	const fileBuffer = await readFile(dbPath);
	return new SQL.Database(fileBuffer);
}

export function queryAll<T extends Record<string, unknown>>(
	db: Database,
	sql: string,
): T[] {
	const result = db.exec(sql);
	if (!result[0]) return [];
	const { columns, values } = result[0];
	return values.map((row) => {
		const obj: Record<string, unknown> = {};
		columns.forEach((col, i) => {
			obj[col] = row[i];
		});
		return obj as T;
	});
}
