import type { MetadataRoute } from "next";
import { SITE_URL, publicBank } from "@/lib/public-bank";
import { APP_SECTIONS } from "@/lib/site-nav";

export default function sitemap(): MetadataRoute.Sitemap {
  const b = publicBank();
  const fixed = ["", "/learn", "/glossary", "/sections", ...APP_SECTIONS.map((s) => `/sections/${s.slug}`), "/about", "/privacy", "/terms", "/contact"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "monthly" as const, priority: p === "/learn" ? 0.9 : 0.5 }));
  const courses = Object.keys(b.courses).map((id) => ({ url: `${SITE_URL}/learn/${id}`, changeFrequency: "monthly" as const, priority: 0.8 }));
  const concepts = b.concepts.map((c) => ({ url: `${SITE_URL}/learn/${c.courseId}/${c.id}`, changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...fixed, ...courses, ...concepts];
}
