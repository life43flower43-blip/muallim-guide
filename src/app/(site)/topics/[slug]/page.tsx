// صفحة موضوع: مقدمة مكتوبة له، ثم مقالاته ومفاهيمه وأسئلة تدريب عليه
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, SITE_NAME, publicBank } from "@/lib/public-bank";
import { arDate, articleCourse } from "@/lib/articles";
import { TOPICS, topicArticles, topicBySlug, topicConcepts } from "@/lib/topics";
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
    openGraph: { title: t.title, description: t.description, url: `${SITE_URL}/topics/${t.slug}` },
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
      <Crumbs items={[{ href: "/topics", label: "مواضيع تربوية" }, { label: t.name }]} />
      <PageHero kicker="موضوع" title={t.title} />
      <section className="mt-6 space-y-4 text-[16px] leading-[2] text-[#2C4A40]">
        {t.intro.map((p, i) => <p key={i}>{p}</p>)}
        <ul className="grid gap-2 sm:grid-cols-3">
          {t.points.map((p) => <li key={p} className="rounded-xl border border-[#E2ECE6] bg-white px-4 py-3 text-[14px] font-bold leading-7 text-[#0E3B32]">✓ {p}</li>)}
        </ul>
      </section>

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
