// مختبر المعلّم — تجميع المواقف (تدريبية واختبار استقلال) وأدوات اشتقاق حالة الكفاءة من الأدلة
import { LAB_SCENARIOS_A, LAB_SKILLS, type LabScenario, type LabRating } from "./lab-scenarios-a";
import { LAB_SCENARIOS_B } from "./lab-scenarios-b";
import { LAB_EXAM_SCENARIOS as EXAM_SCENARIOS } from "./lab-exam";

export type { LabScenario, LabRating, LabNode, LabOption } from "./lab-scenarios-a";
export { LAB_SKILLS } from "./lab-scenarios-a";

export const LAB_SCENARIOS: LabScenario[] = [...LAB_SCENARIOS_A, ...LAB_SCENARIOS_B];
export const LAB_EXAM_SCENARIOS: LabScenario[] = EXAM_SCENARIOS;
export const LAB_ALL: LabScenario[] = [...LAB_SCENARIOS, ...LAB_EXAM_SCENARIOS];

export const labScenarioById = new Map(LAB_ALL.map((s) => [s.id, s]));
export const isExamScenario = (sid: string) => sid.startsWith("EX-");

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
  mode?: "train" | "exam"; // التدريب بتغذية أثناء القرار، والاختبار بلا تقييم حتى الختام
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
  quizEvidence: string[]; // أدلة نوعية من الأسئلة المرتبطة بالكفاءة — بلا أرقام
  examVerdict: string; // حكم الاختبار المستقل — فارغ إن لم يُختبَر
  scenarioIds: string[]; // مواقف التدريب لهذه الكفاءة
  examScenarioIds: string[]; // مواقف اختبار الاستقلال لهذه الكفاءة
}

const rank: Record<LabRating, number> = { poor: 0, ok: 1, good: 2 };

// أدلة نوعية من الجلسات الاختبارية: لكل مفهوم مرتبط بكفاءة، آخر إجابة عن أسئلته
// منفصل عن المحاولات حتى لا يعتمد هذا الملف على بنك الأسئلة كله — الواجهة تمرر الوسطاء
export interface QuizHint {
  skill: string;
  wrong: string[]; // عناوين مفاهيم آخر إجابة عنها خاطئة
  good: string[]; // عناوين مفاهيم آخر إجابة عنها صحيحة
}

const quizEvidenceOf = (hints: QuizHint[], skill: string): string[] => {
  const h = hints.find((x) => x.skill === skill);
  if (!h) return [];
  const out: string[] = [];
  if (h.wrong.length) {
    const names = h.wrong.slice(0, 2).map((t) => `«${t}»`).join(" و");
    out.push(`في اختباراتك ظهرت أخطاء بأسئلة مفاهيم تخدم هذه الكفاءة، مثل ${names} — راجع شرحها في المكتبة ثم أعِد المحاولة.`);
  }
  if (h.good.length && !h.wrong.length) {
    out.push("أسئلة مفاهيم المكتبة المرتبطة بهذه الكفاءة تجيب عنها بدقة في اختباراتك — واصل تدريبها في المواقف لتثبت الممارسة.");
  }
  return out;
};

// خريطة مفهوم → كفاءات مرتبطة به عبر مواقف المختبر كلها
export const skillOfConcept = (() => {
  const m = new Map<string, string[]>();
  for (const s of LAB_ALL) for (const c of s.conceptIds) {
    const cur = m.get(c) ?? [];
    if (!cur.includes(s.skill)) cur.push(s.skill);
    m.set(c, cur);
  }
  return m;
})();

export function skillReports(attempts: LabAttempt[], quizHints: QuizHint[] = []): LabSkillReport[] {
  return LAB_SKILLS.map((skill) => {
    const rel = attempts.filter((a) => labScenarioById.get(a.sid)?.skill === skill);
    const scenarioIds = LAB_ALL.filter((s) => s.skill === skill && !isExamScenario(s.id)).map((s) => s.id);
    const examScenarioIds = LAB_ALL.filter((s) => s.skill === skill && isExamScenario(s.id)).map((s) => s.id);
    if (!rel.length)
      return { skill, status: "none" as LabStatus, evidence: [], quizEvidence: quizEvidenceOf(quizHints, skill), examVerdict: "", scenarioIds, examScenarioIds };
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
    // إثبات الاستقلال: آخر محاولة اختبار في هذه الكفاءة مقابل آخر تدريب
    let examVerdict = "";
    const exams = latest.filter((a) => isExamScenario(a.sid));
    if (exams.length) {
      const lastExam = exams[exams.length - 1];
      const exTitle = labScenarioById.get(lastExam.sid)?.title ?? "";
      const exScores = lastExam.steps.map((s) => rank[s.rating]);
      const exMin = Math.min(...exScores);
      if (exMin >= 1) examVerdict = `ثبتتَ أثر هذه الكفاءة في اختبار الاستقلال بـ«${exTitle}» — قراراتك هناك ضبطت الموقف بلا تلميح.`;
      else examVerdict = `في اختبار الاستقلال بـ«${exTitle}» ظهر قرار يحتاج إعادة نظر — ارجع لمواقف التدريب ثم أعِد الاختبار بموقف جديد.`;
    }
    return { skill, status, evidence, quizEvidence: quizEvidenceOf(quizHints, skill), examVerdict, scenarioIds, examScenarioIds };
  });
}

export const labStatusColor: Record<LabStatus, string> = {
  none: "bg-muted text-muted-foreground",
  weak: "bg-red-50 text-red-700 border border-red-200",
  improving: "bg-amber-50 text-amber-700 border border-amber-200",
  strong: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};
