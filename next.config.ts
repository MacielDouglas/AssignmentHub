import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			// .jwpub máximo 100MB + overhead multipart. 105mb cobre o legítimo
			// e bloqueia abuso de 200MB (timeout/OOM/egress no Hobby).
			bodySizeLimit: "105mb",
		},
	},
};

export default withNextIntl(nextConfig);
