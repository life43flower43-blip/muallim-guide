// رأس الموقع وتذييله بالنمط المعتاد للمواقع: شريط علوي، ثم الشعار والبحث، ثم قائمة الأقسام
import Link from "next/link";
import { Search, Menu, ChevronDown, Smartphone, Rss, Send } from "lucide-react";
import { courseList, FACEBOOK_URL, TELEGRAM_URL } from "@/lib/public-bank";
import { socialLinks } from "@/lib/social-links";
import { courseMeta } from "@/lib/site-nav";
import TodayDate from "./TodayDate";
import SearchBox from "./SearchBox";
import MobileBar from "./MobileBar";

/** قائمة «الرخصة المهنية»: كل ما يحتاجه المتقدم للاختبار */
export const LICENSE = [
  { href: "/license-guide", label: "دليل الاستعداد للرخصة" },
  { href: "/standards", label: "المعايير العشرة" },
  { href: "/specialized", label: "الاختبارات التخصصية" },
  { href: "/license-questions", label: "بنك أسئلة محلول" },
  { href: "/practice-test", label: "نموذج اختبار" },
  { href: "/weekly-test", label: "اختبار الأسبوع" },
  { href: "/license-calculator", label: "حاسبة مستوى الرخصة" },
  { href: "/teacher-exams", label: "اختبارات المعلمين عربيًا" },
];

/** قائمة «مصادر التعلم»: صفحات المحتوى التفاعلي */
export const RESOURCES = [
  { href: "/topics", label: "مواضيع تربوية" },
  { href: "/classroom-problems", label: "مشكلات صفية" },
  { href: "/misconceptions", label: "مفاهيم خاطئة شائعة" },
  { href: "/comparisons", label: "مقارنات تربوية" },
  { href: "/mind-maps", label: "خرائط ذهنية تفاعلية" },
  { href: "/glossary", label: "معجم المصطلحات" },
  { href: "/sections", label: "أقسام التطبيق" },
];

