"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  LEVELS,
  BADGES,
  CONCEPTS,
  XP_CORRECT,
  XP_RETRY_CORRECT,
  XP_QUIZ_DONE,
  XP_SCENARIO_BEST,
  XP_SCENARIO_OK,
  XP_PLAN_STEP,
  todayKey,
  yesterdayKey,
} from "./content";

export interface ConceptStat {
  asked: number;
  wrong: number;
  lastWrongAt?: number;
}

export interface QuizResultRecord {
  id: string;
  at: number;
  score: number;
  total: number;
  category: string;
}

interface AppState {
  xp: number;
  dailyXp: number;
  dailyDate: string;
  answered: number;
  correct: number;
  streakDays: number;
  lastActiveDate: string | null;
  exploredConcepts: string[];
  conceptStats: Record<string, ConceptStat>;
  errorBox: Record<string, number>;
  quizHistory: QuizResultRecord[];
  badges: string[];
  scenariosDone: string[];
  scenariosBest: string[];
  planDone: string[];
  onboarded: boolean;

  // actions
  touchStreak: () => void;
  addXp: (amount: number) => void;
  recordAnswer: (questionId: string, conceptId: string, isCorrect: boolean, wasRetry?: boolean) => void;
  markExplored: (conceptId: string) => void;
  recordQuizDone: (category: string, score: number, total: number, idPrefix?: string) => void;
  recordScenario: (scenarioId: string, best: boolean) => void;
  togglePlanStep: (stepId: string) => void;
  completeOnboarding: () => void;
  clearError: (questionId: string) => void;
  resetAll: () => void;
}

const DAILY_GOAL = 60;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const awardBadge = (id: string) => {
        const s = get();
        if (s.badges.includes(id)) return;
        set({ badges: [...s.badges, id] });
      };

      return {
        xp: 0,
        dailyXp: 0,
        dailyDate: todayKey(),
        answered: 0,
        correct: 0,
        streakDays: 0,
        lastActiveDate: null,
        exploredConcepts: [],
        conceptStats: {},
        errorBox: {},
        quizHistory: [],
        badges: [],
        scenariosDone: [],
        scenariosBest: [],
        planDone: [],
        onboarded: false,

        touchStreak: () => {
          const s = get();
          const today = todayKey();
          if (s.lastActiveDate === today) return;
          const cont = s.lastActiveDate === yesterdayKey();
          const streak = cont ? s.streakDays + 1 : 1;
          set({ lastActiveDate: today, streakDays: streak, dailyDate: today, dailyXp: 0 });
          if (streak >= 3) awardBadge("streak3");
          if (streak >= 7) awardBadge("streak7");
        },

        addXp: (amount) => {
          const s = get();
          const today = todayKey();
          const daily = s.dailyDate === today ? s.dailyXp + amount : amount;
          const prevLevel = LEVELS.filter((l) => s.xp >= l.xp).length;
          const nextXp = s.xp + amount;
          const nextLevel = LEVELS.filter((l) => nextXp >= l.xp).length;
          set({ xp: nextXp, dailyDate: today, dailyXp: daily });
          if (nextLevel > prevLevel) {
            setTimeout(() => {
              useAppStore.setState({});
            }, 0);
          }
        },

        recordAnswer: (questionId, conceptId, isCorrect, wasRetry) => {
          const s = get();
          const stats = { ...s.conceptStats };
          const cur = stats[conceptId] ?? { asked: 0, wrong: 0 };
          stats[conceptId] = {
            asked: cur.asked + 1,
            wrong: cur.wrong + (isCorrect ? 0 : 1),
            lastWrongAt: isCorrect ? cur.lastWrongAt : Date.now(),
          };

          const errorBox = { ...s.errorBox };
          if (!isCorrect) {
            errorBox[questionId] = (errorBox[questionId] ?? 0) + 1;
          } else if (wasRetry && errorBox[questionId]) {
            delete errorBox[questionId];
          }

          const xpGain = isCorrect ? (wasRetry ? XP_RETRY_CORRECT : XP_CORRECT) : 0;
          const answered = s.answered + 1;
          const correct = s.correct + (isCorrect ? 1 : 0);

          set({
            conceptStats: stats,
            errorBox,
            answered,
            correct,
          });
          if (xpGain > 0) get().addXp(xpGain);
          get().touchStreak();

          if (correct >= 10) awardBadge("ten_correct");
          if (correct >= 50) awardBadge("fifty_correct");
        },

        markExplored: (conceptId) => {
          const s = get();
          if (s.exploredConcepts.includes(conceptId)) return;
          const next = [...s.exploredConcepts, conceptId];
          set({ exploredConcepts: next });
          get().touchStreak();
          get().addXp(2);
          if (next.length >= 10) awardBadge("concept_reader");
          if (next.length >= CONCEPTS.length) awardBadge("all_concepts");
        },

        recordQuizDone: (category, score, total, idPrefix) => {
          const s = get();
          const rec: QuizResultRecord = {
            id: `${idPrefix ?? "quiz"}-${Date.now()}`,
            at: Date.now(),
            score,
            total,
            category,
          };
          set({ quizHistory: [rec, ...s.quizHistory].slice(0, 30) });
          get().addXp(XP_QUIZ_DONE);
          get().touchStreak();
          awardBadge("first_quiz");
          if (score === total && total > 0) awardBadge("perfect_quiz");
        },

        recordScenario: (scenarioId, best) => {
          const s = get();
          const done = s.scenariosDone.includes(scenarioId)
            ? s.scenariosDone
            : [...s.scenariosDone, scenarioId];
          const bestArr = best && !s.scenariosBest.includes(scenarioId)
            ? [...s.scenariosBest, scenarioId]
            : s.scenariosBest;
          set({ scenariosDone: done, scenariosBest: bestArr });
          get().addXp(best ? XP_SCENARIO_BEST : XP_SCENARIO_OK);
          get().touchStreak();
          awardBadge("first_scenario");
          if (bestArr.length >= 5) awardBadge("scenario_master");
        },

        togglePlanStep: (stepId) => {
          const s = get();
          const done = s.planDone.includes(stepId)
            ? s.planDone.filter((x) => x !== stepId)
            : [...s.planDone, stepId];
          set({ planDone: done });
          if (done.length > s.planDone.length) {
            get().addXp(XP_PLAN_STEP);
            get().touchStreak();
          }
          if (done.length >= 6) awardBadge("plan_done");
        },

        completeOnboarding: () => set({ onboarded: true }),

        clearError: (questionId) => {
          const s = get();
          const errorBox = { ...s.errorBox };
          delete errorBox[questionId];
          set({ errorBox });
        },

        resetAll: () =>
          set({
            xp: 0,
            dailyXp: 0,
            dailyDate: todayKey(),
            answered: 0,
            correct: 0,
            streakDays: 0,
            lastActiveDate: null,
            exploredConcepts: [],
            conceptStats: {},
            errorBox: {},
            quizHistory: [],
            badges: [],
            scenariosDone: [],
            scenariosBest: [],
            planDone: [],
            onboarded: true,
          }),
      };
    },
    {
      name: "tarbawi-app-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const DAILY_GOAL_XP = DAILY_GOAL;

export function levelInfo(xp: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) idx = i;
  }
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((xp - level.xp) / (next.xp - level.xp)) * 100))
    : 100;
  return { level, next, progress, levelIndex: idx };
}

export function conceptMastery(stat?: ConceptStat): number {
  if (!stat || stat.asked === 0) return 0;
  return Math.max(0, Math.round((1 - stat.wrong / stat.asked) * 100));
}

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));
