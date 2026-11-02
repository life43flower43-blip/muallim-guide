// مقارنات تربوية: مفاهيم يكثر الخلط بينها، جنبًا إلى جنب مع مفتاح للتمييز في الاختبار
import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
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

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="المقارنات">
        {COMPARISONS.map((c) => (
          <a key={c.slug} href={`#${c.slug}`} className="rounded-full px-3 py-1.5 text-[13px] font-bold" style={{ color: c.color, background: `${c.color}14` }}>
            {c.a} × {c.b}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-6">
        {COMPARISONS.map((c) => (
          <section key={c.slug} id={c.slug} className="scroll-mt-16 overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
            <h2 className="grid grid-cols-2 text-center font-display text-[17px] font-extrabold text-white sm:text-[19px]">
              <span className="px-3 py-3" style={{ background: c.color }}>{c.a}</span>
              <span className="px-3 py-3" style={{ background: `${c.color}B3` }}>{c.b}</span>
            </h2>
            <div className="divide-y divide-[#EEF3F0]">
              {c.rows.map((r) => (
                <div key={r.k}>
                  <p className="bg-[#F7FAF8] px-4 py-1.5 text-center text-[12.5px] font-extrabold text-[#5B7268]">{r.k}</p>
                  <div className="grid grid-cols-2">
                    <p className="p-3 text-[14.5px] leading-7 text-[#24403A]">{r.a}</p>
                    <p className="border-s-2 border-[#EEF3F0] p-3 text-[14.5px] leading-7 text-[#24403A]">{r.b}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="flex gap-2 border-t border-[#EEF3F0] p-4 text-[15px] leading-7" style={{ background: `${c.color}0D` }}>
              <KeyRound className="mt-1 h-4 w-4 shrink-0" style={{ color: c.color }} />
              <span><b style={{ color: c.color }}>مفتاح التمييز: </b>{c.tip}</span>
            </p>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-[#3A55A4] p-5 text-white">
        <p className="font-display text-[19px] font-extrabold">اختبر تمييزك</p>
        <p className="mt-1 text-[14px] leading-7 text-white/85">أسئلة المواقف في اختبارات المعلمين تقيس هذه الفروق بالضبط. جرّب نموذج الاختبار التفاعلي.</p>
        <Link href="/practice-test" className="mt-3 inline-block rounded-xl bg-[#E8A317] px-5 py-2.5 font-bold text-[#2B1D00]">ابدأ نموذج الاختبار</Link>
      </div>
    </WithSidebar>
  );
}
