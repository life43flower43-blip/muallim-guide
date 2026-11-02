import type { Metadata } from "next";
import { SITE_URL } from "@/lib/public-bank";
import { allArticles, arDate, articleCourse } from "@/lib/articles";
import { ArticleCard, Crumbs, Tile, WithSidebar } from "@/components/site/Blocks";
import CatChips from "@/components/site/CatChips";

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
      <h1 className="font-display text-[28px] font-extrabold">مقالات تربوية</h1>
      <p className="mt-2 leading-8 text-[#4D635A]">قضايا يعيشها المعلم كل يوم: في الصف، ومع الطلاب وأولياء الأمور، وفي الاستعداد لاختبارات المهنة.</p>
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