const MAIN_NAV: { href: string; label: string; drop?: "courses" | "license" | "resources" }[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/articles", label: "المقالات" },
  { href: "/learn", label: "المحاور", drop: "courses" },
  { href: "/license-guide", label: "الرخصة المهنية", drop: "license" },
  { href: "/classroom-problems", label: "مصادر التعلم", drop: "resources" },
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
            <Link prefetch={false} href="/app" className="flex items-center gap-1 font-bold text-[#A7F3D0] hover:text-white">
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
          <Link prefetch={false} href="/app" className="ms-auto hidden whitespace-nowrap rounded-xl bg-[#7C5CFF] px-5 py-2.5 text-[15px] font-bold text-white md:ms-0 md:inline-block">
            ابدأ التدريب مجانًا
          </Link>
          {/* أزرار الهاتف: بحث وقائمة */}
          <MobileBar
            nav={[{ href: "/", label: "الرئيسية" }, { href: "/articles", label: "المقالات" }, { href: "/learn", label: "المحاور" }, { href: "/tatbeeq", label: "التطبيق" }]}
            groups={[{ title: "الرخصة المهنية", items: LICENSE }, { title: "مصادر التعلم", items: RESOURCES }, { title: "عن تربوي", items: [{ href: "/about", label: "من نحن" }, { href: "/contact", label: "اتصل بنا" }] }]}
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
                <Link prefetch={false} href={n.href} className="flex h-12 items-center gap-1 px-3.5 hover:bg-white/10">
                  {n.label} <ChevronDown className="hidden h-4 w-4 md:block" />
                </Link>
                <div className="invisible absolute start-0 top-12 z-30 hidden w-[460px] grid-cols-2 gap-1 rounded-b-2xl border border-t-0 border-[#D4E3DA] bg-white p-3 opacity-0 transition group-hover:visible group-hover:opacity-100 md:grid">
                  {(n.drop === "courses"
                    ? courses.map((c) => ({ href: `/learn/${c.id}`, label: courseMeta(c.id).short }))
                    : n.drop === "license"
                      ? LICENSE
                      : RESOURCES
                  ).map((x) => (
                    <Link prefetch={false} key={x.href} href={x.href} className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-[#1E3A32] hover:bg-[#EEF5F1]">
                      {x.label}
                    </Link>
                  ))}
                </div>
              </li>
            ) : (
              <li key={n.href} className="shrink-0">
                <Link prefetch={false} href={n.href} className="flex h-12 items-center px-3.5 hover:bg-white/10">{n.label}</Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  // تذييل مختصر كالمواقع المعروفة: تعريف وزر التطبيق، وروابط قليلة في عمودين، وشريط الحقوق. الأقسام موجودة في القائمة العلوية فلا تُكرر هنا
  const year = new Intl.DateTimeFormat("ar-u-nu-arab", { year: "numeric" }).format(new Date());
  const col = "space-y-2.5 text-[14px]";
  return (
    <footer className="mt-12 bg-[#0E3B32] text-white/75">
      <div className="mx-auto max-w-6xl px-4 py-9">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <img src="/icons/logo-128.png" alt="" className="h-9 w-9 rounded-xl bg-white object-contain p-0.5" />
              <span className="font-display text-[20px] font-extrabold text-white">تربوي</span>
            </div>
            <p className="mt-2 text-[13.5px] leading-7">دليل عربي مجاني للمعلمين وطلاب كليات التربية، للاستعداد لاختبار الرخصة المهنية والتوظيف.</p>
          </div>
          <Link prefetch={false} href="/tatbeeq" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#7C5CFF] px-5 text-[14px] font-bold text-white md:self-auto">
            <Smartphone className="h-4 w-4" /> حمّل تطبيق تربوي
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-7 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-white">تربوي</h3>
            <ul className={col}>
              <li><Link href="/about" className="hover:text-white">من نحن</Link></li>
              <li><Link href="/contact" className="hover:text-white">اتصل بنا</Link></li>
              <li><Link href="/editorial-policy" className="hover:text-white">كيف نعد المحتوى</Link></li>
              <li><Link href="/articles" className="hover:text-white">المقالات</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-[13px] font-bold text-white">للمتقدمين للاختبار</h3>
            <ul className={col}>
              <li><Link href="/license-guide" className="hover:text-white">دليل الرخصة المهنية</Link></li>
              <li><Link href="/license-questions" className="hover:text-white">بنك أسئلة الرخصة محلول</Link></li>
              <li><Link href="/practice-test" className="hover:text-white">نموذج اختبار</Link></li>
              <li><Link href="/topics" className="hover:text-white">مواضيع تربوية</Link></li>
              <li><Link prefetch={false} href="/glossary" className="hover:text-white">معجم المصطلحات</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h3 className="mb-3 text-[13px] font-bold text-white">تابع الجديد</h3>
            <p className="text-[13.5px] leading-7">مقالات جديدة كل أحد وثلاثاء وخميس.</p>
            {TELEGRAM_URL && (
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1.5 text-[13.5px] font-bold text-[#A7F3D0] hover:text-white"><Send className="h-4 w-4" /> قناتنا على تيليجرام: سؤال كل يوم</a>
            )}
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1.5 text-[13.5px] font-bold text-[#A7F3D0] hover:text-white"><Send className="h-4 w-4" /> صفحتنا على فيسبوك</a>
            {socialLinks().filter((x) => x.id === "linkedin" || x.id === "x").map((x) => (
              <a key={x.id} href={x.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1.5 text-[13.5px] font-bold text-[#A7F3D0] hover:text-white"><Send className="h-4 w-4" /> حسابنا على {x.name}</a>
            ))}
            <a href="/feed.xml" className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#A7F3D0] hover:text-white"><Rss className="h-4 w-4" /> اشترك عبر RSS</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 text-[12.5px] text-white/60">
          <p>© {year} تربوي. جميع الحقوق محفوظة.</p>
          <p className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">الخصوصية</Link>
            <Link href="/terms" className="hover:text-white">شروط الاستخدام</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
