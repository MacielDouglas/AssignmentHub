import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "AssignmentHub",
	description:
		"Organização inteligente de tarefas, reuniões e designações com IA.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body className={`${inter.variable} font-sans`}>{children}</body>
		</html>
	);
}
