// صفحة مقارنة واحدة: كل جانب في بطاقة، والمفهومان تحت بعضهما في الهاتف وجنبًا إلى جنب في الشاشة الواسعة
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, KeyRound } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/public-bank";
import { COMPARISONS, comparisonBySlug } from "@/lib/comparisons";
import { Crumbs, ShareRow, WithSidebar } from "@/components/site/Blocks";

export const dynamicParams = false;
export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = comparisonBySlug(slug);
  if (!c) return {};
  const title = `الفرق بين ${c.a} و${c.b}`;
  return {
    title: `${title} | ${SITE_NAME}`,
    description: `${title}: ${c.rows.map((r) => r.k).join("، ")}، مع أمثلة من الصف ومفتاح للتمييز في اختبارات المعلمين.`,
    alternates: { canonical: `${SITE_URL}/comparisons/${slug}` },
  };
}

const A = "#136F5C";
const B = "#475569";

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = comparisonBySlug(slug);
  if (!c) notFound();
  const i = COMPARISONS.findIndex((x) => x.slug === slug);
  const next = COMPARISONS[i + 1] ?? COMPARISONS[0];
  const sameGroup = COMPARISONS.filter((x) => x.group === c.group && x.slug !== slug);
  const path = `/comparisons/${slug}`;

  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/comparisons", label: "مقارنات تربوية" }, { label: `${c.a} أم ${c.b}` }]} />

      <article className="rounded-2xl border border-[#E2ECE6] bg-white p-4 sm:p-7">
        <p className="text-[13px] font-bold text-[#136F5C]">{c.group}</p>
        <h1 className="mt-1 font-display text-[25px] font-extrabold leading-[1.6] text-[#14302A] sm:text-[30px]">
          الفرق بين {c.a} و{c.b}
        </h1>

        <div className="mt-5 space-y-4">
          {c.rows.map((r) => (
            <section key={r.k} className="rounded-xl bg-[#F7FAF8] p-4">
              <h2 className="text-[15px] font-extrabold text-[#14302A]">{r.k}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border-s-4 bg-white p-3.5" style={{ borderColor: A }}>
                  <p className="text-[13px] font-extrabold" style={{ color: A }}>{c.a}</p>
                  <p className="mt-1 text-[16px] leading-8 text-[#24403A]">{r.a}</p>
                </div>
                <div className="rounded-lg border-s-4 bg-white p-3.5" style={{ borderColor: B }}>
                  <p className="text-[13px] font-extrabold" style={{ color: B }}>{c.b}</p>
                  <p className="mt-1 text-[16px] leading-8 text-[#24403A]">{r.b}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-[#CFE3D9] bg-[#EEF5F1] p-4">
          <p className="flex items-center gap-2 text-[14px] font-extrabold text-[#136F5C]"><KeyRound className="h-4 w-4" /> مفتاح التمييز في الاختبار</p>
          <p className="mt-1.5 text-[16px] leading-8 text-[#14302A]">{c.tip}</p>
        </div>

        <div className="mt-6 border-t border-[#EEF3F0] pt-5"><ShareRow path={path} title={`الفرق بين ${c.a} و${c.b}`} /></div>
      </article>

      <Link href={`/comparisons/${next.slug}`} className="mt-5 block rounded-2xl border-2 border-[#136F5C] bg-white p-5 hover:bg-[#F7FAF8]">
        <span className="text-[13px] font-extrabold text-[#136F5C]">المقارنة التالية</span>
        <span className="mt-1.5 block font-display text-[19px] font-extrabold leading-8 text-[#14302A]">{next.a} أم {next.b}</span>
        <span className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#136F5C] px-4 py-2 text-[15px] font-bold text-white">تابع <ChevronLeft className="h-4 w-4" /></span>
      </Link>

      {sameGroup.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-[19px] font-extrabold text-[#14302A]">مقارنات أخرى في {c.group}</h2>
          <ul className="divide-y divide-[#EEF3F0] overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
            {sameGroup.map((x) => (
              <li key={x.slug}>
                <Link href={`/comparisons/${x.slug}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#F7FAF8]">
                  <span className="min-w-0 flex-1 text-[15px] font-bold leading-7 text-[#14302A]">{x.a} <span className="mx-1 font-normal text-[#8AA095]">أم</span> {x.b}</span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-[#9AB0A6]" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/comparisons" className="mt-3 inline-block text-[14px] font-bold text-[#136F5C]">كل المقارنات ←</Link>
        </section>
      )}
    </WithSidebar>
  );
}
