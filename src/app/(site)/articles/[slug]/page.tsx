// صفحة مقال تربوي: غلاف، وبيانات، ونص منسق، ووسوم، ومشاركة، ومقالات ذات صلة
import { topicForTag } from "@/lib/topics";
import { ARTICLE_REFS } from "@/lib/article-refs";
import { REVIEWER } from "@/lib/editorial";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tag } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { CAT_SLUGS, allArticles, arDate, articleBySlug, articleCourse } from "@/lib/articles";
import { withInternalLinks } from "@/lib/internal-links";
import { courseMeta } from "@/lib/site-nav";
import { ad } from "@/lib/arabic";
import { MiniCover } from "@/components/site/Cover";
import { Crumbs, SectionTitle, ShareRow, WithSidebar, TelegramCard, GridCard, CardGrid } from "@/components/site/Blocks";
import HelpfulVote from "@/components/site/HelpfulVote";
import { publicBank } from "@/lib/public-bank";
import AdSlot from "@/components/site/AdSlot";
import { ARTICLE_COVERS } from "@/lib/article-covers";
import ReadProgress from "@/components/site/ReadProgress";
import { withConceptLinks, conceptIdsInText } from "@/lib/concept-links";

// المقالات المجدولة تظهر في موعدها دون إعادة بناء
export const revalidate = 3600;

export const dynamicParams = true;
export function generateStaticParams() {
  return allArticles().map((a) => ({ slug: a.slug }));
}

/** صورة المقال داخل النص بعد الفقرة الأولى، إن لم يكن في النص صورة أصلًا (فلا تتكرر الصورة في الصفحة) */
function withCoverInside(md: string, slug: string, title: string): string {
  if (md.includes("![") || !ARTICLE_COVERS.has(slug)) return md;
  const i = md.indexOf("\n\n");
  const img = `\n\n![${title}](/covers/${slug}.jpg)\n\n`;
  return i === -1 ? md + img : md.slice(0, i) + img + md.slice(i + 2);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = articleBySlug((await params).slug);
  if (!a) return {};
  const url = `${SITE_URL}/articles/${a.slug}`;
  return {
    // العنوان الطويل يُعرض كاملًا دون اسم الموقع حتى لا يقصّه البحث
    title: (() => { const t = a.seoTitle ?? a.title; return t.length > 52 ? { absolute: t } : `${t} | تربوي`; })(),
    description: a.description,
    keywords: a.tags,
    alternates: { canonical: url },
    openGraph: { title: a.seoTitle ?? a.title, description: a.description, url, type: "article", locale: "ar_AR", siteName: "تربوي", publishedTime: a.date, modifiedTime: a.updated, tags: a.tags, images: [{ url: ARTICLE_COVERS.has(a.slug) ? `/covers/${a.slug}.jpg` : "/og.jpg" }] },
  };
}

