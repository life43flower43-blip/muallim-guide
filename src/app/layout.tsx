import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "تربوي | رفيق طالب التربية",
  other: {
    // حظر نهائي على ترجمة الصفحة آليًا — المترجم التلقائي يشوّه النص العربي تمامًا
    google: "notranslate",
  },
  description:
    "تطبيق تعليمي لطلاب كليات التربية: مفاهيم، اختبارات تفاعلية، توجيه بعد الخطأ، ومراجعة متباعدة.",
  applicationName: "تربوي",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "تربوي",
  },
  icons: {
    icon: "/favicon-app.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1B4332",
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
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
