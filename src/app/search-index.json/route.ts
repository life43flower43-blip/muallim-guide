// فهرس خفيف لعناوين الموقع، يستعمله مربع البحث لعرض الاقتراحات أثناء الكتابة
import { publicBank } from "@/lib/public-bank";
import { allArticles } from "@/lib/articles";
import { courseMeta } from "@/lib/site-nav";

export const dynamic = "force-static";

export function GET() {
  const items = [
    ...allArticles().map((a) => ({ t: a.title, u: `/articles/${a.slug}`, c: "مقال" })),
    ...publicBank().concepts.map((c) => ({ t: c.title, u: `/learn/${c.courseId}/${c.id}`, c: courseMeta(c.courseId).short })),
  ];
  return Response.json(items, { headers: { "Cache-Control": "public, max-age=3600" } });
}
