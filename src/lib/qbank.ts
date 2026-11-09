import { useEffect, useState } from "react";
import type { Concept, Course, Question } from "./types";

/** خريطة فصل ذهنية: سلاسل تبيّن كيف تقود كل فكرة إلى التي بعدها */
export type ChapterMap = { chains: { steps: string[]; links: string[] }[] };

type QbankRaw = {
  courses: Record<string, string>;
  concepts: Concept[];
  questions: Question[];
  maps?: Record<string, ChapterMap>;
};

// الحالة القابلة للتعبئة — تُملأ بعد تحميل البنك من «/data/qbank.json» وقت التشغيل
// (فصل البيانات عن حزمة الجافاسكربت: فتح أسرع وبنك يتسع لمئات المفاهيم)
export let COURSES: Course[] = [];
export let CONCEPTS: Concept[] = [];
export let QUESTIONS: Question[] = [];
/** خرائط الفصول، مفتاحها «المحور::الفصل» */
export let CHAPTER_MAPS: Record<string, ChapterMap> = {};

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
  CHAPTER_MAPS = raw.maps ?? {};
  CONCEPT_MAP = new Map(CONCEPTS.map((c) => [c.id, c]));
  QUESTION_MAP = new Map(QUESTIONS.map((q) => [q.id, q]));
  const done = resolveReady;
  resolveReady = null;
  done?.();
}

/** إصدار البنك: يتغيّر فقط حين يتغيّر محتواه، فيُحمَّل مرة واحدة ويبقى محفوظًا عبر تحديثات الواجهة */
export const QBANK_VERSION = "310a3c4c";

/** جلب ملف JSON مع مؤشر تقدم */
async function fetchJson<T>(url: string, onProgress?: (p: number) => void): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error(`فشل تحميل البنك (${res.status})`), { status: res.status });
  const total = Number(res.headers.get("Content-Length") || 0);
  if (res.body && total > 0 && onProgress) {
    const reader = res.body.getReader();
    const parts: BlobPart[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        parts.push(value);
        received += value.length;
        onProgress(Math.min(0.99, received / total));
      }
    }
    return JSON.parse(await new Blob(parts).text()) as T;
  }
  return (await res.json()) as T;
}

type QbankDetail = { c: Record<string, string[]>; q: Record<string, string> };

/** هل وصلت التفاصيل (أسباب الإجابات والأمثلة الكاملة)؟ */
export let qbankDetailLoaded = false;

/** دمج التفاصيل في الكائنات نفسها، فتبقى المراجع المحفوظة في الواجهة صالحة */
function applyDetail(d: QbankDetail) {
  for (const [id, ex] of Object.entries(d.c)) {
    const c = CONCEPT_MAP.get(id);
    if (c) c.examples = ex;
  }
  for (const [id, r] of Object.entries(d.q)) {
    const q = QUESTION_MAP.get(id);
    if (q) q.reason = r;
  }
  qbankDetailLoaded = true;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("qbank-detail"));
}

const withRetry = async <T,>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if ((e as { status?: number }).status === 404) throw e;
    // محاولة إعادة واحدة بعد راحة قصيرة — لتجاوز تقطّع الشبكة العابر
    await new Promise((r) => setTimeout(r, 900));
    return fn();
  }
};

/** التفاصيل في الخلفية، مع إعادة المحاولة حتى تصل */
async function loadDetail(tries = 0): Promise<void> {
  try {
    applyDetail(await fetchJson<QbankDetail>(`/data/qbank-detail.json?v=${QBANK_VERSION}`));
  } catch {
    if (tries < 6) {
      await new Promise((r) => setTimeout(r, 4000 * (tries + 1)));
      return loadDetail(tries + 1);
    }
  }
}

/**
 * المحمّل: يجلب الجزء الأساسي من البنك أولًا (نحو نصف الحجم) فيفتح التطبيق،
 * ثم يجلب أسباب الإجابات والأمثلة في الخلفية. وإن لم يوجد الجزءان يرجع إلى الملف الكامل.
 */
export async function loadQbank(
  onProgress?: (p: number) => void
): Promise<void> {
  try {
    applyQbank(await withRetry(() => fetchJson<QbankRaw>(`/data/qbank-core.json?v=${QBANK_VERSION}`, onProgress)));
  } catch (e) {
    if ((e as { status?: number }).status !== 404) throw e;
    applyQbank(await withRetry(() => fetchJson<QbankRaw>(`/data/qbank.json?v=${QBANK_VERSION}`, onProgress)));
    qbankDetailLoaded = true;
    onProgress?.(1);
    return;
  }
  onProgress?.(1);
  void loadDetail();
}

// لون كل محور من الهوية: أخضر وذهبي بالتناوب، يُستعمل للأيقونة والشريط فقط
export const COURSE_COLOR: Record<string, string> = {
  M1: "var(--t800)",
  M2: "#C9971C",
  M3: "var(--t700)",
  M4: "#F97316",
  M5: "var(--t800)",
  G1: "#0EA5E9",
  C1: "var(--t700)",
  AI1: "var(--t900)",
  SE1: "#EC4899",
  F1: "var(--t700)",
  L1: "#0EA5A4",
  R1: "var(--t700)",
};

// أسماء مختصرة للمحاور — للشرائح والشارات الصغيرة (بلا أرقام — قرار المستخدم)
export const COURSE_SHORT: Record<string, string> = {
  M1: "نمو الطلاب",
  M2: "المشاعر والذكاء",
  M3: "كيف يتعلمون",
  M4: "التقويم",
  M5: "التدريس",
  G1: "ثقافة تربوية",
  C1: "المهارات",
  AI1: "الذكاء الاصطناعي",
  SE1: "التربية الخاصة",
  F1: "أسس التربية",
  L1: "القيادة المدرسية",
  R1: "السمات والاستدلال",
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

/** يعيد رسم المكوّن حين تصل تفاصيل البنك (أسباب الإجابات) */
export function useQbankDetail(): boolean {
  const [, bump] = useState(0);
  useEffect(() => {
    if (qbankDetailLoaded) return;
    const on = () => bump((n) => n + 1);
    window.addEventListener("qbank-detail", on);
    return () => window.removeEventListener("qbank-detail", on);
  }, []);
  return qbankDetailLoaded;
}
