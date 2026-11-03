import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // صفحة البحث تعمل وقت الطلب وتقرأ المقالات وبنك المفاهيم من الملفات
  outputFileTracingIncludes: { "/search": ["./content/articles/**", "./public/data/qbank.json"], "/**": ["./content/articles/**"], "/api/cron/telegram": ["./content/articles/**", "./public/data/qbank.json"] },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
