"use client";

import { create } from "zustand";

export interface QuizConfig {
  mode: "training" | "exam" | "quick" | "review" | "redo";
  label: string;
  qids: string[];
  timeLimitSec?: number;
  conceptId?: string; // لربط المفهوم عند التدريب المباشر منه
}

interface UiState {
  quizConfig: QuizConfig | null;
  pendingConceptId: string | null; // مفهوم مطلوب فتح تفاصيله (من «مفهوم اليوم» في الرئيسية)
  startQuiz: (c: QuizConfig) => void;
  clearQuiz: () => void;
  openConcept: (id: string) => void;
  clearPendingConcept: () => void;
}

export const useUi = create<UiState>((set) => ({
  quizConfig: null,
  pendingConceptId: null,
  startQuiz: (c) => set({ quizConfig: c }),
  clearQuiz: () => set({ quizConfig: null }),
  openConcept: (id) => set({ pendingConceptId: id }),
  clearPendingConcept: () => set({ pendingConceptId: null }),
}));
