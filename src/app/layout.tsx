import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";

// خط تجوّل مستضاف مع التطبيق نفسه: لا ينتظر الفتح خوادم خارجية
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700", "800"], display: "swap", variable: "--font-tajawal" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://turbawy.app"),
  title: "تربوي | الإعداد المهني للمعلم",
  openGraph: { siteName: "تربوي", locale: "ar_AR", type: "website" },
  other: {
    // حظر نهائي على ترجمة الصفحة آليًا — المترجم التلقائي يشوّه النص العربي تمامًا
    google: "notranslate",
  },
  description:
    "منصة إعداد مهني لطلبة كليات التربية والمتقدمين لاختبار التوظيف والمعلمين: محاور، تدريب ذكي، مراجعة متباعدة للأخطاء، واختبارات محاكية.",
  applicationName: "تربوي",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "تربوي",
  },
  icons: {
    icon: "/favicon-app.png",
    apple: "/icons/apple-touch-icon-v3.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" translate="no" className={`notranslate ${tajawal.variable}`} suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        {/* إن تعذّر تحميل جزء من نسخة قديمة بعد تحديث التطبيق، يُعاد التحميل تلقائيًّا مرة واحدة بدل شاشة الخطأ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var R=/ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module|Importing a module script failed/i;function h(m){try{if(!R.test(m)||sessionStorage.getItem("turbawy-auto-reload"))return;sessionStorage.setItem("turbawy-auto-reload","1");location.reload();}catch(e){}}addEventListener("error",function(e){h((e&&e.message)||"")},true);addEventListener("unhandledrejection",function(e){var r=e&&e.reason;h((r&&(r.name+" "+r.message))||String(r))});})();`,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
