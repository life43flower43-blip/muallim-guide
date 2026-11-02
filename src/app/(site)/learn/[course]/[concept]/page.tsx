import type { Metadata } from "next";
import { ConceptDiagram } from "@/components/app/Diagrams";
import { referencesFor } from "@/lib/references";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/site/AdSlot";
import ReadProgress from "@/components/site/ReadProgress";
import { Clock } from "lucide-react";
import { ad, arCount, MINUTE_FORMS } from "@/lib/arabic";
import { courseMeta, readMinutes } from "@/lib/site-nav";
import { CatBadge, Crumbs, conceptTile, SectionTitle, ShareRow, Thumb, WithSidebar } from "@/components/site/Blocks";
import { SITE_URL, SITE_NAME, chapterLabel, conceptQuestions, publicBank, summary } from "@/lib/public-bank";

export const dynamicParams = false;
export function generateStaticParams() {
  return publicBank().concepts.map((c) => ({ course: c.courseId, concept: c.id }));
}

const find = (course: string, id: string) => publicBank().concepts.find((c) => c.id === id && c.courseId === course);

export async function generateMetadata({ params }: { params: Promise<{ course: string; concept: string }> }): Promise<Metadata> {
  const { course, concept } = await params;
  const c = find(course, concept);
  if (!c) return {};
  const url = `${SITE_URL}/learn/${course}/${concept}`;
  return {
    title: `${c.title} | ${SITE_NAME}`,
    description: summary(c.explanation),
    alternates: { canonical: url },
    openGraph: { title: c.title, description: summary(c.explanation), url, siteName: SITE_NAME, locale: "ar_AR", type: "article", images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  };
}

export default async function ConceptPage({ params }: { params: Promise<{ course: string; concept: string }> }) {
  const { course, concept } = await params;
  const c = find(course, concept);
  if (!c) notFound();
  const bank = publicBank();
  const courseName = bank.courses[course];
  const siblings = bank.concepts.filter((x) => x.courseId === course && x.chapter === c.chapter);
  const pos = siblings.findIndex((x) => x.id === c.id);
  const prev = siblings[pos - 1];
  const next = siblings[pos + 1];
  const sample = conceptQuestions(c.id).slice(0, 5);
  const examples = c.examples?.length ? c.examples : [c.example];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: c.title,
    description: summary(c.explanation),
    inLanguage: "ar",
    learningResourceType: "Concept explanation",
    educationalLevel: "Higher education",
    isPartOf: { "@type": "Course", name: courseName, url: `${SITE_URL}/learn/${course}` },
    url: `${SITE_URL}/learn/${course}/${c.id}`,
  };

  const m = courseMeta(course);
  const related = siblings.filter((x) => x.id !== c.id).slice(0, 6);
  const path = `/learn/${course}/${c.id}`;

  return (
    <WithSidebar>
      <ReadProgress color={m.color} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            jsonLd,
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE_URL}/` },
                { "@type": "ListItem", position: 2, name: "المحاور", item: `${SITE_URL}/learn` },
                { "@type": "ListItem", position: 3, name: courseName, item: `${SITE_URL}/learn/${course}` },
                { "@type": "ListItem", position: 4, name: c.title, item: `${SITE_URL}${path}` },
              ],
            },
          ]),
        }}
      />
      <Crumbs items={[{ href: "/learn", label: "المحاور" }, { href: `/learn/${course}`, label: m.short }, { label: c.title }]} />

      <article className="overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
        <Thumb c={c} className="h-56 sm:h-72" />
        <div className="space-y-7 p-5 sm:p-7">
          <header>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#6B8077]">
              <CatBadge id={course} />
              <span>{chapterLabel(c.chapter)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {arCount(readMinutes(c), MINUTE_FORMS)} للقراءة</span>
            </div>
            <h1 className="mt-3 font-display text-[28px] font-extrabold leading-[1.55] sm:text-[32px]">{c.title}</h1>
          </header>

          <section className="space-y-5">
            {c.explanation.split(/\n+/).map((p, i) => (
              <p key={i} className="text-[18px] leading-[2.05] text-[#24403A]">{p}</p>
            ))}
          </section>

          {c.rule && (
            <blockquote className="rounded-xl border-s-4 border-[#E8A317] bg-[#FFF8E6] p-4 text-[17px] font-bold leading-9 text-[#3B2C05]">
              <span className="mb-1 block text-[13px] text-[#8A6A12]">القاعدة باختصار</span>
              {c.rule}
            </blockquote>
          )}

          <ConceptDiagram conceptId={c.id} pageTitle={c.title} />

          <AdSlot />

          <section>
            <h2 className="mb-3 font-display text-[21px] font-extrabold">أمثلة من الصف</h2>
            <ul className="space-y-3">
              {examples.map((e, i) => (
                <li key={i} className="rounded-xl bg-[#F4F8F6] p-4 leading-8 text-[#24403A]">{e}</li>
              ))}
            </ul>
          </section>

          {sample.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-[21px] font-extrabold">اختبر فهمك</h2>
              <div className="space-y-4">
                {sample.map((q) => (
                  <div key={q.id} className="rounded-xl border border-[#E2ECE6] p-4">
                    <p className="font-bold leading-8">{q.question}</p>
                    <ul className="mt-3 space-y-1.5 text-[15px] text-[#4D635A]">
                      {q.options.map((o) => (
                        <li key={o.text} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9DB5AA]" />{o.text}</li>
                      ))}
                    </ul>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[14px] font-bold text-[#136F5C]">اعرض الإجابة والشرح</summary>
                      <p className="mt-2 text-[14px] font-bold text-[#1E7B4A]">الإجابة: {q.correct}</p>
                      <p className="mt-1 text-[14px] leading-7 text-[#4D635A]">{q.reason}</p>
                    </details>
                  </div>
                ))}
              </div>
            </section>
          )}

          {referencesFor(c).length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-[19px] font-extrabold">المرجع</h2>
              <ul className="space-y-1.5 leading-8 text-[#4D635A]">
                {referencesFor(c).map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          <div className="border-t border-[#EEF3F0] pt-5"><ShareRow path={path} title={c.title} /></div>

          <div className="rounded-xl bg-[#136F5C] p-5 text-white">
            <p className="font-display text-[19px] font-extrabold">تدرّب على هذا المفهوم</p>
            <p className="mt-1 text-[14px] leading-7 text-white/85">أسئلة بشرح بعد كل إجابة، ومراجعة لأخطائك في موعدها، مجانًا.</p>
            <Link href={`/app?concept=${c.id}`} className="mt-3 inline-block rounded-xl bg-[#E8A317] px-5 py-2.5 font-bold text-[#2B1D00]">ابدأ التدريب</Link>
          </div>
        </div>
      </article>

      <nav className="mt-5 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/learn/${course}/${prev.id}`} className="rounded-2xl border border-[#E2ECE6] bg-white p-4 hover:border-[#136F5C]">
            <span className="text-[12px] text-[#6B8077]">المقال السابق</span>
            <span className="mt-1 block font-bold leading-7">{prev.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/learn/${course}/${next.id}`} className="rounded-2xl border border-[#E2ECE6] bg-white p-4 text-left hover:border-[#136F5C]">
            <span className="text-[12px] text-[#6B8077]">المقال التالي</span>
            <span className="mt-1 block font-bold leading-7">{next.title}</span>
          </Link>
        )}
      </nav>

      {related.length > 0 && (
        <section className="mt-8">
          <SectionTitle title="مقالات ذات صلة" />
          <div className="grid gap-3 sm:grid-cols-2">{related.map(conceptTile)}</div>
        </section>
      )}
    </WithSidebar>
  );
}