/** أسئلة قسم «أسئلة شائعة» في المقال: **السؤال؟** ثم سطر الجواب — لبيانات FAQPage */
function faqOf(body: string): { q: string; a: string }[] {
  const m = body.split(/^## أسئلة شائعة\s*$/m)[1];
  if (!m) return [];
  const sec = m.split(/^## /m)[0];
  const out: { q: string; a: string }[] = [];
  const rx = /\*\*([^*\n]+؟)\*\*\s*\n([^\n]+(?:\n(?!\*\*|\n)[^\n]+)*)/g;
  for (let r = rx.exec(sec); r; r = rx.exec(sec)) out.push({ q: r[1].trim(), a: r[2].replace(/\*\*/g, "").trim() });
  return out;
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = articleBySlug((await params).slug);
  if (!a) notFound();
  const course = articleCourse(a);
  const heads = a.body.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());
  let hi = 0;
  const path = `/articles/${a.slug}`;
  const all = allArticles();
  // ذات الصلة: الأكثر اشتراكًا في الوسوم، ثم التصنيف نفسه
  const others = all.filter((x) => x.slug !== a.slug);
  const score = (x: (typeof all)[number]) => x.tags.filter((t) => a.tags.includes(t)).length * 2 + (x.category === a.category ? 1 : 0);
  const related = [...others].sort((x, y) => score(y) - score(x) || y.date.localeCompare(x.date)).slice(0, 6);
  const sameCat = others.filter((x) => x.category === a.category && !related.includes(x)).slice(0, 6);
  // الدروس التي يذكرها المقال، ثم دروس من محوره إن قلّت
  const bank = publicBank();
  const byId = new Map(bank.concepts.map((c) => [c.id, c]));
  const lessonIds = conceptIdsInText(a.body, 6);
  const lessons = [...lessonIds.map((id) => byId.get(id)!).filter(Boolean), ...bank.concepts.filter((c) => c.courseId === course && !lessonIds.includes(c.id))].slice(0, 6);
  // نص المقال يُقسم عند عنوان في منتصفه، ليوضع إعلان بين الجزأين
  const fullMd = withCoverInside(withConceptLinks(withInternalLinks(a, all)), a.slug, a.title);
  const h2At = [...fullMd.matchAll(/\n## /g)].map((m) => m.index!);
  // إعلان بعد كل ثلاثة أقسام من المقال
  const cuts = h2At.filter((_, i) => i > 0 && i % 3 === 0);
  const parts = [0, ...cuts].map((at, i, arr) => fullMd.slice(at, arr[i + 1] ?? fullMd.length));
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.description,
      datePublished: a.date,
      dateModified: a.updated,
      ...(ARTICLE_REFS[a.slug] ? { citation: ARTICLE_REFS[a.slug] } : {}),
      inLanguage: "ar",
      keywords: a.tags.join("، "),
      articleSection: a.category,
      image: `${SITE_URL}${ARTICLE_COVERS.has(a.slug) ? `/covers/${a.slug}.jpg` : "/og.jpg"}`,
      author: { "@type": "Organization", name: "تربوي", url: `${SITE_URL}/` },
      publisher: { "@type": "Organization", name: "تربوي", logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512-v4.png` } },
      mainEntityOfPage: `${SITE_URL}${path}`,
    },
    ...(faqOf(a.body).length
      ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqOf(a.body).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "مقالات تربوية", item: `${SITE_URL}/articles` },
        { "@type": "ListItem", position: 3, name: a.title, item: `${SITE_URL}${path}` },
      ],
    },
  ];

  return (
    <WithSidebar>
      <ReadProgress color={courseMeta(course).color} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Crumbs items={[{ href: "/articles", label: "مقالات تربوية" }, { href: `/articles/c/${CAT_SLUGS[a.category] ?? "issues"}`, label: a.category }]} />

      <article className="overflow-hidden rounded-2xl border border-[#E2ECE6] bg-white">
        <div className="p-5 sm:p-8">
          <h1 className="font-display text-[27px] font-extrabold leading-[1.5] sm:text-[33px]">{a.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#6B8077]">
            <Link href={`/articles/c/${CAT_SLUGS[a.category] ?? "issues"}`} className="rounded-md px-2 py-0.5 font-bold text-white" style={{ background: courseMeta(course).color }}>{a.category}</Link>
            <span>{arDate(a.date)}</span>
            {a.updated !== a.date && <span>حُدّث {arDate(a.updated)}</span>}
          </div>
          <p className="mt-3 border-s-4 ps-4 text-[17px] leading-8 text-[#3A5249]" style={{ borderColor: courseMeta(course).color }}>{a.description}</p>

          {heads.length > 2 && (
            <nav className="mt-6 rounded-2xl p-4" style={{ background: `${courseMeta(course).color}0F` }} aria-label="محتويات المقال">
              <p className="font-display text-[16px] font-extrabold" style={{ color: courseMeta(course).color }}>محتويات المقال</p>
              <ol className="mt-2 space-y-1.5 text-[15px]">
                {heads.map((h, i) => (
                  <li key={h}><a href={`#s-${i + 1}`} className="flex gap-2 leading-7 text-[#24403A] hover:underline"><span className="font-bold" style={{ color: courseMeta(course).color }}>{ad(i + 1)}.</span>{h}</a></li>
                ))}
              </ol>
            </nav>
          )}

          {related.length >= 2 && (
            <div className="mt-4 rounded-2xl border border-[#C5E5DF] px-4 py-3">
              <p className="text-[14px] font-extrabold text-[#14302A]">ذات صلة</p>
              <ul className="mt-1 space-y-1">
                {related.slice(0, 2).map((r) => (
                  <li key={r.slug}><Link href={`/articles/${r.slug}`} className="text-[15px] font-bold leading-7 text-[#168477] hover:underline">{r.title}</Link></li>
                ))}
              </ul>
            </div>
          )}

          <AdSlot />

          <div id="article-body" className="mt-7 text-[17.5px] leading-[2.05] text-[#24403A] [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:leading-[1.5] [&_h2]:text-[#14302A] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-[19px] [&_h3]:font-extrabold [&_h3]:text-[#14302A] [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_strong]:text-[#14302A] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_li::marker]:text-[#136F5C] [&_a]:font-bold [&_a]:text-[#136F5C] [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:rounded-xl [&_blockquote]:border-s-4 [&_blockquote]:border-[#136F5C] [&_blockquote]:bg-[#EEF5F1] [&_blockquote]:px-4 [&_blockquote]:py-1 [&_img]:my-6 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-2xl">
            {parts.map((md, k) => (
              <div key={k}>
                {k > 0 && <AdSlot />}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ table: ({ children }) => <div className="md-table"><table>{children}</table></div>, h2: ({ children }) => <h2 id={`s-${++hi}`} className="scroll-mt-20">{children}</h2>, img: ({ src, alt }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" width={1200} height={675} /> }}>{md}</ReactMarkdown>
              </div>
            ))}
          </div>

          <HelpfulVote id={a.slug} />

          {/* المراجع ومن راجع المحتوى */}
          {(ARTICLE_REFS[a.slug]?.length ?? 0) > 0 && (
            <section className="mt-8 rounded-2xl bg-[#F7FAF8] p-5">
              <h2 className="font-display text-[17px] font-extrabold text-[#14302A]">المراجع</h2>
              <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-[13.5px] leading-7 text-[#4A6158]">
                {ARTICLE_REFS[a.slug].map((r) => <li key={r} dir="auto" className="text-start">{r}</li>)}
              </ol>
            </section>
          )}
          <p className="mt-4 text-[13px] leading-7 text-[#6B8077]">
            {REVIEWER ? <>راجعه: {REVIEWER.name}، {REVIEWER.title}. </> : null}
            <Link href="/editorial-policy" className="font-bold text-[#136F5C]">كيف نعد المحتوى ونراجعه</Link>. لاحظت خطأ؟ <Link href="/contact" className="font-bold text-[#136F5C]">أخبرنا</Link>.
          </p>

          <AdSlot />

          {a.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-[#6B8077]" />
              {a.tags.map((t) => (
                <Link key={t} href={topicForTag(t) ? `/topics/${topicForTag(t)!.slug}` : `/search?q=${encodeURIComponent(t)}`} rel={topicForTag(t) ? undefined : "nofollow"} className="rounded-full bg-[#EEF5F1] px-3 py-1 text-[13px] font-bold text-[#136F5C] hover:bg-[#136F5C] hover:text-white">#{t}</Link>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-[#EEF3F0] pt-5"><ShareRow path={path} title={a.title} /></div>
          <TelegramCard className="mt-5" />

          <div className="mt-6 rounded-xl bg-[#136F5C] p-5 text-white">
            <p className="font-display text-[19px] font-extrabold">حوّل القراءة إلى استعداد</p>
            <p className="mt-1 text-[14px] leading-7 text-white/85">تدرّب على أسئلة بمستوى اختبارات المعلمين مع تفسير كل خيار، مجانًا.</p>
            <Link prefetch={false} href="/app" className="mt-3 inline-block rounded-xl bg-[#7C5CFF] px-5 py-2.5 font-bold text-white">ابدأ التدريب</Link>
          </div>
        </div>
      </article>

      <section className="mt-8">
        <SectionTitle title="مقالات ذات صلة" more={{ href: "/articles", label: "كل المقالات" }} />
        <CardGrid>{related.map((r) => <GridCard key={r.slug} href={`/articles/${r.slug}`} id={r.slug} title={r.title} courseId={articleCourse(r)} badge={r.category} />)}</CardGrid>
      </section>

      {lessons.length > 0 && (
        <section className="mt-8">
          <SectionTitle title="دروس مرتبطة" more={{ href: "/learn", label: "كل المحاور" }} />
          <CardGrid>{lessons.map((c) => <GridCard key={c.id} href={`/learn/${c.courseId}/${c.id}`} id={c.id} title={c.title} courseId={c.courseId} badge={courseMeta(c.courseId).short} />)}</CardGrid>
        </section>
      )}

      <AdSlot />

      {sameCat.length > 0 && (
        <section className="mt-8">
          <SectionTitle title={`من تصنيف ${a.category}`} more={{ href: `/articles/c/${CAT_SLUGS[a.category] ?? "issues"}`, label: "كل مقالات التصنيف" }} />
          <CardGrid>{sameCat.map((r) => <GridCard key={r.slug} href={`/articles/${r.slug}`} id={r.slug} title={r.title} courseId={articleCourse(r)} badge={r.category} />)}</CardGrid>
        </section>
      )}
    </WithSidebar>
  );
}
