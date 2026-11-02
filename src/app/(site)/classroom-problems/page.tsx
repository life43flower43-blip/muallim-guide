// مشكلات صفية ومواقف يواجهها المعلم: فهرس المواقف
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { SIM_SCENARIOS } from "@/lib/sim";
import { ad } from "@/lib/arabic";
import { Crumbs, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "مشكلات صفية يواجهها المعلم وكيف يتصرف فيها: التصرف التقليدي والتصرف المتقدم | تربوي",
  description:
    "مواقف حقيقية من الصف: طالب يرفض العمل، وصف خارج السيطرة، ونتائج ضعيفة، وولي أمر غاضب. لكل موقف التصرف الشائع وأثره، والتصرف المتقدم ولماذا ينجح.",
  alternates: { canonical: `${SITE_URL}/classroom-problems` },
};

const SKILL_COLOR: Record<string, string> = {
  "إدارة الصف": "#136F5C",
  التواصل: "#1F6FA8",
  "فهم المتعلم": "#7A4E9C",
  "اتخاذ القرار التربوي": "#B4532A",
  "التقويم والتغذية الراجعة": "#8A6A12",
};

export default function Problems() {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مشكلات صفية" }]} />
      <header className="rounded-2xl bg-[linear-gradient(135deg,#8A3B1F,#B4532A)] p-6 text-white">
        <p className="text-[13px] font-bold text-white/80">من الصف مباشرة</p>
        <h1 className="mt-1 font-display text-[27px] font-extrabold leading-[1.5]">مشكلات صفية وكيف يتصرف المعلم فيها</h1>
        <p className="mt-2 leading-8 text-white/85">
          {ad(SIM_SCENARIOS.length)} موقفًا حقيقيًا. في كل موقف: ما الذي يفعله كثير من المعلمين وماذا يحدث بعده، وما الذي يفعله المعلم المتمكن ولماذا ينجح.
        </p>
      </header>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SIM_SCENARIOS.map((s) => (
          <Link key={s.id} href={`/classroom-problems/${s.id.toLowerCase()}`} className="group flex flex-col rounded-2xl border border-[#E2ECE6] bg-white p-4 transition hover:border-[#B4532A]">
            <span className="text-[12px] font-bold text-[#8AA095]">{s.stage}</span>
            <span className="mt-1 font-display text-[18px] font-extrabold text-[#14302A]">{s.title}</span>
            <span className="mt-1 line-clamp-2 text-[14px] leading-7 text-[#4D635A]">{s.intro}</span>
            <span className="mt-3 flex flex-wrap gap-1.5">
              {s.skills.map((k) => (
                <span key={k} className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ color: SKILL_COLOR[k], background: `${SKILL_COLOR[k]}14` }}>{k}</span>
              ))}
            </span>
            <span className="mt-3 flex items-center gap-1 text-[14px] font-bold text-[#B4532A]">كيف تتصرف؟ <ChevronLeft className="h-4 w-4" /></span>
          </Link>
        ))}
      </div>
    </WithSidebar>
  );
}
