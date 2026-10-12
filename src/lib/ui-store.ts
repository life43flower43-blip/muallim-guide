"use client";

import { create } from "zustand";

export interface QuizConfig {
  mode: "training" | "exam" | "quick" | "review" | "redo" | "intensive";
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
  labOpen: boolean; // مختبر المعلّم — مواقف متفرعة وخريطة كفاءات ومرآة
  challengesOpen: boolean; // التحديات الذكية — ترتيب وإكمال وإنتاج كتابي
  studioOpen: boolean; // استوديو خطط الدروس — نموذج موجّه وتقييم الخطة وخططي
  fieldOpen: boolean; // سجل التدريب الميداني — جاهزية وزيارات وتأملها
  startQuiz: (c: QuizConfig) => void;
  clearQuiz: () => void;
  openConcept: (id: string) => void;
  clearPendingConcept: () => void;
  openCourseTab: (id: string) => void;
  clearPendingCourse: () => void;
  startScenarios: () => void;
  clearScenarios: () => void;
  startLab: () => void;
  clearLab: () => void;
  startChallenges: () => void;
  clearChallenges: () => void;
  startStudio: () => void;
  clearStudio: () => void;
  startField: () => void;
  clearField: () => void;
}

export const useUi = create<UiState>((set) => ({
  quizConfig: null,
  pendingConceptId: null,
  pendingCourseId: null,
  scenariosOpen: false,
  labOpen: false,
  challengesOpen: false,
  studioOpen: false,
  fieldOpen: false,
  startQuiz: (c) => set({ quizConfig: c }),
  clearQuiz: () => set({ quizConfig: null }),
  openConcept: (id) => set({ pendingConceptId: id }),
  clearPendingConcept: () => set({ pendingConceptId: null }),
  openCourseTab: (id) => set({ pendingCourseId: id }),
  clearPendingCourse: () => set({ pendingCourseId: null }),
  startScenarios: () => set({ scenariosOpen: true }),
  clearScenarios: () => set({ scenariosOpen: false }),
  startLab: () => set({ labOpen: true }),
  clearLab: () => set({ labOpen: false }),
  startChallenges: () => set({ challengesOpen: true }),
  clearChallenges: () => set({ challengesOpen: false }),
  startStudio: () => set({ studioOpen: true }),
  clearStudio: () => set({ studioOpen: false }),
  startField: () => set({ fieldOpen: true }),
  clearField: () => set({ fieldOpen: false }),
}));
