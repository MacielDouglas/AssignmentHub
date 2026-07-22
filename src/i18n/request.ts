import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE } from "@/i18n/config";
import { resolveLocaleFromHeaders } from "@/i18n/resolve-locale";

export default getRequestConfig(async () => {
	const cookieStore = await cookies();
	const headerStore = await headers();

	const locale = resolveLocaleFromHeaders(
		cookieStore.get(LOCALE_COOKIE)?.value,
		headerStore.get("accept-language"),
	);

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
