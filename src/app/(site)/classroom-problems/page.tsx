// مشكلات صفية ومواقف يواجهها المعلم: فهرس المواقف
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { PROBLEMS } from "@/lib/site-problems";
import { ad } from "@/lib/arabic";
import { Crumbs, PageHero, SectionTitle, WithSidebar } from "@/components/site/Blocks";

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
      <PageHero kicker="من الصف مباشرة" title="مشكلات صفية وكيف يتصرف المعلم فيها" sub={`${ad(PROBLEMS.length)} موقفًا حقيقيًا في إدارة الصف ومهارات التدريس. في كل موقف: ما الذي يفعله كثير من المعلمين وماذا يحدث بعده، وما الذي يفعله المعلم المتمكن ولماذا ينجح.`} />
      {([["class", "مواقف إدارة الصف والتعامل مع الطلاب", "#B4532A"], ["skill", "مهارات التدريس: الأداء الضعيف والأداء المتقن", "#3A55A4"]] as const).map(([kind, title, color]) => (
        <section key={kind} className="mt-8">
          <SectionTitle title={title} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
            {PROBLEMS.filter((p) => p.kind === kind).map((s) => (
              <Link key={s.id} href={`/classroom-problems/${s.slug}`} className="group flex min-w-0 flex-col rounded-2xl border border-[#E2ECE6] bg-white p-4 transition hover:border-[color:var(--c)]" style={{ ["--c" as string]: color }}>
                <span className="font-display text-[18px] font-extrabold text-[#14302A]">{s.title}</span>
                <span className="mt-1 line-clamp-2 text-[14px] leading-7 text-[#4D635A]">{s.intro}</span>
                <span className="mt-2 truncate text-[13px] text-[#6B8077]">{s.tags.join(" · ")}</span>
                <span className="mt-3 flex items-center justify-between gap-3 border-t border-[#EEF3F0] pt-3">
                  <span className="min-w-0 truncate text-[12.5px] text-[#8AA095]">{s.stage}</span>
                  <span className="flex shrink-0 items-center gap-1 text-[14px] font-bold" style={{ color }}>كيف تتصرف؟ <ChevronLeft className="h-4 w-4" /></span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </WithSidebar>
  );
}
