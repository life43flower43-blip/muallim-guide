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
  pendingCourseId: string | null; // محور مطلوب فتحه في المفاهيم (عوالم «الأساس» و«أعرف»)
  scenariosOpen: boolean; // شاشة محاكاة الصف الدراسي
  startQuiz: (c: QuizConfig) => void;
  clearQuiz: () => void;
  openConcept: (id: string) => void;
  clearPendingConcept: () => void;
  openCourseTab: (id: string) => void;
  clearPendingCourse: () => void;
  startScenarios: () => void;
  clearScenarios: () => void;
}

export const useUi = create<UiState>((set) => ({
  quizConfig: null,
  pendingConceptId: null,
  pendingCourseId: null,
  scenariosOpen: false,
  startQuiz: (c) => set({ quizConfig: c }),
  clearQuiz: () => set({ quizConfig: null }),
  openConcept: (id) => set({ pendingConceptId: id }),
  clearPendingConcept: () => set({ pendingConceptId: null }),
  openCourseTab: (id) => set({ pendingCourseId: id }),
  clearPendingCourse: () => set({ pendingCourseId: null }),
  startScenarios: () => set({ scenariosOpen: true }),
  clearScenarios: () => set({ scenariosOpen: false }),
}));
