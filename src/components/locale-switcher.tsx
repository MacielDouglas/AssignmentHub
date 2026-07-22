"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { setLocaleAction } from "@/features/i18n/actions/set-locale";
import { type AppLocale, locales } from "@/i18n/config";

type Props = {
	/** "select" | "buttons" */
	variant?: "select" | "buttons";
	className?: string;
};

export function LocaleSwitcher({ variant = "select", className }: Props) {
	const t = useTranslations("LocaleSwitcher");
	const locale = useLocale() as AppLocale;
	const router = useRouter();
	const [pending, startTransition] = useTransition();

	function onChange(next: string) {
		startTransition(async () => {
			await setLocaleAction(next);
			router.refresh();
		});
	}

	if (variant === "buttons") {
		return (
			<fieldset className={className}>
				<legend>{t("label")}</legend>
				{locales.map((code) => (
					<Button
						key={code}
						type="button"
						size="sm"
						variant={code === locale ? "default" : "outline"}
						disabled={pending || code === locale}
						onClick={() => onChange(code)}
					>
						{t(code)}
					</Button>
				))}
			</fieldset>
		);
	}

	return (
		<Select value={locale} onValueChange={onChange} disabled={pending}>
			<SelectTrigger className={className} aria-label={t("label")}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{locales.map((code) => (
					<SelectItem key={code} value={code}>
						{t(code)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
