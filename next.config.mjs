import bundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "artifacts/next/dist",
  output: "standalone",

  reactStrictMode: true,

  i18n: {
    defaultLocale: "en-US",
    locales: ["en-US"],
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

export default withBundleAnalyzer(nextConfig);
