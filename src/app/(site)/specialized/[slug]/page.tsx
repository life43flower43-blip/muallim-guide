// دليل اختبار تخصصي واحد: المجالات، وما تركز عليه، وأخطاء شائعة، والأدلة المنشورة، ودروس من الموقع
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, AlertTriangle, FileText, ChevronLeft } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { SPECIALTIES, specialtyBySlug } from "@/lib/specialties";
import { articleBySlug } from "@/lib/articles";
import { courseMeta } from "@/lib/site-nav";
import { ad } from "@/lib/arabic";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";

export const dynamicParams = false;
export const revalidate = 3600;
export function generateStaticParams() {
  return SPECIALTIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = specialtyBySlug((await params).slug);
  if (!s) return {};
  return {
    title: `دليل اختبار ${s.name} التخصصي للرخصة المهنية: المجالات وخطة المذاكرة | تربوي`,
    description: `مجالات الاختبار التخصصي في ${s.name} للرخصة المهنية للمعلمين، وما تركز عليه في المذاكرة، وأخطاء شائعة، ورابط الدليل المنشور.`,
    alternates: { canonical: `${SITE_URL}/specialized/${s.slug}` },
  };
}

export default async function SpecialtyPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = specialtyBySlug((await params).slug);
  if (!s) notFound();
  const arts = s.articles.map((x) => articleBySlug(x)).filter((a): a is NonNullable<typeof a> => !!a);
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/specialized", label: "الاختبارات التخصصية" }, { label: s.name }]} />
      <PageHero kicker="الرخصة المهنية في السعودية" title={`دليل اختبار ${s.name}`} color={s.color} sub={s.who} />

      <p className="mt-5 rounded-2xl border border-[#E2ECE6] bg-white p-5 text-[15px] leading-8 text-[#3A5249]">{s.levels}</p>

      <section className="mt-8">
        <h2 className="font-display text-[21px] font-extrabold text-[#14302A]">مجالات الاختبار</h2>
        <p className="mt-1 text-[14px] text-[#6B8077]">أبرز ما يغطيه الاختبار بصياغة مبسطة منا. التفصيل الكامل والأوزان في الدليل المنشور.</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {s.domains.map((d, i) => (
            <li key={d.t} className="flex gap-3 rounded-2xl border border-[#E2ECE6] bg-white p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#136F5C] text-[13px] font-extrabold text-white">{ad(i + 1)}</span>
              <span>
                <span className="block font-extrabold text-[#14302A]">{d.t}</span>
                <span className="mt-1 block text-[14px] leading-7 text-[#4A6158]">{d.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#E2ECE6] bg-white p-5">
          <h2 className="font-display text-[18px] font-extrabold text-[#14302A]">ركّز في مذاكرتك على</h2>
          <ul className="mt-3 space-y-2.5">
            {s.focus.map((x) => <li key={x} className="flex gap-2 text-[14.5px] leading-7 text-[#3A5249]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#1E7B4A]" />{x}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#E2ECE6] bg-white p-5">
          <h2 className="font-display text-[18px] font-extrabold text-[#14302A]">أخطاء شائعة</h2>
          <ul className="mt-3 space-y-2.5">
            {s.pitfalls.map((x) => <li key={x} className="flex gap-2 text-[14.5px] leading-7 text-[#3A5249]"><AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[#B4532A]" />{x}</li>)}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[#E2ECE6] bg-white p-5">
        <h2 className="font-display text-[18px] font-extrabold text-[#14302A]">خطة مذاكرة مقترحة</h2>
        <ol className="mt-3 list-decimal space-y-2 ps-5 text-[14.5px] leading-7 text-[#3A5249] marker:font-bold marker:text-[#136F5C]">
          <li>نزّل الدليل المنشور لتخصصك، واكتب قائمة بمعاييره.</li>
          <li>قيّم نفسك في كل معيار من ١ إلى ٣، وابدأ بالأضعف والأكبر وزنًا.</li>
          <li>ذاكر من مقررات تخصصك الجامعية وكتب المرحلة التي ستدرّسها.</li>
          <li>خصص وقتًا ثابتًا لطرق تدريس التخصص، فأسئلتها مواقف كأسئلة الاختبار العام.</li>
          <li>تدرّب على أسئلة بوقت محسوب، وسجّل أخطاءك وراجعها.</li>
        </ol>
      </section>

      {s.guides.length === 0 && (
        <p className="mt-8 rounded-xl bg-[#FFF8E6] p-4 text-[14px] leading-7 text-[#5A4A1E]">الدليل الرسمي لهذا التخصص ومعاييره وأوزانه متاح لدى <a href="https://www.etec.gov.sa" target="_blank" rel="noopener noreferrer" className="font-bold underline">هيئة تقويم التعليم والتدريب</a>. والمجالات أعلاه تقريب منا لأبرز ما يغطيه الاختبار، فراجع الدليل الرسمي قبل أن تبني خطتك.</p>
      )}

      {s.guides.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-[18px] font-extrabold text-[#14302A]">الأدلة المنشورة</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {s.guides.map((g) => (
              <li key={g.href}>
                <a href={g.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-[#E2ECE6] bg-white p-4 font-bold text-[#14302A] hover:border-[#136F5C]">
                  <FileText className="h-5 w-5 shrink-0 text-[#B4532A]" /> {g.t}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] leading-7 text-[#6B8077]">أدلة منشورة على موقع جامعة الملك فيصل، وبعضها نسخ تجريبية سابقة. تحقق من أحدث نسخة لدى <a href="https://www.etec.gov.sa" target="_blank" rel="noopener noreferrer" className="font-bold text-[#136F5C] underline">هيئة تقويم التعليم والتدريب</a>.</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-[18px] font-extrabold text-[#14302A]">من الموقع</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.courses.map((cid) => (
            <Link key={cid} href={`/learn/${cid}`} className="rounded-lg bg-[#F3F6F4] px-2.5 py-1 text-[13.5px] font-bold text-[#2E4A42] hover:bg-[#E6EFEA]">محور {courseMeta(cid).short}</Link>
          ))}
          <Link href="/standards" className="rounded-lg bg-[#F3F6F4] px-2.5 py-1 text-[13.5px] font-bold text-[#2E4A42] hover:bg-[#E6EFEA]">المعايير العشرة للاختبار العام</Link>
        </div>
        {arts.length > 0 && (
          <ul className="mt-3 divide-y divide-[#EEF3F0] rounded-2xl border border-[#E2ECE6] bg-white px-4">
            {arts.map((a) => (
              <li key={a.slug}>
                <Link href={`/articles/${a.slug}`} className="flex items-center gap-2 py-3 text-[14.5px] leading-6 text-[#14302A] hover:text-[#136F5C]">
                  <span className="min-w-0 flex-1">{a.title}</span><ChevronLeft className="h-4 w-4 shrink-0 text-[#B5C6BE]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </WithSidebar>
  );
}
