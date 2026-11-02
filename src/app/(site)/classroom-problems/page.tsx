// مشكلات صفية ومواقف يواجهها المعلم: فهرس المواقف
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { PROBLEMS, tagColor } from "@/lib/site-problems";
import { ad } from "@/lib/arabic";
import { Crumbs, WithSidebar } from "@/components/site/Blocks";

export const metadata: Metadata = {
  title: "مشكلات صفية يواجهها المعلم وكيف يتصرف فيها: التصرف التقليدي والتصرف المتقدم | تربوي",
  description:
    "مواقف حقيقية من الصف: طالب يرفض العمل، وصف خارج السيطرة، ونتائج ضعيفة، وولي أمر غاضب. لكل موقف التصرف الشائع وأثره، والتصرف المتقدم ولماذا ينجح.",
  alternates: { canonical: `${SITE_URL}/classroom-problems` },
};


export default function Problems() {
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مشكلات صفية" }]} />
      <header className="rounded-2xl bg-[linear-gradient(135deg,#8A3B1F,#B4532A)] p-6 text-white">
        <p className="text-[13px] font-bold text-white/80">من الصف مباشرة</p>
        <h1 className="mt-1 font-display text-[27px] font-extrabold leading-[1.5]">مشكلات صفية وكيف يتصرف المعلم فيها</h1>
        <p className="mt-2 leading-8 text-white/85">
          {ad(PROBLEMS.length)} موقفًا حقيقيًا في إدارة الصف ومهارات التدريس. في كل موقف: ما الذي يفعله كثير من المعلمين وماذا يحدث بعده، وما الذي يفعله المعلم المتمكن ولماذا ينجح.
        </p>
      </header>
      {([["class", "مواقف إدارة الصف والتعامل مع الطلاب", "#B4532A"], ["skill", "مهارات التدريس: الأداء الضعيف والأداء المتقن", "#3A55A4"]] as const).map(([kind, title, color]) => (
        <section key={kind} className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-[20px] font-extrabold" style={{ color }}>
            <span className="h-3 w-3 rounded-full" style={{ background: color }} />{title}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROBLEMS.filter((p) => p.kind === kind).map((s) => (
              <Link key={s.id} href={`/classroom-problems/${s.slug}`} className="group flex flex-col rounded-2xl border border-[#E2ECE6] bg-white p-4 transition hover:border-[color:var(--c)]" style={{ ["--c" as string]: color }}>
                <span className="text-[12px] font-bold text-[#8AA095]">{s.stage}</span>
                <span className="mt-1 font-display text-[18px] font-extrabold text-[#14302A]">{s.title}</span>
                <span className="mt-1 line-clamp-2 text-[14px] leading-7 text-[#4D635A]">{s.intro}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {s.tags.map((k) => (
                    <span key={k} className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ color: tagColor(k), background: `${tagColor(k)}14` }}>{k}</span>
                  ))}
                </span>
                <span className="mt-3 flex items-center gap-1 text-[14px] font-bold" style={{ color }}>كيف تتصرف؟ <ChevronLeft className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </WithSidebar>
  );
}
