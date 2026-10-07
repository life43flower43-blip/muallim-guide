"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Attempt, SessionRecord, StudentExample } from "./types";
import { nextBox } from "./srs";
import { SCENARIOS } from "./scenarios";

export interface ScenarioChoice {
  opt: number; // فهرس الخيار المختار
  ts: number;
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
          onboarded: false,
        }),
    }),
    {
      name: "turbawy-app-v1",
      version: 1,
      // ترقية الحالة القديمة: dark المنطقي يصبح darkMode ثلاثيًا، والاهتزاز يُفعّل افتراضيًا
      migrate: (s, v) => {
        const st = s as Record<string, unknown>;
        if (v < 1) {
          return {
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
        return s;
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
];
