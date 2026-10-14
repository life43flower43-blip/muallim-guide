"use client";

import { create } from "zustand";
import type { PeerPayload } from "./peer";

export interface QuizConfig {
  mode: "training" | "exam" | "quick" | "review" | "redo" | "intensive" | "proficiency";
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
  simOpen: boolean; // مختبر محاكاة الصفوف — الجيل الجديد: مواقف متفرعة وكفاءات متعددة وتوصيات
  challengesOpen: boolean; // التحديات الذكية — ترتيب وإكمال وإنتاج كتابي
  studioOpen: boolean; // استوديو خطط الدروس — نموذج موجّه وتقييم الخطة وخططي
  fieldOpen: boolean; // سجل التدريب الميداني — جاهزية وزيارات وتأملها
  stageOpen: boolean; // مِسرح الإلقاء — شرح صوتي موقوت وتقييم ذاتي
  studyOpen: boolean; // مدرسة المذاكرة — ستة دروس تفاعلية في مهارات الدراسة
  measureOpen: boolean; // معدة القياس والتقويم — حاسبات إحصائية تربوية
  heartOpen: boolean; // قلب الصف — سلّم المشاعر التربوي وشرارة المبدع (دليل المعلم)
  peerOpen: boolean; // تحدّي الأقران — رابط يحمل التحدي بلا سيرفر
  peerIncoming: PeerPayload | null; // تحدٍّ وصل عبر رابط مفتوح — يُلتقط من معرف الرابط
  examsimOpen: boolean; // محاكي الرخصة والمسابقات — بلاتنات موقوتة بأقسام ومحك
  placementOpen: boolean; // اختبار تحديد المستوى — تشخيص ثلاثي المستويات
  matchOpen: boolean; // لعبة المطابقة — مصطلح مقابل شرحه المصغّر
  speedOpen: boolean; // سباق السرعة — مؤقت لكل سؤال وكونبو
  flashOpen: boolean; // بطاقات المفاهيم — وضع بطاقات القلب
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
  startSim: () => void;
  clearSim: () => void;
  startChallenges: () => void;
  clearChallenges: () => void;
  startStudio: () => void;
  clearStudio: () => void;
  startField: () => void;
  clearField: () => void;
  startStage: () => void;
  clearStage: () => void;
  startStudy: () => void;
  clearStudy: () => void;
  startMeasure: () => void;
  clearMeasure: () => void;
  startHeart: () => void;
  clearHeart: () => void;
  startPeer: () => void;
  clearPeer: () => void;
  setPeerIncoming: (p: PeerPayload | null) => void;
  startExamsim: () => void;
  clearExamsim: () => void;
  startPlacement: () => void;
  clearPlacement: () => void;
  startMatch: () => void;
  clearMatch: () => void;
  startSpeed: () => void;
  clearSpeed: () => void;
  startFlash: () => void;
  clearFlash: () => void;
}

export const useUi = create<UiState>((set) => ({
  quizConfig: null,
  pendingConceptId: null,
  pendingCourseId: null,
  scenariosOpen: false,
  labOpen: false,
  simOpen: false,
  challengesOpen: false,
  studioOpen: false,
  fieldOpen: false,
  stageOpen: false,
  studyOpen: false,
  measureOpen: false,
  heartOpen: false,
  peerOpen: false,
  peerIncoming: null,
  examsimOpen: false,
  placementOpen: false,
  matchOpen: false,
  speedOpen: false,
  flashOpen: false,
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
  startSim: () => set({ simOpen: true }),
  clearSim: () => set({ simOpen: false }),
  startChallenges: () => set({ challengesOpen: true }),
  clearChallenges: () => set({ challengesOpen: false }),
  startStudio: () => set({ studioOpen: true }),
  clearStudio: () => set({ studioOpen: false }),
  startField: () => set({ fieldOpen: true }),
  clearField: () => set({ fieldOpen: false }),
  startStage: () => set({ stageOpen: true }),
  clearStage: () => set({ stageOpen: false }),
  startStudy: () => set({ studyOpen: true }),
  clearStudy: () => set({ studyOpen: false }),
  startMeasure: () => set({ measureOpen: true }),
  clearMeasure: () => set({ measureOpen: false }),
  startHeart: () => set({ heartOpen: true }),
  clearHeart: () => set({ heartOpen: false }),
  startPeer: () => set({ peerOpen: true }),
  clearPeer: () => set({ peerOpen: false }),
  setPeerIncoming: (p) => set({ peerIncoming: p }),
  startExamsim: () => set({ examsimOpen: true }),
  clearExamsim: () => set({ examsimOpen: false }),
  startPlacement: () => set({ placementOpen: true }),
  clearPlacement: () => set({ placementOpen: false }),
  startMatch: () => set({ matchOpen: true }),
  clearMatch: () => set({ matchOpen: false }),
  startSpeed: () => set({ speedOpen: true }),
  clearSpeed: () => set({ speedOpen: false }),
  startFlash: () => set({ flashOpen: true }),
  clearFlash: () => set({ flashOpen: false }),
}));
