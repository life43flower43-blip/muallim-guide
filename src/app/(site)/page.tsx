// الصفحة الرئيسية: ترحيب وبحث، وأحدث المقالات، وسؤال اليوم والاختبار، والمحاور، ومصادر التعلم، والتطبيق، وأسئلة شائعة
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BookOpenText, ChevronDown, FileQuestion, Layers, Network, Scale, School, Search } from "lucide-react";
import { SITE_URL, courseList, publicBank } from "@/lib/public-bank";
import { allArticles } from "@/lib/articles";
import { courseMeta, pickQuestions } from "@/lib/site-nav";
import DailyQuestion from "@/components/site/DailyQuestion";
import SearchBox from "@/components/site/SearchBox";
import CatChips from "@/components/site/CatChips";
import { ArticleCard, SectionTitle, Tile } from "@/components/site/Blocks";
import { RotateOne, Shuffle } from "@/components/site/Rotate";
import { articleCourse } from "@/lib/articles";
import { ad } from "@/lib/arabic";

// المقالات المجدولة تظهر في موعدها دون إعادة بناء
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "تربوي | الاستعداد لاختبار الرخصة المهنية والتوظيف للمعلمين",
  description:
    "موقع عربي مجاني للمعلمين وطلاب كليات التربية: مقالات تربوية، ومفاهيم مشروحة بأمثلة من الصف، وآلاف الأسئلة مع تفسير كل خيار، واختبارات محاكية، ومواقف صفية، وأدوات للقياس والتقويم.",
  alternates: { canonical: `${SITE_URL}/` },
};


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
  const courses = courseList().filter((c) => c.concepts.length > 0);
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
        <span className="absolute -start-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
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
          <p className="mt-5 text-[13.5px] font-bold text-white/75">{stats.map((x) => `${x.v} ${x.l}`).join(" · ")}</p>
        </div>
      </section>

      {/* أحدث المقالات */}
      <section>
        <SectionTitle title="أحدث المقالات" more={{ href: "/articles", label: "كل المقالات" }} />
        <div className="mb-4"><CatChips /></div>
        <div className="space-y-5">
          {/* مقال مميز مختلف في كل زيارة من أحدث ١٢ مقالًا، وبقية الشريط مخلوطة */}
          <RotateOne ids={articles.slice(0, 12).map((a) => a.slug)}>{articles.slice(0, 12).map((a) => <ArticleCard key={a.slug} a={a} wide />)}</RotateOne>
          <Rail><Shuffle show={6}>{articles.slice(0, 24).map((a) => <Tile key={a.slug} card href={`/articles/${a.slug}`} id={a.slug} title={a.title} courseId={articleCourse(a)} meta={a.category} />)}</Shuffle></Rail>
        </div>
      </section>

      {/* سؤال اليوم ونموذج الاختبار */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <SectionTitle title="سؤال اليوم" />
          <DailyQuestion pool={pickQuestions(60, 3)} />
        </div>
        <div className="flex flex-col gap-4">
          <SectionTitle title="اختبر نفسك" more={{ href: "/practice-test", label: "ابدأ" }} />
          <Link href="/practice-test" className="group flex flex-1 flex-col justify-between rounded-2xl bg-[#136F5C] p-5 text-white">
            <span>
              <span className="block font-display text-[22px] font-extrabold">نموذج اختبار تربوي تفاعلي</span>
              <span className="mt-1 block text-[15px] leading-7 text-white/85">عشرون سؤالًا بمستوى اختبارات الرخصة والتوظيف، مع التصحيح والتفسير فورًا.</span>
            </span>
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-[#136F5C]">ابدأ النموذج</span>
          </Link>
          {/* أدوات الاستعداد للرخصة */}
          <ul className="divide-y divide-[#EEF3F0] overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
            {[
              { href: "/weekly-test", t: "اختبار الأسبوع", d: "عشرون سؤالًا جديدة كل أحد" },
              { href: "/standards", t: "المعايير العشرة", d: "ما يقيسه الاختبار التربوي العام" },
              { href: "/license-calculator", t: "حاسبة مستوى الرخصة", d: "ممارس أم متقدم أم خبير؟" },
              { href: "/license-guide", t: "دليل الاستعداد للرخصة", d: "خطة المذاكرة والأسئلة الشائعة" },
            ].map((x) => (
              <li key={x.href}>
                <Link href={x.href} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F7FAF8]">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[#14302A]">{x.t}</span>
                    <span className="block text-[13px] text-[#6B8077]">{x.d}</span>
                  </span>
                  <span className="text-[#136F5C]">←</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* المحاور: كل محاور الإعداد التربوي في شبكة واحدة */}
      <section>
        <SectionTitle title="تصفّح المحاور" more={{ href: "/learn", label: "كل المحاور" }} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/learn/${c.id}`} className="flex h-full flex-col rounded-2xl border border-[#E2ECE6] bg-white p-4 hover:border-[#136F5C]">
                <span className="font-display text-[16px] font-extrabold leading-7 text-[#14302A]">{courseMeta(c.id).short}</span>
                <span className="mt-auto pt-1 text-[13px] text-[#6B8077]">{ad(c.concepts.length)} مفهومًا</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* مصادر التعلم */}
      <section>
        <SectionTitle title="مصادر التعلم" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/classroom-problems", t: "مشكلات صفية", d: "مواقف حقيقية: التصرف التقليدي وأثره، والتصرف الأفضل ولماذا ينجح.", Icon: School },
            { href: "/misconceptions", t: "مفاهيم خاطئة شائعة", d: "أفكار يتداولها المعلمون عن التعلم. صحيحة أم خاطئة؟", Icon: AlertTriangle },
            { href: "/comparisons", t: "مقارنات تربوية", d: "مفاهيم يكثر الخلط بينها جنبًا إلى جنب، مع مفتاح للتمييز.", Icon: Scale },
            { href: "/mind-maps", t: "خرائط ذهنية تفاعلية", d: "كل محور في خريطة تتفرع بالضغط، لمراجعة فصل كامل في دقائق.", Icon: Network },
            { href: "/glossary", t: "معجم المصطلحات", d: "المصطلحات التربوية مرتبة على حروف الهجاء، لكل منها شرح وأمثلة.", Icon: BookOpenText },
          ].map((x) => (
            <li key={x.href}>
              <Link href={x.href} className="flex h-full items-start gap-4 rounded-2xl border border-[#E2ECE6] bg-white p-4 hover:border-[#136F5C]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF5F1]"><x.Icon className="h-5 w-5 text-[#136F5C]" /></span>
                <span>
                  <span className="block font-extrabold text-[#14302A]">{x.t}</span>
                  <span className="mt-0.5 block text-[14px] leading-7 text-[#4D635A]">{x.d}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* التطبيق */}
      <section className="overflow-hidden rounded-[28px] bg-[#0E3B32] text-white">
        <div className="grid items-center gap-6 p-6 sm:p-9 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-[13px] font-bold text-[#A7F3D0]">تطبيق تربوي، مجاني</p>
            <h2 className="mt-2 font-display text-[24px] font-extrabold leading-[1.45] sm:text-[30px]">تدرّب كأنك في الاختبار</h2>
            <ul className="mt-3 space-y-1.5 text-[15px] leading-7 text-white/85">
              <li>آلاف الأسئلة مع تفسير كل خيار</li>
              <li>اختبار محاكاة بزمن حقيقي وتحليل لكل محور</li>
              <li>مراجعة أخطائك في موعدها حتى تثبت</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link prefetch={false} href="/app" className="inline-flex h-11 items-center rounded-xl bg-[#7C5CFF] px-5 font-bold text-white">ابدأ التدريب مجانًا</Link>
              <Link prefetch={false} href="/tatbeeq" className="inline-flex h-11 items-center rounded-xl border border-white/30 px-5 font-bold text-white">تعرّف على التطبيق</Link>
            </div>
          </div>
          <img src="/shots/home.jpg" alt="الشاشة الرئيسية في تطبيق تربوي" loading="lazy" className="mx-auto hidden w-56 rounded-[22px] border-4 border-white/10 md:block" />
        </div>
      </section>

      {/* أسئلة شائعة */}
      <section>
        <SectionTitle title="أسئلة شائعة" />
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
  );
}
