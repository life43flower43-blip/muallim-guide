import type { Metadata } from "next";
import QuizRunner from "@/components/site/QuizRunner";
import type { SiteQ } from "@/lib/site-nav";
import { ConceptDiagram } from "@/components/app/Diagrams";
import { referencesFor } from "@/lib/references";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/site/AdSlot";
import ReadProgress from "@/components/site/ReadProgress";
import { problemsForConcept } from "@/lib/site-problems";
import { ChevronLeft, Clock } from "lucide-react";
import { ad, arCount, MINUTE_FORMS } from "@/lib/arabic";
import { courseMeta, readMinutes } from "@/lib/site-nav";
import { CatBadge, ConceptList, Crumbs, paragraphs, SectionTitle, ShareRow, TelegramCard, Thumb, WithSidebar } from "@/components/site/Blocks";
import { photoFor } from "@/components/site/Cover";
import { SITE_URL, SITE_NAME, chapterLabel, conceptQuestions, courseChapters, publicBank, summary } from "@/lib/public-bank";

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
    // عنوان بنية البحث الشائعة («شرح»، «أمثلة»)، ووصف يبدأ بالسؤال الذي يكتبه الباحث
    title: `${c.title}: شرح مبسط مع أمثلة | ${SITE_NAME}`,
    description: summary(`ما هو ${c.title}؟ ${c.explanation}`),
    keywords: [c.title, `ما هو ${c.title}`, `شرح ${c.title}`, `تعريف ${c.title}`, chapterLabel(c.chapter), publicBank().courses[course], "اختبار الرخصة المهنية للمعلمين", "مفاهيم تربوية"],
    alternates: { canonical: url },
    openGraph: { title: `${c.title}: شرح مبسط مع أمثلة`, description: summary(`ما هو ${c.title}؟ ${c.explanation}`), url, siteName: SITE_NAME, locale: "ar_AR", type: "article", images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
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
  // التالي: المفهوم التالي في الفصل، وإن انتهى الفصل فأول مفهوم في الفصل الذي بعده
  const chapters = courseChapters(course);
  const chIdx = chapters.findIndex((ch) => ch.chapter === c.chapter);
  const next = siblings[pos + 1] ?? chapters[chIdx + 1]?.concepts[0];
  const nextNewChapter = !siblings[pos + 1] && !!next;
  const sample = conceptQuestions(c.id).slice(0, 5);
  const quiz: SiteQ[] = sample
    .filter((q) => q.options.length >= 2 && q.options.some((o) => o.isCorrect))
    .map((q) => ({
      id: q.id,
      q: q.question,
      options: q.options.map((o) => o.text),
      correct: q.options.findIndex((o) => o.isCorrect),
      reason: q.reason,
      course: courseMeta(c.courseId).short,
      href: `/learn/${c.courseId}/${c.id}`,
      concept: c.title,
    }));
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
        {photoFor(c.id) && <Thumb c={c} className="h-56 sm:h-72" />}
        <div className="space-y-7 p-4 sm:p-7">
          <header>
            <h1 className="font-display text-[26px] font-extrabold leading-[1.55] sm:text-[32px]">{c.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#6B8077]">
              <CatBadge id={course} />
              <span>{chapterLabel(c.chapter)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {arCount(readMinutes(c), MINUTE_FORMS)} للقراءة</span>
            </div>
          </header>

          {c.rule && (
            <div className="rounded-xl border-s-4 border-[#136F5C] bg-[#EEF5F1] px-4 py-3.5">
              <p className="text-[13px] font-extrabold text-[#136F5C]">الفكرة باختصار</p>
              <p className="mt-1 text-[16px] font-bold leading-8 text-[#14302A]">{c.rule}</p>
            </div>
          )}

          <section className="space-y-4">
            {paragraphs(c.explanation).map((p, i) => (
              <p key={i} className="text-[17px] leading-[1.95] text-[#24403A]">{p}</p>
            ))}
          </section>

          <ConceptDiagram conceptId={c.id} pageTitle={c.title} />

          <AdSlot />

          {problemsForConcept(c.id).slice(0, 2).map((p) => {
            const poor = p.options.find((o) => o.rating === "poor");
            const good = p.options.find((o) => o.rating === "good");
            if (!poor || !good) return null;
            return (
              <section key={p.id} className="overflow-hidden rounded-2xl border border-[#E2ECE6]">
                <div className="bg-[#14302A] px-4 py-3 text-white">
                  <p className="text-[12px] font-bold text-white/70">المفهوم في الصف: من التطبيق التقليدي إلى المتقدم</p>
                  <p className="mt-0.5 font-display text-[17px] font-extrabold">{p.title}</p>
                </div>
                <p className="bg-[#F7FAF8] px-4 py-3 text-[15px] leading-7 text-[#3A5249]">{p.intro}</p>
                <div className="grid sm:grid-cols-2">
                  <div className="border-t border-[#F2D2CD] bg-[#FDEDEB] p-4">
                    <p className="text-[13px] font-extrabold text-[#C0392B]">التطبيق التقليدي</p>
                    <p className="mt-1 font-bold leading-7 text-[#14302A]">«{poor.text}»</p>
                    <p className="mt-1 text-[14px] leading-7 text-[#5A3A35]">{poor.outcome}</p>
                  </div>
                  <div className="border-t border-[#CFE6D8] bg-[#EAF6EF] p-4 sm:border-s">
                    <p className="text-[13px] font-extrabold text-[#1E7B4A]">التطبيق المتقدم</p>
                    <p className="mt-1 font-bold leading-7 text-[#14302A]">«{good.text}»</p>
                    <p className="mt-1 text-[14px] leading-7 text-[#2E4A3A]">{good.outcome}</p>
                  </div>
                </div>
                <Link href={`/classroom-problems/${p.slug}`} className="block border-t border-[#E2ECE6] px-4 py-3 text-[14px] font-bold text-[#B4532A]">اقرأ التحليل الكامل للموقف ←</Link>
              </section>
            );
          })}

          <section>
            <h2 className="mb-3 font-display text-[21px] font-extrabold">أمثلة من الصف</h2>
            <ul className="space-y-3">
              {examples.map((e, i) => (
                <li key={i} className="rounded-xl bg-[#F4F8F6] p-4 leading-8 text-[#24403A]">{e}</li>
              ))}
            </ul>
          </section>

          {quiz.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-[21px] font-extrabold">اختبر فهمك</h2>
              {/* اختبار تفاعلي: يختار الطالب إجابته فيُصحَّح فورًا مع الشرح */}
              <QuizRunner questions={quiz} title="اختبر فهمك" onConceptPage />
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
            <Link prefetch={false} href={`/app?concept=${c.id}`} className="mt-3 inline-block rounded-xl bg-white px-5 py-2.5 font-bold text-[#136F5C]">ابدأ التدريب</Link>
          </div>
        </div>
      </article>

      {next && (
        <Link href={`/learn/${next.courseId}/${next.id}`} className="group mt-5 block rounded-2xl border-2 border-[#136F5C] bg-white p-5 hover:bg-[#F7FAF8]">
          <span className="text-[13px] font-extrabold text-[#136F5C]">{nextNewChapter ? `الفصل التالي: ${chapterLabel(next.chapter)}` : "المفهوم التالي"}</span>
          <span className="mt-1.5 block font-display text-[20px] font-extrabold leading-8 text-[#14302A]">{next.title}</span>
          {next.rule && <span className="mt-1.5 line-clamp-2 block leading-7 text-[#4D635A]">{next.rule}</span>}
          <span className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#136F5C] px-4 py-2 text-[15px] font-bold text-white">تابع القراءة <ChevronLeft className="h-4 w-4" /></span>
        </Link>
      )}
      <TelegramCard className="mt-3" />

      {prev && (
        <Link href={`/learn/${course}/${prev.id}`} className="mt-3 flex items-center gap-2 px-1 text-[14px] text-[#6B8077] hover:text-[#136F5C]">
          <span>السابق:</span><span className="font-bold">{prev.title}</span>
        </Link>
      )}

      {siblings.length > 1 && (
        <section className="mt-8">
          <SectionTitle title={`في هذا الفصل: ${chapterLabel(c.chapter)}`} color={m.color} more={{ href: `/learn/${course}`, label: "كل الفصول" }} />
          <ConceptList concepts={siblings} currentId={c.id} />
        </section>
      )}
    </WithSidebar>
  );
}
