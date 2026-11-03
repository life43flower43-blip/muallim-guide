// دليل الاستعداد لاختبار الرخصة المهنية للمعلمين: صفحة محورية تجمع المقالات والأدوات ذات الصلة
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { courseMeta } from "@/lib/site-nav";
import { Crumbs, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "دليل الاستعداد لاختبار الرخصة المهنية للمعلمين: المحاور وخطة المذاكرة | تربوي",
  description:
    "دليل عملي للاستعداد لاختبار الرخصة المهنية والتوظيف للمعلمين: ما الذي يقيسه الجزء التربوي، ومحاوره، وخطة مذاكرة في أربع مراحل، ونماذج أسئلة تفاعلية، وأخطاء شائعة يوم الاختبار.",
  alternates: { canonical: `${SITE_URL}/license-guide` },
};

const AXES = [
  { id: "M1", text: "مراحل النمو وخصائص كل مرحلة، والعوامل المؤثرة فيه." },
  { id: "M2", text: "الدافعية، والانفعالات، والذكاء، والفروق الفردية." },
  { id: "M3", text: "نظريات التعلم: السلوكية، والمعرفية، والبنائية، والاجتماعية." },
  { id: "M4", text: "أنواع التقويم، وبناء الاختبارات، والصدق والثبات." },
  { id: "M5", text: "التخطيط، واستراتيجيات التدريس، وإدارة الصف." },
  { id: "SE1", text: "فئات التربية الخاصة، والتعليم الدامج، وتكييف التدريس." },
  { id: "F1", text: "أسس التربية، وأخلاقيات المهنة، وأدوار المعلم." },
];

// أسئلة شائعة عن الرخصة المهنية في السعودية. الأرقام من مصادر منشورة، والمرجع النهائي هيئة تقويم التعليم والتدريب
const FAQ = [
  { q: "مما يتكون اختبار الرخصة المهنية للمعلمين؟", a: "من جزأين: الاختبار التربوي العام الذي يشترك فيه كل المعلمين، والاختبار التخصصي في مادة المعلم. وتنظمهما هيئة تقويم التعليم والتدريب." },
  { q: "على ماذا يُبنى الاختبار التربوي العام؟", a: "على عشرة معايير مهنية في ثلاثة مجالات: القيم والمسؤوليات المهنية، والمعرفة المهنية، والممارسة المهنية. وشرحنا كل معيار وما يسأل عنه في صفحة المعايير العشرة." },
  { q: "كم عدد أسئلة الاختبار التربوي العام؟", a: "تذكر المصادر المنشورة أنه ٨٨ سؤالًا من نوع الاختيار من متعدد. وقد تتغير التفاصيل من دورة إلى أخرى، فراجع دليل الاختبار الرسمي عند التسجيل." },
  { q: "ما الدرجة المطلوبة لكل مستوى من مستويات الرخصة؟", a: "بحسب الحدود المنشورة: معلم ممارس من ٥٠ إلى ٦٩، ومعلم متقدم من ٧٠ إلى ٧٩، ومعلم خبير ٨٠ فأكثر في الاختبارين. ويرتبط المستوى أيضًا بالمؤهل وسنوات الخبرة. ويمكنك تقدير مستواك بحاسبة مستوى الرخصة." },
  { q: "كم مدة صلاحية الرخصة المهنية؟", a: "تذكر المصادر المنشورة أن صلاحيتها خمس سنوات، ثم تُجدد وفق متطلبات الهيئة، ومنها التطوير المهني." },
  { q: "أين أسجل في الاختبار؟", a: "التسجيل إلكتروني عبر منصة هيئة تقويم التعليم والتدريب (قياس): تختار نوع الاختبار، ثم المدينة ومقر الاختبار والموعد. والمواعيد تُعلن لكل دورة، فتابعها في الموقع الرسمي." },
  { q: "هل أسئلة التجميعات تتكرر في الاختبار؟", a: "الأسئلة تتجدد، والذي يتكرر هو المفاهيم والمواقف. لذلك فهم المفهوم والتدرب على صيغ مختلفة له أنفع من حفظ أسئلة بعينها." },
  { q: "كم أحتاج من الوقت للاستعداد؟", a: "يختلف بحسب مستواك. كثيرون يحتاجون من أربعة أسابيع إلى ثمانية بمذاكرة يومية منتظمة. ابدأ باختبار قصير يكشف أضعف محاورك، ثم خطط على أساسه." },
];

