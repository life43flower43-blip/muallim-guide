import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // رقم النسخة مضمّن في التطبيق، ليعرف أن نسخة أحدث نُشرت فيعيد التحميل
  env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || "dev" },
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
