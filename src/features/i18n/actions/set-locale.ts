"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { type AppLocale, isAppLocale, LOCALE_COOKIE } from "@/i18n/config";

export async function setLocaleAction(locale: string): Promise<void> {
	if (!isAppLocale(locale)) {
		return;
	}

	const store = await cookies();
	store.set(LOCALE_COOKIE, locale as AppLocale, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365, // 1 ano
		sameSite: "lax",
	});

	// Revalida o layout raiz para Server Components pegarem o novo locale
	revalidatePath("/", "layout");
}
