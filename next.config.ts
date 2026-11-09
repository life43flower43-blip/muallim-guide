import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // رقم النسخة مضمّن في التطبيق، ليعرف أن نسخة أحدث نُشرت فيعيد التحميل
  env: { NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || "dev" },
  output: "standalone",
  // صفحة البحث تعمل وقت الطلب وتقرأ المقالات وبنك المفاهيم من الملفات
  outputFileTracingIncludes: { "/search": ["./content/articles/**", "./public/data/qbank.json"], "/**": ["./content/articles/**"], "/api/cron/telegram": ["./content/articles/**", "./public/data/qbank.json"] },
  /* config options here */
  // أي خطأ في الأنواع يوقف البناء بدل أن يصل إلى المستخدمين
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  // ترويسات أمان لكل الصفحات: منع تضمين الموقع في مواقع أخرى، ومنع تخمين نوع الملف، وإجبار الاتصال الآمن
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
  reactStrictMode: false,
};

export default nextConfig;
