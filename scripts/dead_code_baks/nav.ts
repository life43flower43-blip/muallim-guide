"use client";

import { create } from "zustand";
import type { CategoryId } from "./types";

export type Tab = "home" | "concepts" | "quiz" | "practice" | "progress";

export interface QuizConfig {
  category: CategoryId | "all";
  count: number;
  mode: "normal" | "review" | "concept";
  conceptId?: string;
  title?: string;
}

interface NavState {
  tab: Tab;
  conceptId: string | null;
  quiz: QuizConfig | null;
  scenarioId: string | null;
  planOpen: boolean;
  reviewOpen: boolean;
  setTab: (t: Tab) => void;
  openConcept: (id: string) => void;
  closeConcept: () => void;
  startQuiz: (cfg: QuizConfig) => void;
  endQuiz: () => void;
  openScenario: (id: string) => void;
  closeScenario: () => void;
  openPlan: () => void;
  closePlan: () => void;
  openReview: () => void;
  closeReview: () => void;
}

export const useNav = create<NavState>((set) => ({
  tab: "home",
  conceptId: null,
  quiz: null,
  scenarioId: null,
  planOpen: false,
  reviewOpen: false,
  setTab: (tab) => set({ tab }),
  openConcept: (conceptId) => set({ conceptId }),
  closeConcept: () => set({ conceptId: null }),
  startQuiz: (quiz) => set({ quiz }),
  endQuiz: () => set({ quiz: null }),
  openScenario: (scenarioId) => set({ scenarioId }),
  closeScenario: () => set({ scenarioId: null }),
  openPlan: () => set({ planOpen: true }),
  closePlan: () => set({ planOpen: false }),
  openReview: () => set({ reviewOpen: true }),
  closeReview: () => set({ reviewOpen: false }),
}));
