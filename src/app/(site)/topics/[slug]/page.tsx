// صفحة موضوع: مقدمة مكتوبة له، ثم مقالاته ومفاهيمه وأسئلة تدريب عليه
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, SITE_NAME, publicBank } from "@/lib/public-bank";
import { arDate, articleCourse } from "@/lib/articles";
import { TOPICS, topicArticles, topicBody, topicBySlug, topicConcepts, topicImage } from "@/lib/topics";
import ReactMarkdown from "react-markdown";
import { Crumbs, PageHero, Tile, WithSidebar } from "@/components/site/Blocks";

export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = topicBySlug((await params).slug);
  if (!t) return {};
  return {
    title: t.title.length > 58 ? { absolute: t.title } : `${t.title} | ${SITE_NAME}`,
    description: t.description,
    keywords: [t.name, ...t.kw, `ما هو ${t.name}`, `${t.name} للمعلمين`],
    alternates: { canonical: `${SITE_URL}/topics/${t.slug}` },
    openGraph: { title: t.title, description: t.description, url: `${SITE_URL}/topics/${t.slug}`, ...(topicImage(t.slug) ? { images: [{ url: `${SITE_URL}${topicImage(t.slug)}` }] } : {}) },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = topicBySlug((await params).slug);
  if (!t) notFound();
  const articles = topicArticles(t);
  const concepts = topicConcepts(t);
  const ids = new Set(concepts.map((c) => c.id));
  const qCount = publicBank().questions.filter((q) => ids.has(q.conceptId)).length;
  const others = TOPICS.filter((x) => x.slug !== t.slug);
  // خلاصة كل مفهوم في سطر (أول جملة من شرحه)، وأسئلة شائعة من المقدمة والمفاهيم
  const firstSentence = (s: string) => (s.split(/(?<=[.؟!])\s/)[0] ?? s).trim();
  const briefs = concepts.slice(0, 12).map((c) => ({ c, line: firstSentence(c.rule || c.explanation) }));
  const body = topicBody(t.slug);
  // أسئلة المقال الشائعة (### سؤال ثم جوابه) تدخل بيانات الأسئلة الشائعة لمحركات البحث
  const bodyFaq = (body.split(/^## أسئلة شائعة\s*$/m)[1] ?? "")
    .split(/^### /m).slice(1)
    .map((b) => { const [q, ...a] = b.split("\n"); return { q: q.trim(), a: a.join(" ").trim() }; })
    .filter((f) => f.q && f.a);
  const heads = body.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());
  let hi = 0;
  const faq = bodyFaq.length ? bodyFaq : [
    { q: `ما ${t.name}؟`, a: t.intro[0] },
    { q: `كيف يطبق المعلم ${t.name} في الصف؟`, a: t.intro[1] },
    ...concepts.slice(0, 4).map((c) => ({ q: `ما المقصود بـ«${c.title}»؟`, a: firstSentence(c.explanation) })),
  ];
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.title,
    description: t.description,
    url: `${SITE_URL}/topics/${t.slug}`,
    hasPart: [
      ...articles.map((a) => ({ "@type": "Article", headline: a.title, url: `${SITE_URL}/articles/${a.slug}` })),
      ...concepts.map((c) => ({ "@type": "LearningResource", name: c.title, url: `${SITE_URL}/learn/${c.courseId}/${c.id}` })),
    ],
  };
  return (
    <WithSidebar>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }).replace(/</g, "\\u003c"),
        }}
      />
      <Crumbs items={[{ href: "/topics", label: "مواضيع تربوية" }, { label: t.name }]} />
      <PageHero kicker="موضوع" title={t.title} />
      {topicImage(t.slug) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={topicImage(t.slug)} alt={t.name} width={1200} height={675} className="mt-5 h-auto w-full rounded-2xl" />
      )}
      <section className="mt-6 space-y-4 text-[16px] leading-[2] text-[#2C4A40]">
        {t.intro.map((p, i) => <p key={i}>{p}</p>)}
        <ul className="grid gap-2 sm:grid-cols-3">
          {t.points.map((p) => <li key={p} className="rounded-xl border border-[#E2ECE6] bg-white px-4 py-3 text-[14px] font-bold leading-7 text-[#0E3B32]">✓ {p}</li>)}
        </ul>
      </section>

      {body && (
        <>
          {heads.length > 2 && (
            <details className="group mt-7 rounded-2xl bg-[#136F5C0F] p-4" aria-label="محتويات الصفحة">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-[16px] font-extrabold text-[#136F5C] [&::-webkit-details-marker]:hidden">في هذه الصفحة<span className="text-[14px] transition group-open:rotate-180">▾</span></summary>
              <ol className="mt-2 space-y-1.5 text-[15px]">
                {heads.map((h, i) => (
                  <li key={h}><a href={`#s-${i + 1}`} className="flex gap-2 leading-7 text-[#24403A] hover:underline"><span className="font-bold text-[#136F5C]">{(i + 1).toLocaleString("ar-u-nu-arab")}.</span>{h}</a></li>
                ))}
              </ol>
            </details>
          )}
          <article className="mt-4 text-[17.5px] leading-[2.05] text-[#24403A] [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:leading-[1.5] [&_h2]:text-[#14302A] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-[19px] [&_h3]:font-extrabold [&_h3]:text-[#14302A] [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_strong]:text-[#14302A] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_li::marker]:text-[#136F5C] [&_a]:font-bold [&_a]:text-[#136F5C] [&_a]:underline">
            <ReactMarkdown components={{ h2: ({ children }) => <h2 id={`s-${++hi}`} className="scroll-mt-20">{children}</h2> }}>{body}</ReactMarkdown>
          </article>
        </>
      )}

      {articles.length > 0 && (
        <section className="mt-9">
          <h2 className="font-display text-[22px] font-extrabold text-[#0E3B32]">مقالات عن {t.name}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {articles.map((a) => <Tile key={a.slug} href={`/articles/${a.slug}`} id={a.slug} title={a.title} courseId={articleCourse(a)} meta={arDate(a.date)} />)}
          </div>
        </section>
      )}

      {concepts.length > 0 && (
        <section className="mt-9">
          <h2 className="font-display text-[22px] font-extrabold text-[#0E3B32]">مفاهيم مشروحة في {t.name}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {concepts.map((c) => (
              <li key={c.id}>
                <Link href={`/learn/${c.courseId}/${c.id}`} className="block rounded-xl border border-[#E2ECE6] bg-white px-4 py-3 text-[15px] font-bold leading-7 text-[#136F5C] hover:border-[#136F5C]">{c.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {briefs.length > 0 && (
        <section className="mt-9">
          <h2 className="font-display text-[22px] font-extrabold text-[#0E3B32]">أهم مفاهيم {t.name} في سطر</h2>
          <dl className="mt-4 space-y-3">
            {briefs.map(({ c, line }) => (
              <div key={c.id} className="rounded-xl border border-[#E2ECE6] bg-white p-4">
                <dt className="font-bold text-[#14302A]">
                  <Link href={`/learn/${c.courseId}/${c.id}`} className="hover:text-[#136F5C]">{c.title}</Link>
                </dt>
                <dd className="mt-1 text-[15px] leading-7 text-[#3A5249]">{line}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {!bodyFaq.length && (
      <section className="mt-9">
        <h2 className="font-display text-[22px] font-extrabold text-[#0E3B32]">أسئلة شائعة عن {t.name}</h2>
        <div className="mt-4 space-y-2">
          {faq.map((f) => (
            <details key={f.q} className="rounded-xl border border-[#E2ECE6] bg-white p-4">
              <summary className="cursor-pointer font-bold leading-7 text-[#14302A]">{f.q}</summary>
              <p className="mt-2 text-[15px] leading-7 text-[#3A5249]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      )}

      <section className="mt-9 rounded-2xl bg-[#0E3B32] p-6 text-white">
        <h2 className="font-display text-[20px] font-extrabold">تدرّب على {t.name}</h2>
        <p className="mt-2 text-[15px] leading-8 text-white/85">
          {qCount > 0 ? `${qCount.toLocaleString("ar")} سؤال تدريب على مفاهيم هذا الموضوع، مع شرح كل إجابة.` : "أسئلة تدريب مع شرح كل إجابة."}
        </p>
        <Link href="/app" className="mt-4 inline-block rounded-full bg-[#F3DC8E] px-5 py-2.5 text-[15px] font-extrabold text-[#3a2c05]">ابدأ التدريب في التطبيق</Link>
      </section>

      <section className="mt-9">
        <h2 className="font-display text-[18px] font-extrabold text-[#0E3B32]">مواضيع أخرى</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {others.map((x) => <Link key={x.slug} href={`/topics/${x.slug}`} className="rounded-full bg-[#EEF5F1] px-3 py-1.5 text-[13px] font-bold text-[#136F5C] hover:bg-[#136F5C] hover:text-white">{x.name}</Link>)}
        </div>
      </section>
    </WithSidebar>
  );
}