const STEPS = [
  { t: "اعرف مستواك", d: "ابدأ باختبار قصير يكشف أضعف محورين عندك، ولا تبدأ بالقراءة من أول الكتاب.", href: "/practice-test", l: "نموذج اختبار تفاعلي" },
  { t: "افهم قبل أن تحفظ", d: "أغلب الأسئلة مواقف صفية تطبق المفهوم، لا تعريفات. اقرأ المفهوم مع مثاله من الصف.", href: "/learn", l: "المحاور مشروحة" },
  { t: "تدرّب بالاسترجاع", d: "أسئلة قصيرة كل يوم، ومراجعة لما أخطأت فيه بعد أيام، أنفع من إعادة القراءة.", href: "/articles/study-methods-research", l: "طرق المذاكرة المجربة" },
  { t: "جرّب الاختبار كاملًا", d: "في الأسبوعين الأخيرين، اختبار محاكٍ بزمن حقيقي مرة أو مرتين في الأسبوع، ثم تحليل الأخطاء.", href: "/sections/exam-simulator", l: "اختبار المحاكاة" },
];

export default function LicenseGuide() {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "دليل اختبار الرخصة" }]} />
      <article className="space-y-8">
        <header className="rounded-2xl bg-[linear-gradient(135deg,#0E4F42,#136F5C)] p-6 text-white">
          <p className="text-[13px] font-bold text-white/80">دليل شامل</p>
          <h1 className="mt-1 font-display text-[28px] font-extrabold leading-[1.5]">كيف تستعد لاختبار الرخصة المهنية للمعلمين؟</h1>
          <p className="mt-2 leading-8 text-white/85">ما الذي يقيسه الجزء التربوي، وكيف تذاكره بخطة واضحة، وكيف تتدرب عليه.</p>
        </header>

        <section className="rounded-2xl border border-[#E2ECE6] bg-white p-5 leading-8 text-[#3A5249]">
          <h2 className="font-display text-[21px] font-extrabold text-[#14302A]">ما اختبار الرخصة المهنية؟</h2>
          <p className="mt-2">
            تشترط دول عربية عدة، منها السعودية والإمارات، أن يجتاز المعلم اختبارًا قبل أن يحصل على رخصة مزاولة المهنة أو يتقدم للتوظيف. وتتكون هذه الاختبارات غالبًا من جزأين: جزء تربوي عام يشترك فيه كل المعلمين، وجزء تخصصي في مادة المعلم.
          </p>
          <p className="mt-2">
            تختلف التفاصيل من بلد إلى آخر: الجهة المنظمة، وعدد الأسئلة، والزمن، ودرجة النجاح، ومدة صلاحية الرخصة. لذلك راجع دائمًا الدليل الرسمي في بلدك قبل التسجيل. وفي السعودية مثلًا، تنظم هيئة تقويم التعليم والتدريب اختبارات الرخصة المهنية.
          </p>
        </section>

        <Link href="/specialized" className="flex items-center justify-between rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
          <span>
            <span className="block font-display text-[18px] font-extrabold text-[#14302A]">أدلة الاختبار التخصصي</span>
            <span className="mt-1 block text-[14px] leading-7 text-[#4D635A]">اثنا عشر تخصصًا: الرياضيات، والعربية، والعلوم، والإنجليزي، ورياض الأطفال، وغيرها.</span>
          </span>
          <ChevronLeft className="h-5 w-5 shrink-0 text-[#136F5C]" />
        </Link>

        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/weekly-test" className="rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
            <span className="block font-display text-[18px] font-extrabold text-[#14302A]">اختبار الأسبوع</span>
            <span className="mt-1 block text-[14px] leading-7 text-[#4D635A]">عشرون سؤالًا جديدة كل أحد، مع تقرير لنقاط ضعفك.</span>
          </Link>
          <Link href="/standards" className="rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
            <span className="block font-display text-[18px] font-extrabold text-[#14302A]">المعايير العشرة للاختبار التربوي العام</span>
            <span className="mt-1 block text-[14px] leading-7 text-[#4D635A]">ثلاثة مجالات وعشرة معايير، وما يسأل عنه الاختبار في كل معيار، ودروس تغطيه.</span>
          </Link>
          <Link href="/license-calculator" className="rounded-2xl border border-[#E2ECE6] bg-white p-5 hover:border-[#136F5C]">
            <span className="block font-display text-[18px] font-extrabold text-[#14302A]">حاسبة مستوى الرخصة</span>
            <span className="mt-1 block text-[14px] leading-7 text-[#4D635A]">اكتب درجتيك، واعرف هل مستواك ممارس أم متقدم أم خبير.</span>
          </Link>
        </section>

        <section>
          <h2 className="mb-3 font-display text-[21px] font-extrabold">محاور الجزء التربوي</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {AXES.map((a) => (
              <Link key={a.id} href={`/learn/${a.id}`} className="flex items-start gap-3 rounded-2xl border border-[#E2ECE6] bg-white p-4 hover:border-[#136F5C]">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: courseMeta(a.id).color }} />
                <span>
                  <span className="block font-bold text-[#14302A]">{courseMeta(a.id).short}</span>
                  <span className="mt-0.5 block text-[14px] leading-7 text-[#4D635A]">{a.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-[21px] font-extrabold">خطة المذاكرة في أربع مراحل</h2>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-4 rounded-2xl border border-[#E2ECE6] bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#136F5C] font-display text-[18px] font-extrabold text-white">{"١٢٣٤"[i]}</span>
                <span className="min-w-0">
                  <span className="block font-bold text-[#14302A]">{s.t}</span>
                  <span className="mt-0.5 block text-[15px] leading-7 text-[#4D635A]">{s.d}</span>
                  <Link href={s.href} className="mt-1 inline-flex items-center gap-1 text-[14px] font-bold text-[#136F5C]">{s.l} <ChevronLeft className="h-4 w-4" /></Link>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-[#E2ECE6] bg-white p-5">
          <h2 className="font-display text-[21px] font-extrabold">قبل يوم الاختبار</h2>
          <ul className="mt-3 space-y-2.5">
            {[
              "اقرأ تعليمات الاختبار الرسمية: الوثائق المطلوبة، وموعد الحضور، وما يُسمح بإدخاله.",
              "نم جيدًا في الليلة السابقة. المذاكرة حتى الفجر تضعف التذكر في اليوم التالي.",
              "في الاختبار: اقرأ السؤال كاملًا، واستبعد الخيارات الخاطئة، ولا تقف طويلًا عند سؤال واحد.",
              "في أسئلة المواقف، ابحث عن التصرف الذي يخدم تعلم الطالب ويحفظ كرامته، فهو غالبًا الصحيح.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5 leading-7 text-[#3A5249]"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#136F5C]" />{t}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq">
          <h2 id="faq" className="mb-3 font-display text-[21px] font-extrabold">أسئلة شائعة عن الرخصة المهنية</h2>
          <div className="divide-y divide-[#EEF3F0] overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4 open:bg-[#F7FAF8]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold leading-7 text-[#14302A]">
                  {f.q}
                  <ChevronLeft className="h-4 w-4 shrink-0 text-[#136F5C] transition group-open:-rotate-90" />
                </summary>
                <p className="mt-2 leading-8 text-[#3A5249]">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-7 text-[#6B8077]">المرجع الرسمي للمواعيد والشروط والأرقام: <a href="https://www.etec.gov.sa" target="_blank" rel="noopener noreferrer" className="font-bold text-[#136F5C] underline">هيئة تقويم التعليم والتدريب</a>.</p>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }) }}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/articles/license-exam-plan", t: "مقال: خطة الاستعداد في أربع مراحل" },
            { href: "/articles/test-anxiety", t: "مقال: قلق الاختبار وكيف تتعامل معه" },
            { href: "/articles/teaching-ethics", t: "مقال: أخلاقيات مهنة التعليم" },
            { href: "/glossary", t: "معجم المصطلحات التربوية" },
          ].map((x) => (
            <Link key={x.href} href={x.href} className="flex items-center justify-between rounded-2xl border border-[#E2ECE6] bg-white p-4 font-bold text-[#14302A] hover:border-[#136F5C]">
              {x.t} <ChevronLeft className="h-4 w-4 text-[#136F5C]" />
            </Link>
          ))}
        </section>
      </article>
    </WithSidebar>
  );
}
