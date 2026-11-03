// صفحة «من نحن»: صفحة قائمة بذاتها، فيها رسالة الموقع ولمن هو وما يقدمه وكيف يُكتب محتواه، دون شريط جانبي
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, GraduationCap, School, Users, PenLine, ShieldCheck, RefreshCw, MessageSquareWarning, Smartphone, Mail } from "lucide-react";
import { SITE_URL, courseList, publicBank } from "@/lib/public-bank";
import { allArticles } from "@/lib/articles";
import { ad } from "@/lib/arabic";
import { Crumbs } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "من نحن | تربوي",
  description: "تربوي دليل عربي مجاني لإعداد المعلمين وطلاب كليات التربية والمتقدمين لاختبارات الرخصة المهنية والتوظيف: رسالتنا، ولمن نكتب، وكيف نعد المحتوى.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export const revalidate = 3600;

const AUDIENCE = [
  { icon: GraduationCap, t: "طلاب كليات التربية", d: "شرح مبسط لمقررات الإعداد التربوي، بأمثلة من الصف لا تعريفات محفوظة." },
  { icon: BookOpenCheck, t: "المتقدمون لاختبار الرخصة والتوظيف", d: "أسئلة تدريب بتفسير بعد كل إجابة، واختبارات محاكية بوقت حقيقي." },
  { icon: School, t: "المعلمون في الميدان", d: "مقالات عملية في إدارة الصف والتقويم واستراتيجيات التدريس." },
];

const PRINCIPLES = [
  { icon: PenLine, t: "صياغة أصلية", d: "نكتب كل مفهوم ومقال بأسلوبنا، ولا ننسخ من مواقع أو كتب أخرى." },
  { icon: ShieldCheck, t: "مستند إلى الأدبيات التربوية", d: "نعتمد على ما هو مستقر في علم النفس التربوي والقياس وطرق التدريس، ونذكر أسماء أصحاب النظريات بدقة." },
  { icon: Users, t: "من واقع الصف", d: "كل فكرة مع مثال يحدث فعلًا في المدرسة، لأن أسئلة الاختبارات مواقف لا تعريفات." },
  { icon: RefreshCw, t: "مراجعة مستمرة", d: "نصحح ما يصلنا من ملاحظات، ونضيف مقالات جديدة كل أحد وثلاثاء وخميس." },
];

export default function About() {
  const bank = publicBank();
  const stats = [
    { n: ad(bank.concepts.length), t: "مفهوم مشروح" },
    { n: ad(bank.questions.length), t: "سؤال بتفسير" },
    { n: ad(courseList().filter((c) => c.concepts.length > 0).length), t: "محاور" },
    { n: ad(allArticles().length), t: "مقال" },
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <Crumbs items={[{ label: "من نحن" }]} />

      <header className="pb-2 pt-2 text-center">
        <img src="/icons/logo-128.png" alt="" className="mx-auto h-16 w-16 rounded-2xl border border-[#E2ECE6] bg-white object-contain p-1" />
        <h1 className="mt-4 font-display text-[30px] font-extrabold leading-[1.4] text-[#14302A] sm:text-[38px]">نساعد المعلم العربي على أن يفهم، لا أن يحفظ</h1>
        <p className="mx-auto mt-3 max-w-2xl text-[16.5px] leading-8 text-[#4A6158]">
          تربوي دليل عربي مجاني للإعداد التربوي. بدأ من سؤال بسيط: لماذا يحفظ المتقدمون لاختبار المعلمين مئات التعريفات، ثم يتعثرون أمام سؤال يصف موقفًا صفيًا؟ فبنينا محتوى يشرح المفهوم بمثال من الصف، ويدرّب عليه بأسئلة مواقف وتفسير لكل إجابة.
        </p>
      </header>

      <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.t} className={`p-5 text-center ${i % 2 ? "" : "border-e"} border-[#EEF3F0] ${i < 2 ? "border-b sm:border-b-0" : ""} sm:border-e sm:last:border-e-0`}>
            <dt className="font-display text-[28px] font-extrabold text-[#136F5C]">{s.n}</dt>
            <dd className="mt-1 text-[13.5px] font-bold text-[#5B7268]">{s.t}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="font-display text-[23px] font-extrabold text-[#14302A]">لمن نكتب</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {AUDIENCE.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-[#E2ECE6] bg-white p-5">
              <Icon className="h-7 w-7 text-[#136F5C]" strokeWidth={1.8} />
              <h3 className="mt-3 text-[16px] font-extrabold text-[#14302A]">{t}</h3>
              <p className="mt-1.5 text-[14.5px] leading-7 text-[#4A6158]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-[23px] font-extrabold text-[#14302A]">كيف نكتب المحتوى</h2>
          <p className="mt-3 text-[15.5px] leading-8 text-[#4A6158]">المحتوى التربوي الجيد ليس قائمة تعريفات. هذه المبادئ التي نلتزم بها في كل ما ننشره في الموقع والتطبيق. <Link href="/editorial-policy" className="font-bold text-[#136F5C]">التفاصيل في سياسة التحرير</Link>.</p>
        </div>
        <ul className="divide-y divide-[#EEF3F0] rounded-2xl border border-[#E2ECE6] bg-white">
          {PRINCIPLES.map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5F1]"><Icon className="h-5 w-5 text-[#136F5C]" /></span>
              <span>
                <span className="block text-[16px] font-extrabold text-[#14302A]">{t}</span>
                <span className="mt-1 block text-[14.5px] leading-7 text-[#4A6158]">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-[#E2ECE6] bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <MessageSquareWarning className="mt-1 h-7 w-7 shrink-0 text-[#B4532A]" strokeWidth={1.8} />
          <div>
            <h2 className="font-display text-[21px] font-extrabold text-[#14302A]">وجدت خطأ؟</h2>
            <p className="mt-2 text-[15.5px] leading-8 text-[#4A6158]">نرحب بكل ملاحظة على خطأ علمي أو لغوي. راسلنا من صفحة التواصل، أو استخدم زر «أبلغ عن خطأ» تحت أي سؤال في التطبيق، وسنراجعه ونصححه.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-[#0E3B32] p-7 text-center text-white sm:p-9">
        <h2 className="font-display text-[23px] font-extrabold">ابدأ التدريب اليوم</h2>
        <p className="max-w-xl text-[15px] leading-8 text-white/80">التطبيق مجاني، وفيه كل المفاهيم والأسئلة والاختبارات المحاكية.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link prefetch={false} href="/tatbeeq" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#7C5CFF] px-5 text-[14.5px] font-bold text-white"><Smartphone className="h-4 w-4" /> تعرّف على التطبيق</Link>
          <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/30 px-5 text-[14.5px] font-bold text-white"><Mail className="h-4 w-4" /> تواصل معنا</Link>
        </div>
      </section>
    </div>
  );
}
