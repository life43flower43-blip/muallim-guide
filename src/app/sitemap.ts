import { COMPARISONS } from "@/lib/comparisons";
import type { MetadataRoute } from "next";
import { SPECIALTIES } from "@/lib/specialties";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { APP_SECTIONS } from "@/lib/site-nav";
import { allArticles, articleCats } from "@/lib/articles";
import { TOPICS } from "@/lib/topics";
import { PROBLEMS } from "@/lib/site-problems";

// المقالات المجدولة تظهر في موعدها دون إعادة بناء
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const b = publicBank();
  const fixed = ["", "/learn", "/articles", "/practice-test", "/license-questions", "/license-guide", "/standards", "/license-calculator", "/weekly-test", "/teacher-exams", "/specialized", ...SPECIALTIES.map((x) => `/specialized/${x.slug}`), "/tatbeeq", "/misconceptions", "/classroom-problems", "/mind-maps", "/comparisons", ...COMPARISONS.map((c) => `/comparisons/${c.slug}`), "/glossary", "/sections", ...APP_SECTIONS.map((s) => `/sections/${s.slug}`), "/about", "/editorial-policy", "/privacy", "/terms", "/contact"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "monthly" as const, priority: p === "/learn" ? 0.9 : 0.5 }));
  const courses = Object.keys(b.courses).map((id) => ({ url: `${SITE_URL}/learn/${id}`, changeFrequency: "monthly" as const, priority: 0.8 }));
  const concepts = b.concepts.map((c) => ({ url: `${SITE_URL}/learn/${c.courseId}/${c.id}`, changeFrequency: "monthly" as const, priority: 0.7 }));
  const articles = allArticles().map((a) => ({ url: `${SITE_URL}/articles/${a.slug}`, lastModified: a.date, changeFrequency: "monthly" as const, priority: 0.8 }));
  const cats = articleCats().map((c) => ({ url: `${SITE_URL}/articles/c/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 }));
  const problems = PROBLEMS.map((x) => ({ url: `${SITE_URL}/classroom-problems/${x.slug}`, changeFrequency: "monthly" as const, priority: 0.7 }));
  const topics = [{ url: `${SITE_URL}/topics`, changeFrequency: "weekly" as const, priority: 0.8 }, ...TOPICS.map((t) => ({ url: `${SITE_URL}/topics/${t.slug}`, changeFrequency: "weekly" as const, priority: 0.8 }))];
  return [...fixed, ...topics, ...articles, ...cats, ...problems, ...courses, ...concepts];
}
