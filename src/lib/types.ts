export type CategoryId =
  | "foundations"
  | "reinforcement"
  | "curb"
  | "building"
  | "classroom";

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  color: string; // hex
  soft: string; // soft bg hex
  description: string;
}

export interface Concept {
  id: string;
  title: string;
  en: string;
  category: CategoryId;
  definition: string;
  simple: string;
  example: string;
  keys: string[];
  mistake?: string;
  related: string[];
  icon: string;
}

export interface QuizQuestion {
  id: string;
  conceptId: string;
  category: CategoryId;
  difficulty: 1 | 2 | 3;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  /** تحليل الخطأ لكل خيار خاطئ: لماذا يختاره الطلاب عادةً وما الوهم خلفه */
  guidance: Record<number, string>;
}

export type ScenarioVerdict = "best" | "ok" | "bad";

export interface ScenarioOption {
  text: string;
  verdict: ScenarioVerdict;
  feedback: string;
  conceptId?: string;
}

export interface Scenario {
  id: string;
  title: string;
  stage: string;
  context: string;
  question: string;
  options: ScenarioOption[];
}

export interface PlanStep {
  id: string;
  title: string;
  goal: string;
  content: string;
  bullets: string[];
  checklist: string[];
  example?: string;
}

export interface LevelDef {
  xp: number;
  title: string;
  icon: string;
}

export interface BadgeDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
}
