"use client";

import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

type CleaningSettingsSubmitButtonProps = {
	pending: boolean;
	disabled?: boolean;
};

export function CleaningSettingsSubmitButton({
	pending,
	disabled,
}: CleaningSettingsSubmitButtonProps) {
	return (
		<Button
			type="submit"
			disabled={disabled || pending}
			className="w-full sm:w-auto"
		>
			{pending ? (
				<>
					<Loader2 className="mr-2 size-4 animate-spin" />
					Salvando...
				</>
			) : (
				<>
					<Save className="mr-2 size-4" />
					Salvar configurações
				</>
			)}
		</Button>
	);
}
