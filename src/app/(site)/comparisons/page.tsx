// مقارنات تربوية: مفاهيم يكثر الخلط بينها، جنبًا إلى جنب مع مفتاح للتمييز في الاختبار
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, KeyRound } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { COMPARISONS } from "@/lib/comparisons";
import { ad } from "@/lib/arabic";
import { Crumbs, PageHero, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "مقارنات تربوية: الفرق بين المفاهيم التي يكثر الخلط بينها | تربوي",
  description:
    "الفرق بين التعزيز السلبي والعقاب، والإشراط الكلاسيكي والإجرائي، وبياجيه وفيجوتسكي، والتقويم البنائي والختامي، والصدق والثبات، وغيرها، في جداول مقارنة مع مفتاح للتمييز في اختبارات المعلمين.",
  alternates: { canonical: `${SITE_URL}/comparisons` },
};

export default function Comparisons() {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مقارنات تربوية" }]} />
      <PageHero kicker="لا تخلط بعد اليوم" title="مقارنات تربوية" color="#3A55A4" sub={`${ad(COMPARISONS.length)} مقارنة بين مفاهيم يكثر الخلط بينها في الصف وفي أسئلة الاختبارات، ومع كل مقارنة مفتاح يساعدك على التمييز بسرعة.`} />

      {/* فهرس مرقّم بلون واحد هادئ */}
      <nav aria-label="المقارنات" className="mt-5 overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
        <p className="border-b border-[#EEF3F0] px-4 py-3 text-[14px] font-extrabold text-[#14302A]">فهرس المقارنات</p>
        <ol className="grid sm:grid-cols-2">
          {COMPARISONS.map((c, i) => (
            <li key={c.slug} className="border-b border-[#EEF3F0] sm:odd:border-e">
              <a href={`#${c.slug}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#F3F7F5]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF5F1] text-[12.5px] font-extrabold text-[#136F5C]">{ad(i + 1)}</span>
                <span className="min-w-0 flex-1 text-[14.5px] font-bold leading-6 text-[#14302A]">
                  {c.a} <span className="mx-1 font-normal text-[#8AA095]">أم</span> {c.b}
                </span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-[#B5C6BE]" />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-6 space-y-6">
        {COMPARISONS.map((c, i) => (
          <section key={c.slug} id={c.slug} className="scroll-mt-16 overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
            <p className="px-4 pt-4 text-[12.5px] font-bold text-[#8AA095]">المقارنة {ad(i + 1)}</p>
            <h2 className="relative grid grid-cols-2 gap-3 px-4 pb-4 pt-2 text-center font-display text-[16px] font-extrabold leading-7 text-[#14302A] sm:text-[18px]">
              <span className="flex items-center justify-center rounded-xl bg-[#F3F7F5] px-3 py-3">{c.a}</span>
              <span className="flex items-center justify-center rounded-xl bg-[#F3F7F5] px-3 py-3">{c.b}</span>
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#136F5C] text-[12px] font-bold text-white ring-4 ring-white">أم</span>
            </h2>
            <div className="divide-y divide-[#EEF3F0] border-t border-[#EEF3F0]">
              {c.rows.map((r) => (
                <div key={r.k}>
                  <p className="px-4 pt-3 text-center text-[12.5px] font-extrabold text-[#5B7268]">{r.k}</p>
                  <div className="grid grid-cols-2">
                    <p className="p-3 text-[14.5px] leading-7 text-[#24403A]">{r.a}</p>
                    <p className="border-s border-[#EEF3F0] p-3 text-[14.5px] leading-7 text-[#24403A]">{r.b}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="flex gap-2 border-t border-[#EEF3F0] bg-[#F3F7F5] p-4 text-[15px] leading-7 text-[#24403A]">
              <KeyRound className="mt-1 h-4 w-4 shrink-0 text-[#136F5C]" />
              <span><b className="text-[#136F5C]">مفتاح التمييز: </b>{c.tip}</span>
            </p>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-[#0E3B32] p-5 text-white">
        <p className="font-display text-[19px] font-extrabold">اختبر تمييزك</p>
        <p className="mt-1 text-[14px] leading-7 text-white/85">أسئلة المواقف في اختبارات المعلمين تقيس هذه الفروق بالضبط. جرّب نموذج الاختبار التفاعلي.</p>
        <Link href="/practice-test" className="mt-3 inline-block rounded-xl bg-[#E8A317] px-5 py-2.5 font-bold text-[#2B1D00]">ابدأ نموذج الاختبار</Link>
      </div>
    </WithSidebar>
  );
}
