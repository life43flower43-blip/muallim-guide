"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Attempt, SessionRecord, StudentExample } from "./types";
import type { LabAttempt } from "./lab";
import type { LessonPlan } from "./plans";
import type { FieldVisit } from "./field";
import { nextBox } from "./srs";
import { SCENARIOS } from "./scenarios";
import { STUDY_LESSONS } from "./study-school";

export interface ScenarioChoice {
  opt: number; // فهرس الخيار المختار
  ts: number;
}

// ملاحظة الطالب المرتبطة بمفهوم — من ميزة «ملاحظاتي» المستلهمة من مشكلة تدوين المحاضرات
export interface ConceptNote {
  id: string;
  text: string;
  ts: number;
}

// وقفة إلقاء مسجلة في مِسرح الإلقاء — من ميزة «د» في بحث مشاكل الطلبة (خوف التحدث أمام الجمهور)
export interface SpeechRecord {
  ts: number;
  level: number; // مستوى السلم التدريجي: واحد شرح لنفسك، اثنان دقيقة مؤقتة، ثلاثة أسئلة مفاجئة
  durSec: number; // مدة التسجيل بالثواني
  score: number; // متوسط التقييم الذاتي من خمسة
}

interface AppState {
  name: string;
  xp: number;
  weeklyXp: number;
  weekStart: string; // YYYY-MM-DD لأول يوم (الاثنين)
  attempts: Record<string, Attempt>;
  conceptReads: Record<string, number>;
  sessions: SessionRecord[];
  scenarioChoices: Record<string, ScenarioChoice>; // قرارات محاكاة الصف
  reportedQuestions: string[]; // معرفات الأسئلة التي أبلغ عنها المستخدم (نقد البند 11)
  studentExamples: Record<string, StudentExample[]>; // أمثلة مجتمع الطلاب لكل مفهوم
  labAttempts: LabAttempt[]; // سجل محاولات مختبر المعلّم — مواقف وتأملات
  lessonPlans: LessonPlan[]; // خطط الدروس المحفوظة من استوديو خطط الدروس
  fieldVisits: FieldVisit[]; // سجل التدريب الميداني — زيارات المشاهدة والتنفيذ وتأملها
  challengeStats: Record<string, { ok: number; total: number; lastTs: number }>; // إحصاء التحديات الذكية
  notes: Record<string, ConceptNote[]>; // ملاحظاتي المرتبطة بالمفاهيم
  focusCount: number; // عدد جلسات التركيز المكتملة
  speechRecords: SpeechRecord[]; // وقفات الإلقاء المسجلة — مِسرح الإلقاء
  studyDone: Record<string, number>; // دروس مدرسة المذاكرة المكتملة — معرف الدرس إلى زمن إتمامه
  firstdayChecked: string[]; // بنود قائمة اليوم الأول المشطّطة
  onboarded: boolean;
  // وضع العرض — فاتح / يتبع النظام / ليلي (ترقية عن dark المنطقي القديم عبر migrate)
  darkMode: "light" | "auto" | "dark";
  fontScale: "normal" | "large" | "bigger"; // حجم خط القراءة — تفضيل عرض كالوضع الليلي
  haptics: boolean; // الاهتزاز اللطيف عند الإجابة — تفضيل عرض

