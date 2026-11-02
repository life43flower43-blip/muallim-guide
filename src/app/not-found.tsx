// صفحة «غير موجودة» بالعربية، بقالب الموقع
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import SearchBox from "@/components/site/SearchBox";

export const metadata = { title: "الصفحة غير موجودة | تربوي", robots: { index: false } };

const LINKS = [
  { href: "/", t: "الرئيسية", c: "#136F5C" },
  { href: "/articles", t: "مقالات تربوية", c: "#B4532A" },
  { href: "/learn", t: "المحاور", c: "#1F6FA8" },
  { href: "/practice-test", t: "نموذج اختبار", c: "#7A4E9C" },
  { href: "/app", t: "افتح التطبيق", c: "#8A6A12" },
];

export default function NotFound() {
  return (
    <div className="min-h-dvh w-full max-w-[100vw] overflow-x-clip bg-[#F4F7F5] text-[#14302A]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="font-display text-[72px] font-extrabold leading-none text-[#136F5C]">٤٠٤</p>
        <h1 className="mt-3 font-display text-[26px] font-extrabold">لم نجد هذه الصفحة</h1>
        <p className="mt-2 leading-8 text-[#4D635A]">ربما تغيّر رابطها أو كُتب بطريقة خاطئة. ابحث عما تريد، أو اختر من الأقسام.</p>
        <div className="mx-auto mt-6 max-w-md text-right"><SearchBox /></div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[14px] font-bold" style={{ color: l.c, background: `${l.c}14` }}>{l.t}</Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
