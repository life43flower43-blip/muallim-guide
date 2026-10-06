// أنواع بيانات تطبيق تربوي
export type QType = "mcq" | "tf";
export type Difficulty = "سهل" | "متوسط" | "صعب";

export interface QOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  conceptId: string;
  type: QType;
  difficulty: Difficulty;
  question: string;
  options: QOption[];
  correct: string;
  reason: string;
}

export interface Concept {
  id: string;
  courseId: string;
  chapter: string;
  title: string;
  explanation: string;
  example: string;
  /** أمثلة واقعية متعددة (٥ لكل مفهوم) — تُولَّد من ميدان المدرسة وتغطي زوايا مختلفة للمفهوم */
  examples?: string[];
}

export interface Course {
  id: string;
  name: string;
}

// ---------- تقدم المستخدم ----------
export interface Attempt {
  qid: string;
  correct: boolean;
  ts: number; // وقت المحاولة
  box: number; // صندوق ليتم 1-5 للمراجعة المتباعدة
}

export interface SessionRecord {
  id: string;
  mode: "training" | "exam" | "quick" | "review" | "redo" | "scenarios";
  label: string;
  total: number;
  correctCount: number;
  xp: number;
  durationSec: number;
  ts: number;
}

export interface Badge {
  id: string;
  title: string;
  desc: string;
}
