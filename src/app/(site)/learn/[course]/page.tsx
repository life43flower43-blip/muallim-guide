// صفحة التصنيف: وصف المحور، وفهرس فصوله، ثم مقالات كل فصل
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, chapterLabel, courseChapters, publicBank } from "@/lib/public-bank";
import { courseMeta } from "@/lib/site-nav";
import { arCount, CHAPTER_FORMS, CONCEPT_FORMS, ad } from "@/lib/arabic";
import { Crumbs, conceptTile, SectionTitle, WithSidebar } from "@/components/site/Blocks";
import AdSlot from "@/components/site/AdSlot";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(publicBank().courses).map((course) => ({ course }));
}

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const { course } = await params;
  const name = publicBank().courses[course];
  if (!name) return {};
  const chapters = courseChapters(course).map((c) => chapterLabel(c.chapter));
  return {
    title: `${name} | تربوي`,
    description: `${name}: ${chapters.slice(0, 6).join("، ")}، وغيرها. شرح وأمثلة وأسئلة تدريب.`,
    alternates: { canonical: `${SITE_URL}/learn/${course}` },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  const name = publicBank().courses[course];
  if (!name) notFound();
  const m = courseMeta(course);
  const chapters = courseChapters(course);
  const total = chapters.reduce((n, ch) => n + ch.concepts.length, 0);

  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/learn", label: "المحاور" }, { label: m.short }]} />

      <header className="relative overflow-hidden rounded-2xl">
        <img src={m.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute inset-0" style={{ background: `linear-gradient(to left, ${m.color}F2, ${m.color}B0)` }} />
        <div className="relative p-6 text-white">
          <p className="text-[13px] font-bold text-white/80">تصنيف: {m.short}</p>
          <h1 className="mt-1 font-display text-[26px] font-extrabold leading-[1.5]">{name}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-white/90">{m.about}</p>
          <p className="mt-3 text-[13px] font-bold text-white/85">{arCount(chapters.length, CHAPTER_FORMS)}، {arCount(total, CONCEPT_FORMS)}</p>
        </div>
      </header>

      {/* فهرس الفصول */}
      <nav className="mt-6 rounded-2xl border border-[#E2ECE6] bg-white p-4">
        <h2 className="mb-3 font-display text-[17px] font-extrabold">فهرس الفصول</h2>
        <ol className="grid gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
          {chapters.map((ch, i) => (
            <li key={ch.chapter}>
              <a href={`#ch-${i + 1}`} className="flex gap-2 hover:text-[#136F5C]">
                <span className="font-bold text-[#136F5C]">{ad(i + 1)}.</span>
                <span>{chapterLabel(ch.chapter)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-10">
        {chapters.map((ch, i) => (
          <section key={ch.chapter} id={`ch-${i + 1}`} className="scroll-mt-16">
            <SectionTitle title={`${ad(i + 1)}. ${chapterLabel(ch.chapter)}`} color={m.color} />
            <div className="grid gap-3 sm:grid-cols-2">{ch.concepts.map(conceptTile)}</div>
            {i === 1 && <AdSlot />}
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-[#EEF5F1] p-5">
        <p className="font-display text-[18px] font-extrabold">تدرّب على أسئلة هذا المحور</p>
        <p className="mt-1 leading-7 text-[#4D635A]">أسئلة بمستوى اختبارات التوظيف مع تفسير كل خيار، ومراجعة لأخطائك.</p>
        <Link href="/app?tab=practice" className="mt-3 inline-block rounded-xl bg-[#136F5C] px-5 py-2.5 font-bold text-white">ابدأ التدريب</Link>
      </div>
    </WithSidebar>
  );
}
