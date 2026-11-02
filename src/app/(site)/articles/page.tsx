import type { Metadata } from "next";
import { SITE_URL } from "@/lib/public-bank";
import { allArticles, arDate, articleCourse } from "@/lib/articles";
import { ArticleCard, Crumbs, Tile, WithSidebar, PageHero } from "@/components/site/Blocks";
import CatChips from "@/components/site/CatChips";

// المقالات المجدولة تظهر في موعدها دون إعادة بناء
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "مقالات تربوية: قضايا التعليم وإدارة الصف وتطوير المعلم | تربوي",
  description: "مقالات عربية عملية للمعلمين: التنمر المدرسي، والذكاء الاصطناعي في الواجبات، والاحتراق الوظيفي، والتعلم النشط، والتواصل مع أولياء الأمور، والاستعداد لاختبار الرخصة المهنية.",
  alternates: { canonical: `${SITE_URL}/articles` },
};

export default function ArticlesIndex() {
  const [first, ...rest] = allArticles();
  return (
    <WithSidebar>
      <Crumbs items={[{ label: "مقالات تربوية" }]} />
      <PageHero kicker="اقرأ وطوّر ممارستك" title="مقالات تربوية" color="#B4532A" sub="قضايا يعيشها المعلم كل يوم: في الصف، ومع الطلاب وأولياء الأمور، وفي الاستعداد لاختبارات المهنة." />
      <div className="mt-4"><CatChips /></div>
      <div className="mt-6 space-y-5">
        <ArticleCard a={first} wide />
        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((a) => <Tile key={a.slug} href={`/articles/${a.slug}`} id={a.slug} title={a.title} courseId={articleCourse(a)} meta={arDate(a.date)} />)}
        </div>
      </div>
    </WithSidebar>
  );
}
