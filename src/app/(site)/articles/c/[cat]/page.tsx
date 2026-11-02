// صفحة تصنيف من تصنيفات المقالات
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/public-bank";
import { allArticles, arDate, articleCats, articleCourse, catBySlug } from "@/lib/articles";
import { ArticleCard, Crumbs, Tile, WithSidebar } from "@/components/site/Blocks";
import CatChips from "@/components/site/CatChips";

export const dynamicParams = false;
export function generateStaticParams() {
  return articleCats().map((c) => ({ cat: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ cat: string }> }): Promise<Metadata> {
  const name = catBySlug((await params).cat);
  if (!name) return {};
  const list = allArticles().filter((a) => a.category === name);
  return {
    title: `مقالات ${name} للمعلمين | تربوي`,
    description: `مقالات عربية في ${name}: ${list.slice(0, 3).map((a) => a.title.split(":")[0]).join("، ")}، وغيرها.`,
    alternates: { canonical: `${SITE_URL}/articles/c/${(await params).cat}` },
  };
}

export default async function ArticleCategory({ params }: { params: Promise<{ cat: string }> }) {
  const name = catBySlug((await params).cat);
  if (!name) notFound();
  const [first, ...rest] = allArticles().filter((a) => a.category === name);
  return (
    <WithSidebar>
      <Crumbs items={[{ href: "/articles", label: "مقالات تربوية" }, { label: name }]} />
      <h1 className="font-display text-[28px] font-extrabold">{name}</h1>
      <div className="mt-4"><CatChips active={name} /></div>
      <div className="mt-6 space-y-5">
        <ArticleCard a={first} wide />
        {rest.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {rest.map((a) => <Tile key={a.slug} href={`/articles/${a.slug}`} id={a.slug} title={a.title} courseId={articleCourse(a)} meta={arDate(a.date)} />)}
          </div>
        )}
      </div>
    </WithSidebar>
  );
}
