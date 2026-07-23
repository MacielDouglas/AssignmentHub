import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			// PDFs da Sentinela/MWB: 2–15 MB + overhead multipart
			bodySizeLimit: "25mb",
		},
	},
};

export default withNextIntl(nextConfig);
