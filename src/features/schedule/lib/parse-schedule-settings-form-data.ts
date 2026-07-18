import type { SaveScheduleSettingsInput } from "../schemas/save-schedule-settings.schema";

function sanitizeText(value: unknown): string {
	if (typeof value !== "string") return "";

	return value
		.split("")
		.filter((char) => {
			const code = char.charCodeAt(0);
			// remove control chars except tab (9), LF (10), CR (13)
			if (
				code <= 8 ||
				code === 11 ||
				code === 12 ||
				(code >= 14 && code <= 31) ||
				code === 127
			) {
				return false;
			}
			return true;
		})
		.join("")
		.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
		.replace(/javascript\s*:/gi, "")
		.replace(/\bon\w+\s*=/gi, "")
		.trim();
}

function sanitizeValue(value: unknown): unknown {
	if (typeof value === "string") {
		return sanitizeText(value);
	}

	if (Array.isArray(value)) {
		return value.map((entry) => sanitizeValue(entry));
	}

	if (value && typeof value === "object") {
		const sanitized: Record<string, unknown> = {};

		for (const [key, nestedValue] of Object.entries(
			value as Record<string, unknown>,
		)) {
			sanitized[key] = sanitizeValue(nestedValue);
		}

		return sanitized;
	}

	return value;
}

export function parseScheduleSettingsFormData(
	formData: FormData,
): SaveScheduleSettingsInput {
	const rawPayload = formData.get("schedulePayload");

	if (typeof rawPayload !== "string" || rawPayload.trim() === "") {
		return {
			organizationId: "",
			items: [],
		};
	}

	// hard limit to reduce abuse / oversized payloads
	if (rawPayload.length > 250_000) {
		return {
			organizationId: "",
			items: [],
		};
	}

	try {
		const parsed = JSON.parse(rawPayload) as unknown;
		return sanitizeValue(parsed) as SaveScheduleSettingsInput;
	} catch {
		return {
			organizationId: "",
			items: [],
		};
	}
}
