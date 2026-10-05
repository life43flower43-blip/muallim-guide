"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Attempt, SessionRecord } from "./types";
import { nextBox } from "./srs";
import { SCENARIOS } from "./scenarios";

export interface ScenarioChoice {
  opt: number; // فهرس الخيار المختار
  ts: number;
}

interface AppState {
  name: string;
  xp: number;
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
  weeklyXp: number;
  weekStart: string; // YYYY-MM-DD لأول يوم (الاثنين)
  attempts: Record<string, Attempt>;
  conceptReads: Record<string, number>;
  sessions: SessionRecord[];
  scenarioChoices: Record<string, ScenarioChoice>; // قرارات محاكاة الصف
  onboarded: boolean;

  setName: (n: string) => void;
  setOnboarded: () => void;
  readConcept: (cid: string) => void;
  recordAttempt: (qid: string, correct: boolean) => void;
  recordScenarioChoice: (sid: string, opt: number) => void;
  finishSession: (s: Omit<SessionRecord, "id" | "ts">) => void;
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
      streak: 0,
      lastActiveDay: "",
      weeklyXp: 0,
      weekStart: mondayStr(),
      attempts: {},
      conceptReads: {},
      sessions: [],
      scenarioChoices: {},
      onboarded: false,

      setName: (n) => set({ name: n }),
      setOnboarded: () => set({ onboarded: true }),

      readConcept: (cid) =>
        set((st) => ({ conceptReads: { ...st.conceptReads, [cid]: Date.now() } })),

      recordAttempt: (qid, correct) =>
        set((st) => {
          const prev = st.attempts[qid];
          const box = nextBox(prev?.box ?? 0, correct);
          const at: Attempt = { qid, correct, ts: Date.now(), box };
          return { attempts: { ...st.attempts, [qid]: at } };
        }),

      recordScenarioChoice: (sid, opt) =>
        set((st) => ({
          scenarioChoices: { ...st.scenarioChoices, [sid]: { opt, ts: Date.now() } },
        })),

      finishSession: ({ mode, label, total, correctCount, xp, durationSec }) => {
        const st = get();
        const today = dayStr();
        let streak = st.streak;
        if (st.lastActiveDay !== today) {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          streak = st.lastActiveDay === dayStr(y) ? st.streak + 1 : 1;
        }
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
          streak,
          lastActiveDay: today,
          sessions: [rec, ...st.sessions].slice(0, 100),
        });
      },

      resetAll: () =>
        set({
          name: "",
          xp: 0,
          streak: 0,
          lastActiveDay: "",
          weeklyXp: 0,
          weekStart: mondayStr(),
          attempts: {},
          conceptReads: {},
          sessions: [],
          scenarioChoices: {},
          onboarded: false,
        }),
    }),
    {
      name: "turbawy-app-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ---------- الإنجازات ----------

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string; // اسم أيقونة lucide نعرضها ونربطها في الواجهة
  earned: (st: {
    xp: number;
    streak: number;
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
    title: "قارئ النوادر",
    desc: "اطلع على 5 مفاهيم",
    icon: "BookOpen",
    earned: (s) => Object.keys(s.conceptReads).length >= 5,
  },
  {
    id: "streak3",
    title: "ثلاثة أيام",
    desc: "سلسلة نشاط 3 أيام متتالية",
    icon: "Flame",
    earned: (s) => s.streak >= 3,
  },
  {
    id: "q25",
    title: "مثابر",
    desc: "أجب عن 25 سؤالاً",
    icon: "Target",
    earned: (s) => Object.keys(s.attempts).length >= 25,
  },
  {
    id: "perfect",
    title: "علامة كاملة",
    desc: "جلسة بلا خطأ واحدة (10 أسئلة فأكثر)",
    icon: "Star",
    earned: (s) =>
      s.sessions.some((x) => x.total >= 10 && x.correctCount === x.total),
  },
  {
    id: "xp500",
    title: "جامع النقاط",
    desc: "اجمع 500 نقطة خبرة",
    icon: "Zap",
    earned: (s) => s.xp >= 500,
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
    title: "عابر الامتحان",
    desc: "أكمل اختبار محاكاة كاملاً",
    icon: "Timer",
    earned: (s) => s.sessions.some((x) => x.mode === "exam"),
  },
  {
    id: "srs10",
    title: "ذاكرة حديدية",
    desc: "10 أسئلة في الصناديق العليا للمراجعة",
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
    id: "xp1500",
    title: "أسطورة تربوي",
    desc: "اجمع 1500 نقطة خبرة",
    icon: "Crown",
    earned: (s) => s.xp >= 1500,
  },
];