  setName: (n: string) => void;
  setOnboarded: () => void;
  readConcept: (cid: string) => void;
  recordAttempt: (qid: string, correct: boolean, answer?: string) => void;
  recordScenarioChoice: (sid: string, opt: number) => void;
  finishSession: (s: Omit<SessionRecord, "id" | "ts">) => void;
  reportQuestion: (qid: string) => void;
  addStudentExample: (cid: string, text: string, specialty: string) => void;
  removeStudentExample: (cid: string, id: string) => void;
  addLabAttempt: (a: LabAttempt) => void;
  saveLessonPlan: (p: LessonPlan) => void; // إضافة أو تعديل خطة حسب معرفها
  removeLessonPlan: (id: string) => void;
  addFieldVisit: (v: FieldVisit) => void; // إضافة أو تعديل زيارة ميدانية حسب معرفها
  removeFieldVisit: (id: string) => void;
  addChallengeStat: (id: string, ok: boolean) => void;
  addNote: (cid: string, text: string) => void;
  removeNote: (cid: string, id: string) => void;
  addFocusSession: () => void;
  addSpeechRecord: (r: Omit<SpeechRecord, "ts">) => void;
  addStudyLesson: (lessonId: string) => void;
  toggleFirstday: (itemId: string) => void;
  setDarkMode: (v: "light" | "auto" | "dark") => void;
  setFontScale: (v: "normal" | "large" | "bigger") => void;
  setHaptics: (v: boolean) => void;
  resetAll: () => void;
}

const dayStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const mondayStr = () => {
  const d = new Date();
  const day = d.getDay(); // 0 أحد ... 1 اثنين
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return dayStr(d);
};

export const DAILY_GOAL_XP = 40;

export const xpToday = (sessions: SessionRecord[]) => {
  const today = dayStr();
  return sessions
    .filter((s) => dayStr(new Date(s.ts)) === today)
    .reduce((a, s) => a + s.xp, 0);
};

// ---------- سلسلة الاستمرارية — من بحث مشاكل الطلبة: التسويف وانهيار الدافعية ----------
// السلسلة تُحسب من سجل الجلسات نفسه (بلا حالة منفصلة تُفسد): كل يوم حقق فيه الطالب
// عتبة «يوم التعافي» (نصف الهدف) يمدّ السلسلة — فاليوم الضاغط لا يكسر الالتزام.
export const STREAK_MIN_XP = Math.round(DAILY_GOAL_XP / 2);

export function dayXpOf(sessions: SessionRecord[], day: string): number {
  return sessions
    .filter((s) => dayStr(new Date(s.ts)) === day)
    .reduce((a, s) => a + s.xp, 0);
}

