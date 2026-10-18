"use client";

// محاكي الرخصة والمسابقات — بلاتنات محاكاة بأقسام ووقت ومحك نجاح
// + سجل محاولات محفوظ محليًا + منطق اختبار تحديد المستوى
import { COURSES, QUESTIONS, conceptById, shuffle } from "./qbank";

// ---------- بلاتنات المحاكاة ----------
export interface ExamSection {
  courseId: string;
  quota: number; // حصة القسم من أسئلة الاختبار
}

export interface ExamBlueprint {
  id: string;
  name: string;
  desc: string;
  total: number;
  minutes: number;
  passPct: number; // محك النجاح
  sections: ExamSection[];
  color: string;
}

// التوزيع: التربوي العام على المحاور الأساسية، والتخصصي على المناهج، والشامل على كل شيء
export const BLUEPRINTS: ExamBlueprint[] = [
  {
    id: "license",
    name: "اختبار التربوي العام",
    desc: "محاكاة القسم التربوي العام في اختبارات الرخصة المهنية والتوظيف — أسئلة النمو والنفس والتعلم والتقويم",
    total: 50,
    minutes: 50,
    passPct: 60,
    sections: [
      { courseId: "M1", quota: 13 },
      { courseId: "M2", quota: 12 },
      { courseId: "M3", quota: 13 },
      { courseId: "M4", quota: 12 },
    ],
    color: "#0E7C86",
  },
  {
    id: "specialty",
    name: "اختبار التخصص — التدريس",
    desc: "محاكاة القسم التخصصي: مناهج وطرق التدريس داخل الصف، وأسئلة التخطيط والتنفيذ والتقويم الصفي",
    total: 30,
    minutes: 30,
    passPct: 60,
    sections: [{ courseId: "M5", quota: 30 }],
    color: "#B45309",
  },
  {
    id: "cadre",
    name: "مسابقة الكادر الشاملة",
    desc: "محاكاة مسابقات الوظائف التعليمية — أسئلة من المحاور كلها مع المهارات والثقافة التربوية",
    total: 100,
    minutes: 90,
    passPct: 60,
    sections: [
      { courseId: "M1", quota: 12 },
      { courseId: "M2", quota: 11 },
      { courseId: "M3", quota: 13 },
      { courseId: "M4", quota: 11 },
      { courseId: "M5", quota: 15 },
      { courseId: "G1", quota: 12 },
      { courseId: "C1", quota: 8 },
      { courseId: "F1", quota: 10 },
      { courseId: "SE1", quota: 8 },
    ],
    color: "#0B6870",
  },
];

export interface ExamItem {
  qid: string;
  courseId: string;
}

/** بناء مجموعة الاختبار: حصة كل قسم بحسب البلاتنة مع خلط داخلي ثم خلط كلي */
export function buildExamSet(bp: ExamBlueprint): ExamItem[] {
  const items: ExamItem[] = [];
  for (const sec of bp.sections) {
    const pool = QUESTIONS.filter((q) => {
      const c = conceptById(q.conceptId);
      return c?.courseId === sec.courseId;
    });
    const picked = shuffle(pool).slice(0, sec.quota);
    for (const q of picked) items.push({ qid: q.id, courseId: sec.courseId });
  }
  return shuffle(items);
}

// ---------- سجل المحاولات — تخزين محلي مستقل ----------
export interface ExamRun {
  id: string;
  bpId: string;
  bpName: string;
  scorePct: number;
  passed: boolean;
  correctCount: number;
  total: number;
  sections: { label: string; courseId: string; correct: number; total: number }[];
  wrongQids: string[];
  durationSec: number;
  ts: number;
}

const RUNS_KEY = "trb-exam-runs";

export function loadExamRuns(): ExamRun[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveExamRun(run: ExamRun): ExamRun[] {
  const runs = [run, ...loadExamRuns()].slice(0, 12);
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  } catch {}
  return runs;
}

export function clearExamRuns() {
  try {
    localStorage.removeItem(RUNS_KEY);
  } catch {}
}

// ---------- اختبار تحديد المستوى ----------
export interface PlacementResult {
  correctCount: number;
  total: number;
  level: "seed" | "growing" | "ready";
  strong: { courseId: string; correct: number; total: number }[];
  weak: { courseId: string; correct: number; total: number }[];
  perCourse: { courseId: string; correct: number; total: number }[];
}

/** اثنا عشر سؤالًا: سؤالان من كل محور بمزيج صعوبات */
export function buildPlacementSet(): ExamItem[] {
  const items: ExamItem[] = [];
  for (const course of COURSES) {
    const pool = QUESTIONS.filter((q) => conceptById(q.conceptId)?.courseId === course.id);
    // سؤال متوسط وسؤال صعب — يقيسان الفهم والعمق معًا
    const mid = shuffle(pool.filter((q) => q.difficulty === "متوسط")).slice(0, 1);
    const hard = shuffle(pool.filter((q) => q.difficulty === "صعب")).slice(0, 1);
    const rest = shuffle(pool.filter((q) => q.difficulty === "سهل")).slice(0, 2);
    const picked = [...mid, ...hard, ...rest].slice(0, 2);
    for (const q of picked) items.push({ qid: q.id, courseId: course.id });
  }
  return shuffle(items);
}

/** تقويم نتائج التحديد: مستوى ثلاثي + أقوى محورين + أضعف محورين */
export function evaluatePlacement(
  items: ExamItem[],
  answers: Record<string, boolean>
): PlacementResult {
  const perCourse = new Map<string, { correct: number; total: number }>();
  let correctCount = 0;
  for (const it of items) {
    const row = perCourse.get(it.courseId) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (answers[it.qid]) {
      row.correct += 1;
      correctCount += 1;
    }
    perCourse.set(it.courseId, row);
  }
  const list = Array.from(perCourse.entries())
    .map(([courseId, r]) => ({ courseId, ...r }))
    .sort((a, b) => b.correct / b.total - a.correct / a.total);

  const total = items.length;
  const pct = correctCount / total;
  const level = pct >= 0.75 ? "ready" : pct >= 0.4 ? "growing" : "seed";
  return {
    correctCount,
    total,
    level,
    strong: list.slice(0, 2),
    weak: list.slice(-2).reverse(),
    perCourse: list,
  };
}

export const PLACEMENT_LEVELS: Record<
  PlacementResult["level"],
  { title: string; desc: string; color: string }
> = {
  seed: {
    title: "بادئ في المسار",
    desc: "أنت في بداية الطريق — أساسك التربوي يحتاج بناءً من دليل المعلم قبل خوض المحاكاة الصارمة",
    color: "#B45309",
  },
  growing: {
    title: "نامٍ ومتقدم",
    desc: "أساسك موجود وتتوزع فجواتك في محاور بعينها — التركيز عليها سيرفعك سريعًا",
    color: "#0E7C86",
  },
  ready: {
    title: "جاهز للاحتراف",
    desc: "مستواك القاعدي ممتاز — انقل جهدك إلى المحاكاة الموقوتة ودفتر الأخطاء لصقل الأداء تحت الضغط",
    color: "#0B6870",
  },
};
