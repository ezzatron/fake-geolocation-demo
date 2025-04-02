import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

export default createConfig({
  distDir: "artifacts/next/dist",
  output: "standalone",

  reactStrictMode: true,

  i18n: {
    defaultLocale: "en-US",
    locales: ["en-US"],
  },
});

function createConfig(config: NextConfig): NextConfig {
  return process.env.ANALYZE === "true"
    ? bundleAnalyzer({ openAnalyzer: false })(config)
    : config;
}
