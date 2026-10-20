// بنك الأسئلة لصفحات الموقع العامة (تُولَّد على الخادم وتفهرسها محركات البحث)
import { readFileSync } from "fs";
import path from "path";
import type { Concept, Question } from "@/lib/types";

type Bank = { courses: Record<string, string>; concepts: Concept[]; questions: Question[] };
let bank: Bank | null = null;

export function publicBank(): Bank {
  bank ??= JSON.parse(readFileSync(path.join(process.cwd(), "public", "data", "qbank.json"), "utf8")) as Bank;
  return bank;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://turbawy.app")).replace(/\/$/, "");
export const SITE_NAME = "تربوي";

export const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

export function courseList() {
  const b = publicBank();
  return Object.entries(b.courses).map(([id, name]) => ({ id, name, concepts: b.concepts.filter((c) => c.courseId === id) }));
}

export function courseChapters(courseId: string) {
  const out: { chapter: string; concepts: Concept[] }[] = [];
  for (const c of publicBank().concepts) {
    if (c.courseId !== courseId) continue;
    const last = out[out.length - 1];
    const row = last && last.chapter === c.chapter ? last : out.find((r) => r.chapter === c.chapter);
    if (row) row.concepts.push(c);
    else out.push({ chapter: c.chapter, concepts: [c] });
  }
  return out;
}

export const conceptQuestions = (id: string) => publicBank().questions.filter((q) => q.conceptId === id);

/** وصف قصير للصفحة من أول الشرح */
export const summary = (t: string, n = 155) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n)) + "…";
};
