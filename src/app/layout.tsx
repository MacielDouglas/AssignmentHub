import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "AssignmentHub",
	description:
		"Organização inteligente de tarefas, reuniões e designações com IA.",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={cn("font-sans", inter.variable)}
			data-scroll-behavior="smooth"
		>
			<body className={`${inter.variable} font-sans`}>
				<NextIntlClientProvider messages={messages}>
					{/* header / sidebar existentes */}
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