export function currentStreak(sessions: SessionRecord[]): number {
  let streak = 0;
  const d = new Date();
  // إن لم يبلغ اليوم الراهن العتبة بعد، نبدأ العدّ من أمس — يومك ما زال قيد الكتابة
  if (dayXpOf(sessions, dayStr(d)) < STREAK_MIN_XP) d.setDate(d.getDate() - 1);
  for (;;) {
    if (dayXpOf(sessions, dayStr(d)) >= STREAK_MIN_XP) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      name: "",
      xp: 0,
      weeklyXp: 0,
      weekStart: mondayStr(),
      attempts: {},
      conceptReads: {},
      sessions: [],
      scenarioChoices: {},
      reportedQuestions: [],
      studentExamples: {},
      labAttempts: [],
      lessonPlans: [],
      fieldVisits: [],
      challengeStats: {},
      notes: {},
      focusCount: 0,
      speechRecords: [],
      studyDone: {},
      firstdayChecked: [],
      onboarded: false,
      darkMode: "light",
      fontScale: "normal",
      haptics: true,

      setName: (n) => set({ name: n }),
      setOnboarded: () => set({ onboarded: true }),

      readConcept: (cid) =>
        set((st) => ({ conceptReads: { ...st.conceptReads, [cid]: Date.now() } })),

      recordAttempt: (qid, correct, answer) =>
        set((st) => {
          const prev = st.attempts[qid];
          const box = nextBox(prev?.box ?? 0, correct);
          const at: Attempt = { qid, correct, answer, ts: Date.now(), box };
          return { attempts: { ...st.attempts, [qid]: at } };
        }),

      recordScenarioChoice: (sid, opt) =>
        set((st) => ({
          scenarioChoices: { ...st.scenarioChoices, [sid]: { opt, ts: Date.now() } },
        })),

      finishSession: ({ mode, label, total, correctCount, xp, durationSec }) => {
        const st = get();
        const ws = mondayStr();
        const weeklyXp = st.weekStart === ws ? st.weeklyXp + xp : xp;
        const rec: SessionRecord = {
          id: `S${Date.now()}`,
          mode,
          label,
          total,
          correctCount,
          xp,
          durationSec,
          ts: Date.now(),
        };
        set({
          xp: st.xp + xp,
          weeklyXp,
          weekStart: ws,
          sessions: [rec, ...st.sessions].slice(0, 100),
        });
      },

      reportQuestion: (qid) =>
        set((st) => ({
          reportedQuestions: st.reportedQuestions.includes(qid)
            ? st.reportedQuestions
            : [...st.reportedQuestions, qid],
        })),

      // أمثلة مجتمع الطلاب — يضيف الطالب مثالاً من واقع تخصصه فيبقى محفوظًا على جهازه
      addStudentExample: (cid, text, specialty) =>
        set((st) => ({
          studentExamples: {
            ...st.studentExamples,
            [cid]: [
              { id: `SE${Date.now()}`, text, specialty, ts: Date.now() },
              ...(st.studentExamples[cid] ?? []),
            ],
          },
        })),

      removeStudentExample: (cid, id) =>
        set((st) => ({
          studentExamples: {
            ...st.studentExamples,
            [cid]: (st.studentExamples[cid] ?? []).filter((e) => e.id !== id),
          },
        })),

      // مختبر المعلّم — تسجيل محاولة موقف متفرع مع تأملها
      addLabAttempt: (a) => set((st) => ({ labAttempts: [...st.labAttempts, a] })),

      // استوديو خطط الدروس — حفظ أو تحديث خطة حسب معرفها
      saveLessonPlan: (p) =>
        set((st) => ({
          lessonPlans: [
            p,
            ...st.lessonPlans.filter((x) => x.id !== p.id),
          ],
        })),

      removeLessonPlan: (id) =>
        set((st) => ({ lessonPlans: st.lessonPlans.filter((x) => x.id !== id) })),

      // سجل التدريب الميداني — حفظ أو تحديث زيارة حسب معرفها
      addFieldVisit: (v) =>
        set((st) => ({
          fieldVisits: [v, ...st.fieldVisits.filter((x) => x.id !== v.id)],
        })),

      removeFieldVisit: (id) =>
        set((st) => ({ fieldVisits: st.fieldVisits.filter((x) => x.id !== id) })),

      // التحديات الذكية — إحصاء لكل تحدٍّ: النجاحات من إجمالي المحاولات
      addChallengeStat: (id, ok) =>
        set((st) => {
          const prev = st.challengeStats[id] ?? { ok: 0, total: 0, lastTs: 0 };
          return {
            challengeStats: {
              ...st.challengeStats,
              [id]: { ok: prev.ok + (ok ? 1 : 0), total: prev.total + 1, lastTs: Date.now() },
            },
          };
        }),

      // ملاحظاتي — ملاحظة مرتبطة بمفهوم تُحفظ محليًا وتظهر مع مراجعته
      addNote: (cid, text) =>
        set((st) => ({
          notes: {
            ...st.notes,
            [cid]: [{ id: `N${Date.now()}`, text, ts: Date.now() }, ...(st.notes[cid] ?? [])],
          },
        })),

      removeNote: (cid, id) =>
        set((st) => ({
          notes: { ...st.notes, [cid]: (st.notes[cid] ?? []).filter((n) => n.id !== id) },
        })),

      // جلسات التركيز — عدّاد الإنجاز لمؤقت التركيز
      addFocusSession: () => set((st) => ({ focusCount: st.focusCount + 1 })),

      // مِسرح الإلقاء — حفظ وقفة جديدة ويبقى آخر ثلاثين وقفة
      addSpeechRecord: (r) =>
        set((st) => ({
          speechRecords: [{ ...r, ts: Date.now() }, ...st.speechRecords].slice(0, 30),
        })),

      // مدرسة المذاكرة — وسم درسًا مكتملًا (لا يُعاد وسمه)
      addStudyLesson: (lessonId) =>
        set((st) =>
          st.studyDone[lessonId]
            ? {}
            : { studyDone: { ...st.studyDone, [lessonId]: Date.now() } }
        ),

      // قائمة اليوم الأول — شطط بند أو إلغاؤه
      toggleFirstday: (itemId) =>
        set((st) => ({
          firstdayChecked: st.firstdayChecked.includes(itemId)
            ? st.firstdayChecked.filter((x) => x !== itemId)
            : [...st.firstdayChecked, itemId],
        })),

      // وضع العرض وحجم الخط والاهتزاز — تفضيلات عرض لا تُمسّ عند تصفير التقدم
      setDarkMode: (v) => set({ darkMode: v }),
      setFontScale: (v) => set({ fontScale: v }),
      setHaptics: (v) => set({ haptics: v }),

      resetAll: () =>
        set({
          name: "",
          xp: 0,
          weeklyXp: 0,
          weekStart: mondayStr(),
          attempts: {},
          conceptReads: {},
          sessions: [],
          scenarioChoices: {},
          reportedQuestions: [],
          studentExamples: {},
          labAttempts: [],
          lessonPlans: [],
          fieldVisits: [],
          challengeStats: {},
          notes: {},
          focusCount: 0,
          speechRecords: [],
          studyDone: {},
          firstdayChecked: [],
          onboarded: false,
        }),
    }),
    {
      name: "turbawy-app-v1",
      version: 6,
      // ترقية الحالة القديمة: dark المنطقي يصبح darkMode ثلاثيًا، والاهتزاز يُفعّل افتراضيًا، والمختبر يبدأ فارغًا
      migrate: (s, v) => {
        const st = s as Record<string, unknown>;
        let out: Record<string, unknown> = st;
        if (v < 1) {
          out = {
            ...st,
            darkMode:
              st.darkMode === "auto" || st.darkMode === "dark" || st.darkMode === "light"
                ? st.darkMode
                : st.dark
                  ? "dark"
                  : "light",
            haptics: st.haptics === false ? false : true,
          };
        }
        if (v < 2 && !Array.isArray(out.labAttempts)) return { ...out, labAttempts: [] };
        if (v < 3 && !Array.isArray(out.lessonPlans)) return { ...out, lessonPlans: [] };
        if (v < 4 && !Array.isArray(out.fieldVisits)) return { ...out, fieldVisits: [] };
        if (v < 5) {
          return {
            ...out,
            challengeStats: out.challengeStats ?? {},
            notes: out.notes ?? {},
            focusCount: typeof out.focusCount === "number" ? out.focusCount : 0,
          };
        }
        if (v < 6) {
          return {
            ...out,
            speechRecords: Array.isArray(out.speechRecords) ? out.speechRecords : [],
            studyDone: out.studyDone ?? {},
            firstdayChecked: Array.isArray(out.firstdayChecked) ? out.firstdayChecked : [],
          };
        }
        return out;
      },
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ---------- انتظار ترطيب المخزن من التخزين المحلي ----------
// يُستخدم لعرض هيكل skeleton صريح حتى جهوزية البيانات بدل البطاقة الباهتة
export function useAppHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false
  );
}

