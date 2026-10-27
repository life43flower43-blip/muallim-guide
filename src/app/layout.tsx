import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";

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
    <html lang="ar" dir="rtl" translate="no" className="notranslate" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
