import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/site/AdSlot";
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
    openGraph: { title: c.title, description: summary(c.explanation), url, siteName: SITE_NAME, locale: "ar_AR", type: "article" },
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
  const sample = conceptQuestions(c.id).slice(0, 2);
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

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-muted-foreground">
        <Link href="/learn" className="hover:text-foreground">المقررات</Link> / <Link href={`/learn/${course}`} className="hover:text-foreground">{courseName}</Link> / {chapterLabel(c.chapter)}
      </nav>
      <header>
        <h1 className="font-display text-3xl font-bold leading-[1.6]">{c.title}</h1>
      </header>

      <section className="space-y-5">
        {c.explanation.split(/\n+/).map((p, i) => (
          <p key={i} className="text-[17px] leading-[2.1]">{p}</p>
        ))}
      </section>

      <AdSlot />

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">أمثلة من الصف</h2>
        <ul className="space-y-3">
          {examples.map((e, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-4 leading-8 text-secondary-foreground">{e}</li>
          ))}
        </ul>
      </section>

      {sample.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">اختبر فهمك</h2>
          <div className="space-y-4">
            {sample.map((q) => (
              <div key={q.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium leading-8">{q.question}</p>
                <ul className="mt-3 space-y-1.5 text-[15px] text-secondary-foreground">
                  {q.options.map((o) => (
                    <li key={o.text}>• {o.text}</li>
                  ))}
                </ul>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-primary">اعرض الإجابة والشرح</summary>
                  <p className="mt-2 text-sm font-medium text-success">الإجابة: {q.correct}</p>
                  <p className="mt-1 text-sm leading-7 text-secondary-foreground">{q.reason}</p>
                </details>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl bg-accent p-5">
        <p className="font-display text-lg font-semibold text-accent-foreground">تدرّب على هذا المفهوم</p>
        <p className="mt-1 text-sm leading-7 text-accent-foreground/85">أسئلة بشرح بعد كل إجابة، ومراجعة لأخطائك في موعدها، مجانًا.</p>
        <Link href={`/?concept=${c.id}`} className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          ابدأ التدريب
        </Link>
      </div>

      <nav className="flex justify-between gap-4 border-t border-border pt-6 text-sm">
        {prev ? <Link href={`/learn/${course}/${prev.id}`} className="text-primary">→ {prev.title}</Link> : <span />}
        {next ? <Link href={`/learn/${course}/${next.id}`} className="text-left text-primary">{next.title} ←</Link> : <span />}
      </nav>

      <AdSlot />
    </article>
  );
}
