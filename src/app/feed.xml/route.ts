// خلاصة RSS للمقالات: تقرؤها تطبيقات الأخبار ومجمّعات المحتوى فتنتشر المقالات الجديدة تلقائيًا
import { allArticles } from "@/lib/articles";
import { SITE_URL } from "@/lib/public-bank";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const items = allArticles()
    .map(
      (a) => `<item><title>${esc(a.title)}</title><link>${SITE_URL}/articles/${a.slug}</link><guid>${SITE_URL}/articles/${a.slug}</guid><pubDate>${new Date(a.date + "T08:00:00Z").toUTCString()}</pubDate><category>${esc(a.category)}</category><description>${esc(a.description)}</description></item>`
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>تربوي: مقالات تربوية</title><link>${SITE_URL}/articles</link><description>مقالات عربية عملية للمعلمين وطلاب كليات التربية</description><language>ar</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
