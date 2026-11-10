// مقارنات تربوية: فهرس مرتب في مجموعات، ولكل مقارنة صفحتها
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { COMPARISONS, COMPARISON_GROUPS } from "@/lib/comparisons";
import { ad } from "@/lib/arabic";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "مقارنات تربوية: الفرق بين المفاهيم التي يكثر الخلط بينها | تربوي",
  description:
    "الفرق بين التعزيز السلبي والعقاب، والتمثل والمواءمة، والتقويم البنائي والختامي، والصدق والثبات، والتسهيلات والتعديلات، وغيرها، مع مفتاح للتمييز في اختبارات المعلمين.",
  alternates: { canonical: `${SITE_URL}/comparisons` },
};

export default function Comparisons() {
  // ترقيم متصل عبر المجموعات، محسوب قبل العرض
  const order = new Map(COMPARISON_GROUPS.flatMap((g) => COMPARISONS.filter((c) => c.group === g)).map((c, i) => [c.slug, i + 1]));
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مقارنات تربوية" }]} />
      <PageHero kicker="لا تخلط بعد اليوم" title="مقارنات تربوية" sub={`${ad(COMPARISONS.length)} مقارنة بين مفاهيم يكثر الخلط بينها في الصف وفي أسئلة الاختبارات. اختر مقارنة لتقرأها كاملة مع مفتاح التمييز.`} />

      <div className="mt-6 space-y-8">
        {COMPARISON_GROUPS.map((g) => {
          const list = COMPARISONS.filter((c) => c.group === g);
          return (
            <section key={g}>
              <h2 className="mb-3 flex items-baseline gap-2 font-display text-[19px] font-extrabold text-[#14302A]">
                {g} <span className="text-[13px] font-bold text-[#8AA095]">{ad(list.length)}</span>
              </h2>
              <ol className="divide-y divide-[#EEF3F0] overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
                {list.map((c) => {
                  const n = order.get(c.slug) ?? 0;
                  return (
                    <li key={c.slug}>
                      <Link href={`/comparisons/${c.slug}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F7FAF8]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF5F1] text-[13px] font-extrabold text-[#136F5C]">{ad(n)}</span>
                        <span className="min-w-0 flex-1 text-[15.5px] font-bold leading-7 text-[#14302A]">
                          {c.a} <span className="mx-1 font-normal text-[#8AA095]">أم</span> {c.b}
                        </span>
                        <ChevronLeft className="h-4 w-4 shrink-0 text-[#9AB0A6]" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-[#0E3B32] p-5 text-white">
        <p className="font-display text-[19px] font-extrabold">اختبر تمييزك</p>
        <p className="mt-1 text-[14px] leading-7 text-white/85">أسئلة المواقف في اختبارات المعلمين تقيس هذه الفروق بالضبط. جرّب نموذج الاختبار التفاعلي.</p>
        <Link href="/practice-test" className="mt-3 inline-block rounded-xl bg-white px-5 py-2.5 font-bold text-[#0E3B32]">ابدأ نموذج الاختبار</Link>
      </div>
    </WithSidebar>
  );
}
