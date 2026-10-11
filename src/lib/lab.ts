// مختبر المعلّم — تجميع المواقف وأدوات اشتقاق حالة الكفاءة من الأدلة
import { LAB_SCENARIOS_A, LAB_SKILLS, type LabScenario, type LabRating } from "./lab-scenarios-a";
import { LAB_SCENARIOS_B } from "./lab-scenarios-b";

export type { LabScenario, LabRating, LabNode, LabOption } from "./lab-scenarios-a";
export { LAB_SKILLS } from "./lab-scenarios-a";

export const LAB_SCENARIOS: LabScenario[] = [...LAB_SCENARIOS_A, ...LAB_SCENARIOS_B];

export const labScenarioById = new Map(LAB_SCENARIOS.map((s) => [s.id, s]));

export const RATING_WORD: Record<LabRating, string> = {
  good: "قرار حاسم",
  ok: "قرار مقبول",
  poor: "قرار يحتاج إعادة نظر",
};

// سجل محاولة داخل المختبر — يُخزَّن مع بقية بيانات المعلم
export interface LabStep {
  node: string;
  choice: string;
  rating: LabRating;
  outcome: string;
}

export interface LabReflection {
  success: string;
  failed: string;
  change: string;
}

export interface LabAttempt {
  sid: string; // معرف الموقف
  ts: number;
  steps: LabStep[];
  reflection: LabReflection;
}

export type LabStatus = "none" | "weak" | "improving" | "strong";

export const STATUS_WORD: Record<LabStatus, string> = {
  none: "لم تبدأ بعد",
  weak: "تحتاج تدريباً",
  improving: "في تحسّن",
  strong: "متقنة",
};

export interface LabSkillReport {
  skill: string;
  status: LabStatus;
  evidence: string[]; // أدلة نوعية من المحاولات — بلا أرقام
  scenarioIds: string[]; // مواقف هذه الكفاءة
}

const rank: Record<LabRating, number> = { poor: 0, ok: 1, good: 2 };

export function skillReports(attempts: LabAttempt[]): LabSkillReport[] {
  return LAB_SKILLS.map((skill) => {
    const rel = attempts.filter((a) => labScenarioById.get(a.sid)?.skill === skill);
    if (!rel.length) return { skill, status: "none" as LabStatus, evidence: [], scenarioIds: LAB_SCENARIOS.filter((s) => s.skill === skill).map((s) => s.id) };
    // آخر محاولة لكل موقف — التحسن يُقاس بأحدث الأدلة
    const latestBySid = new Map<string, LabAttempt>();
    for (const a of rel.sort((x, y) => x.ts - y.ts)) latestBySid.set(a.sid, a);
    const latest = [...latestBySid.values()];
    const scores = latest.flatMap((a) => a.steps.map((s) => rank[s.rating]));
    const min = Math.min(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    let status: LabStatus;
    if (avg >= 2) status = "strong";
    else if (min <= 0 || avg < 1) status = "weak";
    else status = "improving";
    // أدلة نوعية: من أحدث محاولة — القرارات التي اتخذها
    const last = latest[latest.length - 1];
    const title = labScenarioById.get(last.sid)?.title ?? "";
    const evidence = last.steps.slice(0, 3).map((s) => `في «${title}»: ${s.choice} — ${RATING_WORD[s.rating]}`);
    return { skill, status, evidence, scenarioIds: LAB_SCENARIOS.filter((s) => s.skill === skill).map((s) => s.id) };
  });
}

export const labStatusColor: Record<LabStatus, string> = {
  none: "bg-muted text-muted-foreground",
  weak: "bg-red-50 text-red-700 border border-red-200",
  improving: "bg-amber-50 text-amber-700 border border-amber-200",
  strong: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};
