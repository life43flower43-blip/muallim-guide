import raw from "@/data/qbank.json";
import type { Concept, Course, Question } from "./types";

export const COURSES: Course[] = Object.entries(raw.courses).map(([id, name]) => ({
  id,
  name: name as string,
}));

export const CONCEPTS: Concept[] = raw.concepts as Concept[];
export const QUESTIONS: Question[] = raw.questions as Question[];

export const COURSE_COLOR: Record<string, string> = {
  M1: "#2D6A4F",
  M2: "#B45309",
  M3: "#7C3AED",
  M4: "#0E7490",
  M5: "#BE185D",
  G1: "#1D4ED8",
};

export const courseById = (id: string) => COURSES.find((c) => c.id === id);

// خرائط بحث فوري O(1) — الأداء مع مئات المفاهيم والأسئلة
const CONCEPT_MAP = new Map(CONCEPTS.map((c) => [c.id, c]));
const QUESTION_MAP = new Map(QUESTIONS.map((q) => [q.id, q]));

export const conceptById = (id: string) => CONCEPT_MAP.get(id);
export const questionById = (id: string) => QUESTION_MAP.get(id);

export const conceptsOfCourse = (courseId: string) =>
  CONCEPTS.filter((c) => c.courseId === courseId);

export const questionsOfConcept = (conceptId: string) =>
  QUESTIONS.filter((q) => q.conceptId === conceptId);

export const questionsOfCourse = (courseId: string) => {
  const cids = new Set(conceptsOfCourse(courseId).map((c) => c.id));
  return QUESTIONS.filter((q) => cids.has(q.conceptId));
};

// فصول مرتبة حسب ظهورها في المساق
export const chaptersOfCourse = (courseId: string) => {
  const seen: string[] = [];
  for (const c of conceptsOfCourse(courseId)) {
    if (!seen.includes(c.chapter)) seen.push(c.chapter);
  }
  return seen;
};

export const questionsOfChapter = (courseId: string, chapter: string) => {
  const cids = new Set(
    CONCEPTS.filter((c) => c.courseId === courseId && c.chapter === chapter).map(
      (c) => c.id
    )
  );
  return QUESTIONS.filter((q) => cids.has(q.conceptId));
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const OPTION_LETTERS = ["أ", "ب", "ج", "د"];

export const LEVEL_TITLES = [
  "مبتدئ",
  "ناشئ",
  "متمكن",
  "متفوق",
  "خبير",
  "محترف",
  "أستاذ",
];

export const LEVEL_XP = 300; // عتبة نقاط الخبرة لكل مستوى — مصدر وحيد للرقم
export const levelFromXp = (xp: number) => Math.floor(xp / LEVEL_XP) + 1;
export const levelTitle = (level: number) =>
  LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
export const xpInLevel = (xp: number) => xp % LEVEL_XP;
