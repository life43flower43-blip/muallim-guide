import { QUESTIONS_A } from "./questions-a";
import { QUESTIONS_B } from "./questions-b";
import { CONCEPTS, CATEGORIES, CAT_MAP, LEVELS, BADGES } from "./concepts";
import { SCENARIOS } from "./scenarios";
import type { QuizQuestion, Concept, CategoryId } from "./types";

export * from "./types";
export { CONCEPTS, CATEGORIES, CAT_MAP, LEVELS, BADGES, SCENARIOS };

export const QUESTIONS: QuizQuestion[] = [...QUESTIONS_A, ...QUESTIONS_B];

export const CONCEPT_MAP: Record<string, Concept> = Object.fromEntries(
  CONCEPTS.map((c) => [c.id, c])
);

export const QUESTION_MAP: Record<string, QuizQuestion> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q])
);

export function questionsByCategory(cat: CategoryId | "all"): QuizQuestion[] {
  return cat === "all" ? QUESTIONS : QUESTIONS.filter((q) => q.category === cat);
}

export function questionsByConcept(conceptId: string): QuizQuestion[] {
  return QUESTIONS.filter((q) => q.conceptId === conceptId);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildQuiz(
  cat: CategoryId | "all",
  count: number,
  reviewIds?: string[]
): QuizQuestion[] {
  if (reviewIds && reviewIds.length) {
    const pool = reviewIds
      .map((id) => QUESTION_MAP[id])
      .filter(Boolean);
    return shuffle(pool).slice(0, count);
  }
  return shuffle(questionsByCategory(cat)).slice(0, count);
}

export const XP_CORRECT = 10;
export const XP_RETRY_CORRECT = 5;
export const XP_QUIZ_DONE = 15;
export const XP_SCENARIO_BEST = 20;
export const XP_SCENARIO_OK = 8;
export const XP_PLAN_STEP = 10;

/** مفهوم اليوم: يدور يومياً بحسب التاريخ */
export function conceptOfDay(): Concept {
  const today = new Date();
  const dayIndex = Math.floor(
    today.getTime() / (1000 * 60 * 60 * 24)
  );
  return CONCEPTS[dayIndex % CONCEPTS.length];
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "صباح التعلم النشط";
  if (h < 17) return "طاب يومك التعليمي";
  if (h < 20) return "مساء المعرفة";
  return "سهرتك العلمية";
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function yesterdayKey(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
