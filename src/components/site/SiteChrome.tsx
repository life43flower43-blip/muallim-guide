// رأس الموقع وتذييله بالنمط المعتاد للمواقع: شريط علوي، ثم الشعار والبحث، ثم قائمة الأقسام
import Link from "next/link";
import { Search, Menu, ChevronDown, Smartphone, Mail } from "lucide-react";
import { courseList } from "@/lib/public-bank";
import { APP_SECTIONS, courseMeta } from "@/lib/site-nav";
import TodayDate from "./TodayDate";
import SearchBox from "./SearchBox";
import MobileBar from "./MobileBar";

/** قسم «المصادر»: صفحات المحتوى التفاعلي */
export const RESOURCES = [
  { href: "/classroom-problems", label: "مشكلات صفية", color: "#B4532A" },
  { href: "/misconceptions", label: "مفاهيم خاطئة شائعة", color: "#7A4E9C" },
  { href: "/comparisons", label: "مقارنات تربوية", color: "#3A55A4" },
  { href: "/mind-maps", label: "خرائط ذهنية تفاعلية", color: "#1F6FA8" },
  { href: "/glossary", label: "معجم المصطلحات", color: "#136F5C" },
  { href: "/license-guide", label: "دليل اختبار الرخصة", color: "#8A6A12" },
  { href: "/sections", label: "أقسام التطبيق", color: "#3A55A4" },
];

const MAIN_NAV: { href: string; label: string; drop?: "courses" | "resources" }[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/articles", label: "مقالات تربوية" },
  { href: "/learn", label: "المحاور", drop: "courses" },
  { href: "/classroom-problems", label: "المصادر", drop: "resources" },
  { href: "/practice-test", label: "نموذج اختبار" },
  { href: "/misconceptions", label: "مفاهيم خاطئة" },
  { href: "/tatbeeq", label: "التطبيق" },
];

export function SiteHeader() {
  const courses = courseList().filter((c) => c.concepts.length > 0);
  return (
    <header>
      {/* الشريط العلوي: التاريخ وروابط ثابتة */}
      <div className="bg-[#0E4F42] text-[13px] text-white/85">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-3 px-4">
          <TodayDate />
          <nav className="flex items-center gap-4">
            <Link href="/contact" className="hidden hover:text-white sm:inline">اتصل بنا</Link>
            <Link href="/privacy" className="hidden hover:text-white sm:inline">الخصوصية</Link>
            <Link href="/app" className="flex items-center gap-1 font-bold text-[#F2C94C] hover:text-white">
              <Smartphone className="h-3.5 w-3.5" /> التطبيق
            </Link>
          </nav>
        </div>
      </div>

      {/* الشعار والبحث */}
      <div className="relative border-b border-[#E2ECE6] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/icons/logo-128.png" alt="" className="h-12 w-12 object-contain max-[359px]:h-10 max-[359px]:w-10" />
            <span>
              <span className="block font-display text-[26px] font-extrabold leading-8 text-[#136F5C] max-[359px]:text-[22px]">تربوي</span>
              <span className="block text-[12px] leading-4 text-[#5B7268] max-[359px]:hidden">دليل المعلم إلى اختبار الرخصة والتوظيف</span>
            </span>
          </Link>
          <div className="ms-auto hidden max-w-md flex-1 md:block"><SearchBox /></div>
          <Link href="/app" className="ms-auto hidden whitespace-nowrap rounded-xl bg-[#E8A317] px-5 py-2.5 text-[15px] font-bold text-[#2B1D00] md:ms-0 md:inline-block">
            ابدأ التدريب مجانًا
          </Link>
          {/* أزرار الهاتف: بحث وقائمة */}
          <MobileBar
            nav={[...MAIN_NAV.filter((n) => n.drop !== "resources").map((n) => ({ href: n.href, label: n.label })), ...RESOURCES.map((r) => ({ href: r.href, label: r.label }))].filter((v, i, a) => a.findIndex((x) => x.href === v.href) === i)}
            courses={courses.map((c) => ({ href: `/learn/${c.id}`, label: courseMeta(c.id).short }))}
          />
        </div>
      </div>

      {/* قائمة الأقسام الرئيسية */}
      <nav className="sticky top-0 z-20 bg-[#136F5C]">
        <ul className="mx-auto flex max-w-6xl items-stretch overflow-x-auto px-2 md:overflow-visible text-[15px] font-bold text-white [scrollbar-width:none]">
          {MAIN_NAV.map((n) =>
            n.drop ? (
              <li key={n.href} className="group relative shrink-0">
                <Link href={n.href} className="flex h-12 items-center gap-1 px-3.5 hover:bg-white/10">
                  {n.label} <ChevronDown className="hidden h-4 w-4 md:block" />
                </Link>
                <div className="invisible absolute start-0 top-12 z-30 hidden w-[460px] grid-cols-2 gap-1 rounded-b-2xl border border-t-0 border-[#D4E3DA] bg-white p-3 opacity-0 transition group-hover:visible group-hover:opacity-100 md:grid">
                  {(n.drop === "courses"
                    ? courses.map((c) => ({ href: `/learn/${c.id}`, label: courseMeta(c.id).short, color: courseMeta(c.id).color }))
                    : RESOURCES
                  ).map((x) => (
                    <Link key={x.href} href={x.href} className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#1E3A32] hover:bg-[#EEF5F1]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: x.color }} />
                      {x.label}
                    </Link>
                  ))}
                </div>
              </li>
            ) : (
              <li key={n.href} className="shrink-0">
                <Link href={n.href} className="flex h-12 items-center px-3.5 hover:bg-white/10">{n.label}</Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const courses = courseList().filter((c) => c.concepts.length > 0);
  return (
    <footer className="mt-12 bg-[#0E3B32] text-[14px] text-white/75">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src="/icons/logo-128.png" alt="" className="h-10 w-10 rounded-xl bg-white object-contain p-0.5" />
            <span className="font-display text-[22px] font-extrabold text-white">تربوي</span>
          </div>
          <p className="mt-3 leading-7">
            موقع عربي مجاني لإعداد المعلمين وطلاب كليات التربية لاختبارات الرخصة المهنية والتوظيف: مفاهيم مشروحة، وأسئلة مع التفسير، واختبارات محاكية.
          </p>
        </div>
        <div>
          <h3 className="mb-3 font-display text-[16px] font-bold text-white">المحاور</h3>
          <ul className="space-y-2">
            {courses.slice(0, 6).map((c) => (
              <li key={c.id}><Link href={`/learn/${c.id}`} className="hover:text-white">{courseMeta(c.id).short}</Link></li>
            ))}
            <li><Link href="/learn" className="font-bold text-[#F2C94C] hover:text-white">كل المحاور</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display text-[16px] font-bold text-white">أقسام التطبيق</h3>
          <ul className="space-y-2">
            {APP_SECTIONS.slice(0, 6).map((s) => (
              <li key={s.slug}><Link href={`/sections/${s.slug}`} className="hover:text-white">{s.title}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display text-[16px] font-bold text-white">روابط مهمة</h3>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-white">عن تربوي</Link></li>
            <li><Link href="/glossary" className="hover:text-white">مصطلحات تربوية</Link></li>
            <li><Link href="/privacy" className="hover:text-white">سياسة الخصوصية</Link></li>
            <li><Link href="/terms" className="hover:text-white">شروط الاستخدام</Link></li>
            <li><Link href="/contact" className="flex items-center gap-1.5 hover:text-white"><Mail className="h-4 w-4" /> اتصل بنا</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-[13px]">جميع الحقوق محفوظة لموقع تربوي</p>
      </div>
    </footer>
  );
}
