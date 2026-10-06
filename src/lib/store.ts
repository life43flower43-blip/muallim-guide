"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Attempt, SessionRecord } from "./types";
import { nextBox } from "./srs";
import { SCENARIOS } from "./scenarios";
import { gemsForSession, shopItemById } from "./shop";

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
  gems: number; // جواهر المتجر
  ownedItems: Record<string, number>; // قطع المتجر المقتناة: المعرف -> وقت الشراء
  equipped: Record<string, boolean>; // القطع الملبسة على الجنية
  reportedQuestions: string[]; // معرفات الأسئلة التي أبلغ عنها المستخدم (نقد البند 11)
  onboarded: boolean;

  setName: (n: string) => void;
  setOnboarded: () => void;
  readConcept: (cid: string) => void;
  recordAttempt: (qid: string, correct: boolean) => void;
  recordScenarioChoice: (sid: string, opt: number) => void;
  finishSession: (s: Omit<SessionRecord, "id" | "ts">) => void;
  addGems: (n: number) => void;
  buyItem: (id: string) => boolean;
  toggleEquip: (id: string) => void;
  reportQuestion: (qid: string) => void;
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
      gems: 0,
      ownedItems: {},
      equipped: {},
      reportedQuestions: [],
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
          gems: st.gems + gemsForSession(total, correctCount),
        });
      },

      addGems: (n) => set((st) => ({ gems: Math.max(0, st.gems + n) })),

      buyItem: (id) => {
        const item = shopItemById(id);
        if (!item) return false;
        const st = get();
        if (st.ownedItems[id]) return true; // مقتناة سابقاً
        if (st.gems < item.price) return false; // الجواهر لا تكفي
        set({
          gems: st.gems - item.price,
          ownedItems: { ...st.ownedItems, [id]: Date.now() },
          equipped: { ...st.equipped, [id]: true }, // تُلبس تلقائياً عند الشراء
        });
        return true;
      },

      toggleEquip: (id) =>
        set((st) => ({ equipped: { ...st.equipped, [id]: !st.equipped[id] } })),

      reportQuestion: (qid) =>
        set((st) => ({
          reportedQuestions: st.reportedQuestions.includes(qid)
            ? st.reportedQuestions
            : [...st.reportedQuestions, qid],
        })),

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
          gems: 0,
          ownedItems: {},
          equipped: {},
          reportedQuestions: [],
          onboarded: false,
        }),
    }),
    {
      name: "turbawy-app-v1",
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
    xp: number;
    streak: number;
    attempts: Record<string, Attempt>;
    sessions: SessionRecord[];
    conceptReads: Record<string, number>;
    scenarioChoices: Record<string, ScenarioChoice>;
    ownedItems: Record<string, number>;
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
    desc: "اطلع على ٥ مفاهيم",
    icon: "BookOpen",
    earned: (s) => Object.keys(s.conceptReads).length >= 5,
  },
  {
    id: "streak3",
    title: "ثلاثة أيام",
    desc: "سلسلة نشاط ٣ أيام متتالية",
    icon: "Flame",
    earned: (s) => s.streak >= 3,
  },
  {
    id: "q25",
    title: "مثابر",
    desc: "أجب عن ٢٥ سؤالًا",
    icon: "Target",
    earned: (s) => Object.keys(s.attempts).length >= 25,
  },
  {
    id: "perfect",
    title: "علامة كاملة",
    desc: "جلسة بلا خطأ واحدة (١٠ أسئلة فأكثر)",
    icon: "Star",
    earned: (s) =>
      s.sessions.some((x) => x.total >= 10 && x.correctCount === x.total),
  },
  {
    id: "xp500",
    title: "جامع النقاط",
    desc: "اجمع ٥٠٠ نقطة خبرة",
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
    desc: "١٠ أسئلة في الصناديق العليا للمراجعة",
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
    desc: "اجمع ١٥٠٠ نقطة خبرة",
    icon: "Crown",
    earned: (s) => s.xp >= 1500,
  },
  {
    id: "shopfirst",
    title: "صديق الجنية",
    desc: "اشترِ أول قطعة من متجر الجواهر",
    icon: "ShoppingBag",
    earned: (s) => Object.keys(s.ownedItems ?? {}).length >= 1,
  },
];
