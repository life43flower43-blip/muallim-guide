// المعايير العشرة للاختبار التربوي العام: المجالات الثلاثة، وما يقيسه كل معيار، وروابط لما يغطيه في الموقع
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Calculator, ClipboardCheck } from "lucide-react";
import { SITE_URL, courseList } from "@/lib/public-bank";
import { DOMAINS, ALL_STANDARDS } from "@/lib/standards";
import { articleBySlug } from "@/lib/articles";
import { courseMeta } from "@/lib/site-nav";
import { ad } from "@/lib/arabic";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";

export const revalidate = 3600;

const ORD = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

export const metadata: Metadata = {
  title: "معايير الاختبار التربوي العام العشرة للرخصة المهنية | تربوي",
  description:
    "شرح المعايير العشرة للاختبار التربوي العام في الرخصة المهنية للمعلمين، موزعة على مجالات القيم والمسؤوليات المهنية والمعرفة المهنية والممارسة المهنية، مع ما يسأل عنه الاختبار في كل معيار ودروس للمذاكرة.",
  alternates: { canonical: `${SITE_URL}/standards` },
};

export default function Standards() {
  const counts = new Map(courseList().map((c) => [c.id, c.concepts.length]));
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/license-guide", label: "دليل الرخصة" }, { label: "المعايير العشرة" }]} />
      <PageHero
        kicker="الرخصة المهنية في السعودية"
        title="المعايير العشرة للرخصة المهنية"
        color="#14302A"
        sub="يُبنى الاختبار التربوي العام على عشرة معايير في ثلاثة مجالات. ذاكر بها لا بالفصول وحدها: لكل معيار هنا ما يقيسه، وما يسأل عنه الاختبار غالبًا، ودروس من الموقع تغطيه."
      />

      {/* فهرس المجالات والمعايير */}
      <nav aria-label="المعايير" className="mt-5 grid gap-3 md:grid-cols-3">
        {DOMAINS.map((d) => (
          <div key={d.id} className="rounded-2xl border border-[#E2ECE6] bg-white p-4">
            <p className="text-[12.5px] font-bold" style={{ color: d.color }}>مجال</p>
            <p className="font-display text-[17px] font-extrabold text-[#14302A]">{d.title}</p>
            <ol className="mt-2 space-y-1">
              {d.standards.map((s) => (
                <li key={s.slug}>
                  <a href={`#${s.slug}`} className="flex gap-2 py-1 text-[14px] leading-6 text-[#2E4A42] hover:text-[#136F5C]">
                    <span className="font-bold" style={{ color: d.color }}>{ad(s.n)}.</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </nav>

      <div className="mt-8 space-y-10">
        {DOMAINS.map((d) => (
          <section key={d.id} aria-labelledby={`d-${d.id}`}>
            <div className="border-b-2 pb-2" style={{ borderColor: d.color }}>
              <h2 id={`d-${d.id}`} className="font-display text-[22px] font-extrabold text-[#14302A]">{d.title}</h2>
              <p className="mt-1 text-[14.5px] leading-7 text-[#4A6158]">{d.about}</p>
            </div>
            <div className="mt-4 space-y-4">
              {d.standards.map((s) => {
                const arts = s.articles.map((slug) => articleBySlug(slug)).filter((a): a is NonNullable<typeof a> => !!a).slice(0, 5);
                return (
                  <article key={s.slug} id={s.slug} className="scroll-mt-16 rounded-2xl border border-[#E2ECE6] bg-white p-5">
                    <p className="text-[12.5px] font-bold" style={{ color: d.color }}>المعيار {ORD[s.n]}</p>
                    <h3 className="mt-0.5 font-display text-[19px] font-extrabold leading-8 text-[#14302A]">{s.title}</h3>
                    <p className="mt-2 text-[15px] leading-8 text-[#3A5249]">{s.about}</p>

                    <p className="mt-4 text-[14px] font-extrabold text-[#14302A]">ما يسأل عنه الاختبار غالبًا</p>
                    <ul className="mt-1.5 list-disc space-y-1 ps-5 text-[14.5px] leading-7 text-[#3A5249] marker:text-[#9DB5AA]">
                      {s.asks.map((x) => <li key={x}>{x}</li>)}
                    </ul>

                    <p className="mt-4 text-[13px] font-bold text-[#6B8077]">مفاهيم للمذاكرة</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.courses.map((cid) => (
                        <Link key={cid} href={`/learn/${cid}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F6F4] px-2.5 py-1 text-[13px] font-bold text-[#2E4A42] hover:bg-[#E6EFEA]">
                          {courseMeta(cid).short} <span className="font-normal text-[#8AA095]">{ad(counts.get(cid) ?? 0)}</span>
                        </Link>
                      ))}
                    </div>

                    {arts.length > 0 && (
                      <ul className="mt-3 divide-y divide-[#EEF3F0] border-t border-[#EEF3F0]">
                        {arts.map((a) => (
                          <li key={a.slug}>
                            <Link href={`/articles/${a.slug}`} className="flex items-center gap-2 py-2.5 text-[14.5px] leading-6 text-[#14302A] hover:text-[#136F5C]">
                              <span className="min-w-0 flex-1">{a.title}</span>
                              <ChevronLeft className="h-4 w-4 shrink-0 text-[#B5C6BE]" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/practice-test" className="flex items-center gap-3 rounded-2xl bg-[#136F5C] p-5 text-white">
          <ClipboardCheck className="h-7 w-7 shrink-0" />
          <span><span className="block font-extrabold">نموذج اختبار تفاعلي</span><span className="text-[13.5px] text-white/80">أسئلة مواقف من المعايير كلها</span></span>
        </Link>
        <Link href="/license-calculator" className="flex items-center gap-3 rounded-2xl border border-[#E2ECE6] bg-white p-5">
          <Calculator className="h-7 w-7 shrink-0 text-[#136F5C]" />
          <span><span className="block font-extrabold text-[#14302A]">حاسبة مستوى الرخصة</span><span className="text-[13.5px] text-[#4A6158]">ممارس أم متقدم أم خبير؟</span></span>
        </Link>
      </div>

      <p className="mt-6 flex gap-2 rounded-xl bg-[#F1F5F9] p-4 text-[13.5px] leading-7 text-[#334155]">
        <ExternalLink className="mt-1 h-4 w-4 shrink-0" />
        <span>الصياغة هنا شرح مبسط منا، والنص الرسمي للمعايير وأوزانها في دليل المعايير المهنية الصادر عن <a href="https://www.etec.gov.sa" target="_blank" rel="noopener noreferrer" className="font-bold underline">هيئة تقويم التعليم والتدريب</a>. عدد المعايير في هذه الصفحة: {ad(ALL_STANDARDS.length)}.</span>
      </p>
    </WithSidebar>
  );
}
