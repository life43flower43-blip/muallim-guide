// الصفحة الرئيسية للموقع: ترحيب وبحث، ثم أحدث المقالات، ومفاهيم مختارة، وأقسام التطبيق، ثم التصنيفات مع شريط جانبي
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, ChevronDown, FileQuestion, Layers, Search } from "lucide-react";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { allArticles } from "@/lib/articles";
import { APP_SECTIONS, courseMeta } from "@/lib/site-nav";
import SearchBox from "@/components/site/SearchBox";
import { ArticleCard, SectionTitle, Tile, WithSidebar, conceptCard } from "@/components/site/Blocks";
import { articleCourse } from "@/lib/articles";
import { ad } from "@/lib/arabic";
import type { Concept } from "@/lib/types";

export const metadata: Metadata = {
  title: "تربوي | الاستعداد لاختبار الرخصة المهنية والتوظيف للمعلمين",
  description:
    "موقع عربي مجاني للمعلمين وطلاب كليات التربية: مقالات تربوية، ومفاهيم مشروحة بأمثلة من الصف، وآلاف الأسئلة مع تفسير كل خيار، واختبارات محاكية، ومواقف صفية، وأدوات للقياس والتقويم.",
  alternates: { canonical: `${SITE_URL}/` },
};

const HOME_COURSES = ["M5", "M3", "M4", "M1", "M2", "SE1"];

/** مقالات من فصول مختلفة في التصنيف نفسه */
function spread(courseId: string, n: number, skip = 0): Concept[] {
  const all = publicBank().concepts.filter((c) => c.courseId === courseId);
  const seen = new Set<string>();
  const out: Concept[] = [];
  for (const c of all) {
    if (seen.has(c.chapter)) continue;
    seen.add(c.chapter);
    out.push(c);
  }
  return out.slice(skip, skip + n);
}

const FAQ = [
  { q: "هل موقع تربوي مجاني؟", a: "نعم. المقالات والأسئلة والاختبارات المحاكية والأدوات كلها مجانية، ويمكنك أن تبدأ دون تسجيل." },
  { q: "لمن هذا الموقع؟", a: "للمتقدمين لاختبارات الرخصة المهنية والتوظيف في التعليم في البلاد العربية، ولطلاب كليات التربية، وللمعلمين الذين يطورون ممارستهم." },
  { q: "هل يطابق الاختبار الرسمي في بلدي؟", a: "يغطي المحاور التربوية المشتركة في أغلب هذه الاختبارات، لكنه ليس الاختبار الرسمي. راجع دليل الاختبار في بلدك لمعرفة المحاور وأوزانها." },
  { q: "ما الفرق بين الموقع والتطبيق؟", a: "الموقع للقراءة: مقالات تربوية وشرح المفاهيم والمصطلحات. والتطبيق للتدريب: أسئلة مع التفسير، واختبارات بزمن، ومراجعة لأخطائك. يفتح التطبيق من المتصفح، ويمكن تثبيته على الهاتف." },
];

/** صف بطاقات يمرّ أفقيًا في الهاتف، وشبكة في الشاشات الكبيرة */
function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
      {children}
    </div>
  );
}

export default function Home() {
  const b = publicBank();
  const articles = allArticles();
  const picks = [spread("M5", 1)[0], spread("M3", 1, 1)[0], spread("M4", 1)[0], spread("M2", 1, 2)[0], spread("SE1", 1)[0], spread("M1", 1)[0]].filter(Boolean);
  const stats = [
    { icon: BookOpenText, v: ad(b.concepts.length), l: "مفهوم مشروح" },
    { icon: FileQuestion, v: ad(b.questions.length), l: "سؤال مع التفسير" },
    { icon: Layers, v: ad(articles.length), l: "مقالة تربوية" },
  ];

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }),
        }}
      />

      {/* الترحيب والبحث */}
      <section className="relative rounded-[28px] bg-[linear-gradient(135deg,#0E4F42,#136F5C_55%,#1F8A70)] px-5 py-9 text-white sm:px-10 sm:py-12">
