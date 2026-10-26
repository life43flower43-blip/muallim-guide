// قالب صفحات الموقع العامة: رأس وتذييل بسيطان، وسكربت الإعلانات هنا وحده لا في التطبيق
import Link from "next/link";
import Script from "next/script";

const ADS = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      {ADS && <Script async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS}`} />}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <Link href="/learn" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-white">
<img src="/icons/logo-128.png" alt="" className="h-full w-full object-contain p-0.5" />
            </span>
            <span className="font-display text-lg font-bold text-primary">تربوي</span>
          </Link>
          <nav className="flex flex-1 items-center gap-4 text-sm text-secondary-foreground">
            <Link href="/learn" className="hover:text-foreground">المحاور</Link>
            <Link href="/about" className="hidden hover:text-foreground sm:inline">عن الموقع</Link>
          </nav>
          <Link href="/" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            ابدأ التدريب
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-sm text-muted-foreground">
          <span>© تربوي</span>
          <Link href="/about" className="hover:text-foreground">عن الموقع</Link>
          <Link href="/privacy" className="hover:text-foreground">سياسة الخصوصية</Link>
          <Link href="/terms" className="hover:text-foreground">شروط الاستخدام</Link>
          <Link href="/contact" className="hover:text-foreground">اتصل بنا</Link>
        </div>
      </footer>
    </div>
  );
}
