// صفحة مقال تربوي: غلاف، وبيانات، ونص منسق، ووسوم، ومشاركة، ومقالات ذات صلة
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Clock, Tag } from "lucide-react";
import { SITE_URL } from "@/lib/public-bank";
import { CAT_SLUGS, allArticles, arDate, articleBySlug, articleCourse } from "@/lib/articles";
import { courseMeta } from "@/lib/site-nav";
import { ad, arCount, MINUTE_FORMS } from "@/lib/arabic";
import { Cover, MiniCover } from "@/components/site/Cover";
import { Tile, Crumbs, SectionTitle, ShareRow, WithSidebar } from "@/components/site/Blocks";
import AdSlot from "@/components/site/AdSlot";
import ReadProgress from "@/components/site/ReadProgress";

export const dynamicParams = false;
export function generateStaticParams() {
  return allArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = articleBySlug((await params).slug);
  if (!a) return {};
  const url = `${SITE_URL}/articles/${a.slug}`;
  return {
    title: `${a.title} | تربوي`,
    description: a.description,
    keywords: a.tags,
    alternates: { canonical: url },
    openGraph: { title: a.title, description: a.description, url, type: "article", locale: "ar_AR", siteName: "تربوي", publishedTime: a.date, tags: a.tags, images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = articleBySlug((await params).slug);
  if (!a) notFound();
  const course = articleCourse(a);
  const heads = a.body.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3).trim());
  let hi = 0;
  const path = `/articles/${a.slug}`;
  const all = allArticles();
  const related = [...all.filter((x) => x.slug !== a.slug && x.category === a.category), ...all.filter((x) => x.slug !== a.slug && x.category !== a.category)].slice(0, 4);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.description,
      datePublished: a.date,
      inLanguage: "ar",
      keywords: a.tags.join("، "),
      articleSection: a.category,
      image: `${SITE_URL}/og.jpg`,
      author: { "@type": "Organization", name: "تربوي", url: `${SITE_URL}/` },
      publisher: { "@type": "Organization", name: "تربوي", logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512-v3.png` } },
      mainEntityOfPage: `${SITE_URL}${path}`,
    },
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
        <Cover id={a.slug} title={a.title} courseId={course} label={a.category} className="h-60 sm:h-80" />
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#6B8077]">
            <Link href={`/articles/c/${CAT_SLUGS[a.category] ?? "issues"}`} className="rounded-md px-2 py-0.5 font-bold text-white" style={{ background: courseMeta(course).color }}>{a.category}</Link>
            <span>{arDate(a.date)}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {arCount(a.minutes, MINUTE_FORMS)} للقراءة</span>
          </div>
          <h1 className="mt-4 font-display text-[27px] font-extrabold leading-[1.5] sm:text-[33px]">{a.title}</h1>
          <p className="mt-3 border-s-4 ps-4 text-[17px] leading-8 text-[#3A5249]" style={{ borderColor: courseMeta(course).color }}>{a.description}</p>

          {heads.length > 2 && (
            <nav className="mt-6 rounded-2xl p-4" style={{ background: `${courseMeta(course).color}0F` }} aria-label="محتويات المقال">
              <p className="mb-2 font-display text-[16px] font-extrabold" style={{ color: courseMeta(course).color }}>في هذا المقال</p>
              <ol className="space-y-1.5 text-[15px]">
                {heads.map((h, i) => (
                  <li key={h}><a href={`#s-${i + 1}`} className="flex gap-2 leading-7 text-[#24403A] hover:underline"><span className="font-bold" style={{ color: courseMeta(course).color }}>{ad(i + 1)}.</span>{h}</a></li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-7 text-[17.5px] leading-[2.05] text-[#24403A] [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:leading-[1.5] [&_h2]:text-[#14302A] [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_strong]:text-[#14302A] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_li::marker]:text-[#136F5C] [&_a]:font-bold [&_a]:text-[#136F5C] [&_a]:underline">
            <ReactMarkdown components={{ h2: ({ children }) => <h2 id={`s-${++hi}`} className="scroll-mt-20">{children}</h2> }}>{a.body}</ReactMarkdown>
          </div>

          <AdSlot />

          {a.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-[#6B8077]" />
              {a.tags.map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full bg-[#EEF5F1] px-3 py-1 text-[13px] font-bold text-[#136F5C] hover:bg-[#136F5C] hover:text-white">#{t}</Link>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-[#EEF3F0] pt-5"><ShareRow path={path} title={a.title} /></div>

          <div className="mt-6 rounded-xl bg-[#136F5C] p-5 text-white">
            <p className="font-display text-[19px] font-extrabold">حوّل القراءة إلى استعداد</p>
            <p className="mt-1 text-[14px] leading-7 text-white/85">تدرّب على أسئلة بمستوى اختبارات المعلمين مع تفسير كل خيار، مجانًا.</p>
            <Link href="/app" className="mt-3 inline-block rounded-xl bg-[#E8A317] px-5 py-2.5 font-bold text-[#2B1D00]">ابدأ التدريب</Link>
          </div>
        </div>
      </article>

      <section className="mt-8">
        <SectionTitle title="مقالات قد تهمك" more={{ href: "/articles", label: "كل المقالات" }} />
        <div className="grid gap-3 sm:grid-cols-2">{related.map((r) => <Tile key={r.slug} href={`/articles/${r.slug}`} id={r.slug} title={r.title} courseId={articleCourse(r)} meta={r.category} />)}</div>
      </section>
    </WithSidebar>
  );
}