<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <svg className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden="true">
          <defs><pattern id="hero-dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#fff" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
        <span className="absolute -start-16 -top-16 h-56 w-56 rounded-full bg-[#E8A317]/20" aria-hidden="true" />
        </div>
        <div className="relative max-w-2xl">
          <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-[13px] font-bold">مجاني للمعلمين وطلاب كليات التربية</p>
          <h1 className="mt-4 font-display text-[28px] font-extrabold leading-[1.45] sm:text-[40px]">كل ما يحتاجه المعلم العربي، في مكان واحد</h1>
          <p className="mt-3 text-[16px] leading-8 text-white/85 sm:text-[18px]">مقالات تربوية، ومفاهيم مشروحة بأمثلة من الصف، واستعداد حقيقي لاختبارات الرخصة المهنية والتوظيف.</p>
          <div className="relative z-30 mt-6 max-w-xl text-right"><SearchBox /></div>
          <div className="mt-5 flex flex-wrap gap-2 text-[13px]">
            {["إدارة الصف", "التقويم", "نظريات التعلم", "التربية الخاصة"].map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-white/30 px-3 py-1 font-bold text-white/90 hover:bg-white/10">{t}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* أرقام المحتوى */}
      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl border border-[#E2ECE6] bg-white px-2 py-4 text-center">
            <s.icon className="mx-auto h-6 w-6 text-[#E8A317]" />
            <p className="mt-1.5 font-display text-[22px] font-extrabold text-[#136F5C] sm:text-[26px]">{s.v}</p>
            <p className="text-[12px] leading-5 text-[#5B7268] sm:text-[13px]">{s.l}</p>
          </div>
        ))}
      </section>

      {/* أحدث المقالات */}
      <section>
        <SectionTitle title="أحدث المقالات" color="#B4532A" more={{ href: "/articles", label: "كل المقالات" }} />
        <div className="space-y-5">
          <ArticleCard a={articles[0]} wide />
          <Rail>{articles.slice(1, 7).map((a) => <Tile key={a.slug} card href={`/articles/${a.slug}`} id={a.slug} title={a.title} courseId={articleCourse(a)} meta={a.category} />)}</Rail>
        </div>
      </section>

      {/* أقسام التطبيق */}
      <section>
        <SectionTitle title="تدرّب في تطبيق تربوي" color="#3A55A4" more={{ href: "/sections", label: "كل الأقسام" }} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {APP_SECTIONS.slice(0, 5).map((s, i) => (
            <Link key={s.slug} href={`/sections/${s.slug}`} className={`group overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
              <img src={s.img} alt="" loading="lazy" className="h-28 w-full object-cover transition group-hover:scale-105" />
              <p className="truncate px-3 py-2.5 text-center text-[15px] font-bold text-[#14302A]">{s.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <WithSidebar>
        <div className="space-y-12">
          <section>
            <SectionTitle title="مفاهيم مختارة" color="#7A4E9C" more={{ href: "/learn", label: "كل المحاور" }} />
            <Rail>{picks.map(conceptCard)}</Rail>
          </section>

          {HOME_COURSES.map((id) => (
            <section key={id}>
              <SectionTitle title={courseMeta(id).short} color={courseMeta(id).color} more={{ href: `/learn/${id}`, label: "المزيد" }} />
              <Rail>{spread(id, 4, 1).map(conceptCard)}</Rail>
            </section>
          ))}

          <section className="rounded-2xl border border-[#E2ECE6] bg-white p-5">
            <h2 className="font-display text-[20px] font-extrabold">معجم المصطلحات التربوية</h2>
            <p className="mt-1 leading-7 text-[#4D635A]">كل المصطلحات التربوية في الموقع مرتبة على حروف الهجاء، ولكل مصطلح صفحة بشرحه وأمثلته.</p>
            <Link href="/glossary" className="mt-3 inline-block rounded-xl bg-[#136F5C] px-5 py-2.5 font-bold text-white">تصفّح المصطلحات</Link>
          </section>

          <section>
            <SectionTitle title="أسئلة شائعة" color="#8A6A12" />
            <div className="divide-y divide-[#EEF3F0] overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-5 py-4 open:bg-[#F7FAF8]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF5F1] text-[#136F5C] transition group-open:rotate-180 group-open:bg-[#136F5C] group-open:text-white">
                      <ChevronDown className="h-5 w-5" />
                    </span>
                  </summary>
                  <p className="mt-3 leading-8 text-[#4D635A]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </WithSidebar>
    </div>
  );
}