// ---------- الإنجازات ----------

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string; // اسم أيقونة lucide نعرضها ونربطها في الواجهة
  earned: (st: {
    attempts: Record<string, Attempt>;
    sessions: SessionRecord[];
    conceptReads: Record<string, number>;
    scenarioChoices: Record<string, ScenarioChoice>;
    lessonPlans?: LessonPlan[];
    fieldVisits?: FieldVisit[];
    speechRecords?: SpeechRecord[];
    studyDone?: Record<string, number>;
  }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first",
    title: "الخطوة الأولى",
    desc: "أكمل أول جلسة اختبار",
    icon: "Footprints",
    earned: (s) => s.sessions.length >= 1,
  },
  {
    id: "read5",
    title: "بداية الاطلاع",
    desc: "اطلعت على مجموعة من المفاهيم",
    icon: "BookOpen",
    earned: (s) => Object.keys(s.conceptReads).length >= 5,
  },
  {
    id: "q25",
    title: "مثابر",
    desc: "واصلت التدريب على الأسئلة",
    icon: "Target",
    earned: (s) => Object.keys(s.attempts).length >= 25,
  },
  {
    id: "perfect",
    title: "علامة كاملة",
    desc: "جلسة كاملة بلا خطأ واحدة",
    icon: "Star",
    earned: (s) =>
      s.sessions.some((x) => x.total >= 10 && x.correctCount === x.total),
  },
  {
    id: "allwrong",
    title: "صحّحت أخطائي",
    desc: "أنجز جلسة إعادة أخطاء ولم تخطئ فيها",
    icon: "RotateCcw",
    earned: (s) =>
      s.sessions.some(
        (x) => x.mode === "redo" && x.total >= 5 && x.correctCount === x.total
      ),
  },
  {
    id: "exam",
    title: "محاكاة امتحان مكتملة",
    desc: "أكمل اختبار محاكاة كاملاً",
    icon: "Timer",
    earned: (s) => s.sessions.some((x) => x.mode === "exam"),
  },
  {
    id: "srs10",
    title: "تثبيت في الذاكرة",
    desc: "أسئلة كثيرة استقرت في أعلى صناديق المراجعة",
    icon: "Brain",
    earned: (s) =>
      Object.values(s.attempts).filter((a) => a.box >= 4).length >= 10,
  },
  {
    id: "firstscenario",
    title: "أول قرار صفّي",
    desc: "أكمل أول جولة من محاكاة الصف",
    icon: "MessageSquare",
    earned: (s) => s.sessions.some((x) => x.mode === "scenarios"),
  },
  {
    id: "scenall",
    title: "خبير المواقف التربوية",
    desc: "اتخذ قراراً في كل مواقف الصف المتاحة",
    icon: "MessagesSquare",
    earned: (s) =>
      SCENARIOS.length > 0 &&
      Object.keys(s.scenarioChoices ?? {}).length >= SCENARIOS.length,
  },
  {
    id: "firstplan",
    title: "أول خطة درس",
    desc: "أعددت أول خطة درس في استوديو خطط الدروس",
    icon: "NotebookPen",
    earned: (s) => (s.lessonPlans?.length ?? 0) >= 1,
  },
  {
    id: "firstvisit",
    title: "أول زيارة ميدانية",
    desc: "وثّقت أول زيارة في سجل التدريب الميداني",
    icon: "MapPin",
    earned: (s) => (s.fieldVisits?.length ?? 0) >= 1,
  },
  {
    id: "firstspeech",
    title: "أول وقفة على المسرح",
    desc: "سجلت أول شرح صوتي في مِسرح الإلقاء",
    icon: "Mic",
    earned: (s) => (s.speechRecords?.length ?? 0) >= 1,
  },
  {
    id: "studyschool",
    title: "خريج مدرسة المذاكرة",
    desc: "أكملت دروس مهارات المذاكرة الستة كلها",
    icon: "GraduationCap",
    earned: (s) => Object.keys(s.studyDone ?? {}).length >= STUDY_LESSONS.length,
  },
  {
    id: "proficiency",
    title: "نجمة الكفاءة",
    desc: "نجحت في اختبار الكفاءة الشامل الموقوت",
    icon: "Award",
    earned: (s) =>
      s.sessions.some(
        (x) => x.mode === "proficiency" && x.total > 0 && x.correctCount / x.total >= 0.6
      ),
  },
  {
    id: "peer",
    title: "روح التحدي",
    desc: "أكملت تحدي أقران مشتركًا عبر رابط",
    icon: "Users",
    earned: (s) => s.sessions.some((x) => x.mode === "peer"),
  },
];
