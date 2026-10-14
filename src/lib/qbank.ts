import type { Concept, Course, Question } from "./types";

type QbankRaw = {
  courses: Record<string, string>;
  concepts: Concept[];
  questions: Question[];
};

// الحالة القابلة للتعبئة — تُملأ بعد تحميل البنك من «/data/qbank.json» وقت التشغيل
// (فصل البيانات عن حزمة الجافاسكربت: فتح أسرع وبنك يتسع لمئات المفاهيم)
export let COURSES: Course[] = [];
export let CONCEPTS: Concept[] = [];
export let QUESTIONS: Question[] = [];

let CONCEPT_MAP = new Map<string, Concept>();
let QUESTION_MAP = new Map<string, Question>();

let resolveReady: (() => void) | null = null;
export const qbankReady = new Promise<void>((res) => {
  resolveReady = res;
});

/** تعبئة الحالة وبناء الخرائط — تُستدعى من المحمّل بعد وصول البيانات */
export function applyQbank(raw: QbankRaw) {
  COURSES = Object.entries(raw.courses).map(([id, name]) => ({
    id,
    name: name as string,
  }));
  CONCEPTS = raw.concepts as Concept[];
  QUESTIONS = raw.questions as Question[];
  CONCEPT_MAP = new Map(CONCEPTS.map((c) => [c.id, c]));
  QUESTION_MAP = new Map(QUESTIONS.map((q) => [q.id, q]));
  const done = resolveReady;
  resolveReady = null;
  done?.();
}

/** المحمّل: جلب البنك مع مؤشر تقدم ومحاولة إعادة واحدة عند الفشل */
export async function loadQbank(
  onProgress?: (p: number) => void
): Promise<void> {
  const attempt = async () => {
    const res = await fetch("/data/qbank.json");
    if (!res.ok) throw new Error(`فشل تحميل البنك (${res.status})`);
    const total = Number(res.headers.get("Content-Length") || 0);
    if (res.body && total > 0) {
      const reader = res.body.getReader();
      const parts: BlobPart[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          parts.push(value);
          received += value.length;
          onProgress?.(Math.min(0.99, received / total));
        }
      }
      const text = await new Blob(parts).text();
      applyQbank(JSON.parse(text) as QbankRaw);
    } else {
      applyQbank((await res.json()) as QbankRaw);
    }
    onProgress?.(1);
  };
  try {
    await attempt();
  } catch (e) {
    // محاولة إعادة واحدة بعد راحة قصيرة — لتجاوز تقطّع الشبكة العابر
    await new Promise((r) => setTimeout(r, 900));
    await attempt();
  }
}

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
  const per = Math.ceil(total / Math.max(1, COURSES.length));
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
