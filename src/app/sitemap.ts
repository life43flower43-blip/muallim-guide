import type { MetadataRoute } from "next";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { APP_SECTIONS } from "@/lib/site-nav";
import { allArticles, articleCats } from "@/lib/articles";
import { PROBLEMS } from "@/lib/site-problems";

// المقالات المجدولة تظهر في موعدها دون إعادة بناء
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const b = publicBank();
  const fixed = ["", "/learn", "/articles", "/practice-test", "/license-guide", "/standards", "/license-calculator", "/weekly-test", "/tatbeeq", "/misconceptions", "/classroom-problems", "/mind-maps", "/comparisons", "/glossary", "/sections", ...APP_SECTIONS.map((s) => `/sections/${s.slug}`), "/about", "/privacy", "/terms", "/contact"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "monthly" as const, priority: p === "/learn" ? 0.9 : 0.5 }));
  const courses = Object.keys(b.courses).map((id) => ({ url: `${SITE_URL}/learn/${id}`, changeFrequency: "monthly" as const, priority: 0.8 }));
  const concepts = b.concepts.map((c) => ({ url: `${SITE_URL}/learn/${c.courseId}/${c.id}`, changeFrequency: "monthly" as const, priority: 0.7 }));
  const articles = allArticles().map((a) => ({ url: `${SITE_URL}/articles/${a.slug}`, lastModified: a.date, changeFrequency: "monthly" as const, priority: 0.8 }));
  const cats = articleCats().map((c) => ({ url: `${SITE_URL}/articles/c/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  const problems = PROBLEMS.map((x) => ({ url: `${SITE_URL}/classroom-problems/${x.slug}`, changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...fixed, ...articles, ...cats, ...problems, ...courses, ...concepts];
}
