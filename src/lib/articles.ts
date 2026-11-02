// مقالات الموقع المكتوبة (قضايا تربوية وتعليمية): تُقرأ من content/articles عند البناء
import { readFileSync, readdirSync } from "fs";
import path from "path";

export type Article = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  body: string;
  minutes: number;
};

const DIR = path.join(process.cwd(), "content", "articles");

/** تصنيفات المقالات، ولكل تصنيف محور يأخذ منه لونه */
export const ARTICLE_CATS: Record<string, string> = {
  "قضايا تربوية": "M5",
  "التدريس والتخطيط": "M5",
  "نظريات التعلم": "M3",
  "التقويم والقياس": "M4",
  "المذاكرة والاختبارات": "G1",
  "الصحة النفسية والسلوك": "M2",
  "التعليم والتقنية": "AI1",
  "التربية الخاصة": "SE1",
};

/** روابط تصنيفات المقالات */
export const CAT_SLUGS: Record<string, string> = {
  "التدريس والتخطيط": "teaching",
  "نظريات التعلم": "learning-theories",
  "التقويم والقياس": "assessment",
  "المذاكرة والاختبارات": "exams",
  "الصحة النفسية والسلوك": "wellbeing",
  "التعليم والتقنية": "edtech",
  "التربية الخاصة": "special-education",
  "قضايا تربوية": "issues",
};
export const catBySlug = (slug: string) => Object.keys(CAT_SLUGS).find((k) => CAT_SLUGS[k] === slug);
/** التصنيفات التي فيها مقالات، مرتبة بعددها */
export function articleCats() {
  const n = new Map<string, number>();
  for (const a of allArticles()) n.set(a.category, (n.get(a.category) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count, slug: CAT_SLUGS[name] ?? "issues" }));
}

/** وسوم افتراضية للمقالات القديمة التي كُتبت دون وسوم */
const DEFAULT_TAGS: Record<string, string[]> = {
  "bandura-social-learning": ["باندورا", "التعلم الاجتماعي", "نظريات التعلم", "النمذجة"],
  "education-myths": ["خرافات تربوية", "البحث التربوي", "أنماط التعلم"],
  "first-year-classroom": ["إدارة الصف", "المعلم الجديد", "القواعد الصفية"],
  "formative-assessment-tools": ["التقويم البنائي", "التقويم", "استراتيجيات التدريس"],
  "license-exam-plan": ["الرخصة المهنية", "اختبار المعلمين", "خطة مذاكرة"],
  "negative-reinforcement": ["التعزيز السلبي", "التعزيز", "العقاب", "السلوكية"],
  "piaget-stages": ["بياجيه", "مراحل النمو", "النمو المعرفي"],
  "study-methods-research": ["طرق المذاكرة", "الاسترجاع", "التكرار المتباعد"],
  "teacher-interview": ["مقابلة المعلمين", "التوظيف", "اختبار المعلمين"],
  "validity-reliability": ["الصدق", "الثبات", "القياس", "الاختبارات"],
  "writing-mcq": ["الاختيار من متعدد", "بناء الاختبارات", "التقويم"],
  "writing-objectives": ["الأهداف السلوكية", "التخطيط للدرس", "تصنيف بلوم"],
  "zpd-scaffolding": ["فيجوتسكي", "منطقة النمو القريبة", "السقالات"],
};

function parse(slug: string, raw: string): Article {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta: Record<string, string> = {};
  const head = m ? m[1] : "";
  const body = (m ? m[2] : raw).trim();
  for (const line of head.split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const tags = meta.tags ? meta.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean) : DEFAULT_TAGS[slug] ?? [];
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? "",
    date: meta.date ?? "",
    category: meta.category ?? "قضايا تربوية",
    tags,
    body,
    minutes: Math.max(2, Math.round(body.split(/\s+/).length / 180)),
  };
}

let cache: Article[] | null = null;

/** كل ملفات المقالات، ومنها المجدولة التي لم يحن موعدها */
function everyArticle(): Article[] {
  cache ??= readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parse(f.replace(/\.md$/, ""), readFileSync(path.join(DIR, f), "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date));
  return cache;
}

/** تاريخ اليوم بتوقيت مكة، بصيغة YYYY-MM-DD */
export function todayISO() {
  // للمعاينة المحلية فقط: ARTICLES_PREVIEW_DATE=2027-02-01 يُظهر المجدولة حتى هذا التاريخ
  if (process.env.ARTICLES_PREVIEW_DATE) return process.env.ARTICLES_PREVIEW_DATE;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** المقالات المنشورة فقط، الأحدث أولًا. المقال المجدول يظهر وحده صباح يوم تاريخه (الصفحات تُحدَّث كل ساعة) */
export function allArticles(): Article[] {
  const today = todayISO();
  return everyArticle().filter((a) => a.date <= today);
}

export const articleBySlug = (slug: string) => allArticles().find((a) => a.slug === slug);
export const articleCourse = (a: Article) => ARTICLE_CATS[a.category] ?? "M5";

/** تاريخ عربي مقروء */
export function arDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-u-nu-arab", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T12:00:00Z"));
  } catch {
    return iso;
  }
}
