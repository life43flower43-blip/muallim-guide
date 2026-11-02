// الصفحة الرئيسية للموقع: تعرّف بتربوي لمن يصل من البحث أو من رابط، وتقوده إلى المحاور أو إلى التطبيق
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, courseChapters, courseList, publicBank } from "@/lib/public-bank";
import { ad, arCount, CHAPTER_FORMS, CONCEPT_FORMS } from "@/lib/arabic";

export const metadata: Metadata = {
  title: "تربوي | الاستعداد لاختبار الرخصة المهنية والتوظيف للمعلمين",
  description:
    "منصة عربية مجانية للمعلمين وطلاب كليات التربية: مفاهيم تربوية مشروحة بأمثلة من الصف، وآلاف الأسئلة مع تفسير كل خيار، واختبارات محاكية، ومواقف صفية، وأدوات للقياس والتقويم.",
  alternates: { canonical: `${SITE_URL}/` },
};

const FEATURES = [
  { img: "/home/concepts-v2.jpg", title: "مفاهيم مشروحة بأمثلة", text: "كل مفهوم تربوي بلغة واضحة، مع مثال من الصف وقاعدة تطبقها، وخرائط ذهنية لكل فصل." },
  { img: "/home/test-v2.jpg", title: "أسئلة بتفسير لكل خيار", text: "لا تعرف أنك أخطأت فقط، بل لماذا كان اختيارك خطأ، ولماذا كانت الإجابة الصحيحة صحيحة." },
  { img: "/home/situations-v2.jpg", title: "مواقف صفية حقيقية", text: "تختار تصرفك في موقف من الصف، ثم ترى أثره والمفهوم التربوي الذي يفسره." },
  { img: "/home/plan-v2.jpg", title: "أدوات المعلم الجاهزة", text: "خطط دروس كاملة، وجدول مواصفات، وسلم تقدير، وتحليل البدائل، وحساب الثبات." },
];

const STEPS = [
  { n: 1, title: "اعرف مستواك", text: "اختبار قصير يقيس أداءك في كل محور، ويرتب لك من أين تبدأ." },
  { n: 2, title: "تدرّب كل يوم", text: "عشر دقائق من الأسئلة، ومراجعة تعيد عليك ما أخطأت فيه في الوقت الذي تبدأ فيه بنسيانه." },
  { n: 3, title: "جرّب الاختبار كاملًا", text: "محاكٍ بأقسام وزمن محدد، ثم تحليل لكل قسم يوضح أين تحتاج مراجعة." },
];

const FAQ = [
  { q: "هل تربوي مجاني؟", a: "نعم. المحتوى والأسئلة والأدوات متاحة مجانًا، ويمكنك أن تبدأ دون تسجيل." },
  { q: "لمن هذا الموقع؟", a: "للمتقدمين لاختبارات الرخصة المهنية والتوظيف في التعليم في البلاد العربية، ولطلاب كليات التربية، وللمعلمين الذين يطورون ممارستهم." },
  { q: "هل يطابق اختبار بلدي الرسمي؟", a: "يغطي المحاور التربوية المشتركة في أغلب هذه الاختبارات، لكنه ليس الاختبار الرسمي. راجع دليل الاختبار في بلدك لمعرفة المحاور وأوزانها." },
  { q: "هل يعمل على الهاتف؟", a: "نعم. يفتح من المتصفح، ويمكنك تثبيته على الشاشة الرئيسية ليعمل كتطبيق، حتى دون اتصال بعد أول فتح." },
];

export default function Home() {
  const b = publicBank();
  const courses = courseList().filter((c) => c.concepts.length > 0);
  const stats = [
    { v: ad(b.concepts.length), l: "مفهومًا تربويًا" },
    { v: ad(b.questions.length), l: "سؤالًا مع التفسير" },
    { v: ad(courses.length), l: courses.length >= 3 && courses.length <= 10 ? "محاور" : "محورًا" },
  ];

  return (
    <div className="space-y-14">
      {/* البداية: ماذا نقدّم ولمن */}
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">مجاني بالكامل</p>
          <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.35] sm:text-4xl">استعد لاختبار المعلمين وأنت تفهم، لا وأنت تحفظ</h1>
          <p className="mt-4 text-lg leading-8 text-secondary-foreground">
            تربوي يجمع لك المفاهيم التربوية مشروحة بأمثلة من الصف، وأسئلة بمستوى اختبارات الرخصة المهنية والتوظيف مع تفسير كل خيار، واختبارات محاكية بزمن حقيقي.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="rounded-2xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground">ابدأ التدريب مجانًا</Link>
            <Link href="/learn" className="rounded-2xl border border-border bg-card px-6 py-3 text-base font-bold text-foreground">تصفّح المحاور</Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/situations-v2.jpg" alt="صف دراسي هادئ" className="aspect-[4/3] w-full rounded-[28px] border border-border object-cover" />
      </section>

      {/* أرقام المحتوى */}
      <section className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card px-3 py-4 text-center">
            <p className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{s.v}</p>
            <p className="mt-1 text-sm text-secondary-foreground">{s.l}</p>
          </div>
        ))}
      </section>

      {/* ما الذي تجده */}
      <section>
        <h2 className="font-display text-2xl font-bold">ماذا تجد في تربوي؟</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="overflow-hidden rounded-[24px] border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.img} alt="" className="h-40 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-1 leading-7 text-secondary-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* كيف تستعد */}
      <section>
        <h2 className="font-display text-2xl font-bold">كيف تستعد في ثلاث خطوات؟</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-[24px] border border-border bg-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground">{ad(s.n)}</span>
              <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1 leading-7 text-secondary-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* المحاور: تقود إلى صفحات الشرح العامة */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">المحاور</h2>
          <Link href="/learn" className="text-sm font-bold text-primary">كل المحاور</Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.id} href={`/learn/${c.id}`} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
              <h3 className="font-display text-base font-bold">{c.name}</h3>
              <p className="mt-1 text-sm text-secondary-foreground">
                {arCount(courseChapters(c.id).length, CHAPTER_FORMS)}، {arCount(c.concepts.length, CONCEPT_FORMS)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* أسئلة شائعة */}
      <section>
        <h2 className="font-display text-2xl font-bold">أسئلة شائعة</h2>
        <div className="mt-5 divide-y divide-border rounded-[24px] border border-border bg-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-bold">{f.q}</summary>
              <p className="mt-2 leading-7 text-secondary-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* الدعوة الأخيرة */}
      <section className="rounded-[28px] bg-accent px-6 py-8 text-center">
        <h2 className="font-display text-2xl font-bold text-accent-foreground">ابدأ بعشر دقائق اليوم</h2>
        <p className="mx-auto mt-2 max-w-xl leading-7 text-accent-foreground">اختبار قصير يحدد مستواك، ثم خطة تبدأ بالمحور الأضعف. لا تحتاج تسجيلًا لتبدأ.</p>
        <Link href="/app" className="mt-5 inline-block rounded-2xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground">افتح التطبيق</Link>
      </section>
    </div>
  );
}
