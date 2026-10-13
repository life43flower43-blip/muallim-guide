import raw from "@/data/qbank.json";
import type { Concept, Course, Question } from "./types";

export const COURSES: Course[] = Object.entries(raw.courses).map(([id, name]) => ({
  id,
  name: name as string,
}));

export const CONCEPTS: Concept[] = raw.concepts as Concept[];
export const QUESTIONS: Question[] = raw.questions as Question[];

export const COURSE_COLOR: Record<string, string> = {
  M1: "#5B21B6",
  M2: "#B45309",
  M3: "#7C3AED",
  M4: "#D97706",
  M5: "#6D28D9",
  G1: "#8B5CF6",
  C1: "#9333EA",
};

// أسماء مختصرة للمحاور — للشرائح والشارات الصغيرة (بلا أرقام — قرار المستخدم)
export const COURSE_SHORT: Record<string, string> = {
  M1: "نمو الطلاب",
  M2: "المشاعر والذكاء",
  M3: "كيف يتعلمون",
  M4: "التقويم",
  M5: "التدريس",
  G1: "ثقافة تربوية",
  C1: "مهارات معرفية",
};

export const courseById = (id: string) => COURSES.find((c) => c.id === id);

// خرائط بحث فوري O(1) — الأداء مع مئات المفاهيم والأسئلة
const CONCEPT_MAP = new Map(CONCEPTS.map((c) => [c.id, c]));
const QUESTION_MAP = new Map(QUESTIONS.map((q) => [q.id, q]));

export const conceptById = (id: string) => CONCEPT_MAP.get(id);
export const questionById = (id: string) => QUESTION_MAP.get(id);

/** أمثلة المفهوم الواقعية — الأمثلة المتعددة الجديدة، وإن غابت رجع بالمثال الأصلي المفرد */
export const examplesOf = (c: Concept): string[] =>
  c.examples && c.examples.length > 0 ? c.examples : c.example ? [c.example] : [];

export const conceptsOfCourse = (courseId: string) =>
  CONCEPTS.filter((c) => c.courseId === courseId);

export const questionsOfConcept = (conceptId: string) =>
  QUESTIONS.filter((q) => q.conceptId === conceptId);

export const questionsOfCourse = (courseId: string) => {
  const cids = new Set(conceptsOfCourse(courseId).map((c) => c.id));
  return QUESTIONS.filter((q) => cids.has(q.conceptId));
};

// الموضوعات مرتبة حسب ظهورها في المحور
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

// مجموعة اختبار الكفاءة الشامل — توزيع متوازن على المحاور كلها ثم خلط
// (من ميزة «ي» في بحث مشاكل الطلبة: رسوب اختبارات الترخيص)
export function buildProficiencySet(total = 50): string[] {
  const per = Math.ceil(total / COURSES.length);
  const parts = COURSES.map((c) =>
    shuffle(questionsOfCourse(c.id).map((q) => q.id)).slice(0, per)
  );
  return shuffle(parts.flat()).slice(0, total);
}

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
