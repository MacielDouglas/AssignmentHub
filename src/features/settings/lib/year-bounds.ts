/** Ano civil gregoriano — timezone de parede Brasil (sem offset no Date). */

export function startOfCivilYear(year: number): Date {
	return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

export function endOfCivilYear(year: number): Date {
	return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
}

export function civilYearOf(date: Date): number {
	return date.getUTCFullYear();
}

export function todayUtcDateOnly(): Date {
	const now = new Date();
	return new Date(
		Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
	);
}

/** Parse yyyy-mm-dd → Date UTC meia-noite */
export function parseDateInput(value: string): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
	if (!m) return null;
	const y = Number(m[1]);
	const mo = Number(m[2]);
	const d = Number(m[3]);
	const dt = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
	if (
		dt.getUTCFullYear() !== y ||
		dt.getUTCMonth() !== mo - 1 ||
		dt.getUTCDate() !== d
	) {
		return null;
	}
	return dt;
}

export function formatDateInput(date: Date): string {
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const d = String(date.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}
