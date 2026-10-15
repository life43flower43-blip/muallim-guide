// مختبر محاكاة الصفوف — الجيل الجديد: كل قرار يغيّر الموقف، والتحليل متعدد الكفاءات
// الفلسفة: تحويل الطالب من «من يعرف المعلومات التربوية» إلى «معلم يتصرف بذكاء داخل الصف»
// البنية: مدخل الموقف → عقد قرار متتابعة → تقرير كفاءات → توصية تدريب مستهدفة
// القواعد: عربي خالص على الواجهة، الأرقام المشرقية، التنصيص «» — بلا لاتيني ولا CJK

import { SIM_SCENARIOS_A } from "./sim-scenarios-a";
import { SIM_SCENARIOS_B } from "./sim-scenarios-b";
import { SIM_SCENARIOS_C } from "./sim-scenarios-c";
import { SIM_SCENARIOS_D } from "./sim-scenarios-d";
import { SIM_SCENARIOS_E } from "./sim-scenarios-e";
import { SIM_SCENARIOS_F } from "./sim-scenarios-f";
import { SIM_SCENARIOS_G } from "./sim-scenarios-g";

// ---------- الكفاءات الخمس المقيسة ----------
export const SIM_SKILLS = [
  "إدارة الصف",
  "التواصل",
  "فهم المتعلم",
  "اتخاذ القرار التربوي",
  "التقويم والتغذية الراجعة",
] as const;

export type SimSkill = (typeof SIM_SKILLS)[number];

export type SimRating = "good" | "ok" | "poor";

export const SIM_RATING_WORD: Record<SimRating, string> = {
  good: "قرار حاسم",
  ok: "قرار مقبول",
  poor: "قرار يحتاج إعادة نظر",
};

export interface SimOption {
  text: string; // ما ستفعله
  outcome: string; // ماذا حدث بعد قرارك — الموقف يتغير وفقًا له
  rating: SimRating; // تقييم القرار
  insight: string; // التحليل التربوي: لماذا هذا القرار يعمل أو يفشل
  risks?: string; // المخاطر المحتملة وما تحسبه
  evidence?: string; // الأدلة التي ينبغي جمعها قبل أو بعد القرار
  delta: Partial<Record<SimSkill, number>>; // أثر القرار على كل كفاءة (٠ إلى ٢)
  next: string; // معرّف العقدة التالية أو «end»
}

export interface SimNode {
  text: string; // تطور الموقف بعد قرارك السابق
  options: SimOption[];
}

export interface SimScenario {
  id: string; // معرّف داخلي — لا يُعرض على الواجهة
  title: string;
  stage: string; // سياق الموقف: المرحلة الدراسية
  intro: string; // الموقف الافتتاحي — يُقرأ قبل أول قرار
  skills: SimSkill[]; // الكفاءات المحورية في هذا الموقف
  conceptIds: string[]; // مفاهيم المكتبة المرتبطة — تُفتح من الدليل
  nodes: Record<string, SimNode>;
  end: string; // خلاصة الموقف — تُعرض في التقرير
}

export const SIM_SCENARIOS: SimScenario[] = [...SIM_SCENARIOS_A, ...SIM_SCENARIOS_B, ...SIM_SCENARIOS_C, ...SIM_SCENARIOS_D, ...SIM_SCENARIOS_E, ...SIM_SCENARIOS_F, ...SIM_SCENARIOS_G];

/** جلسة موسعة: ثلاثة مواقف متتابعة — نحو ثلاثين قراراً في مرة واحدة */
export const SIM_SESSION_SIZE = 3;

/** ينتقي مواقف الجلسة الموسعة: يفضل غير المجرب ثم الأقل تجربة، بترتيب حتمي من بذرة الجلسة */
export function pickSessionScenarios(
  attemptedSids: string[],
  size: number = SIM_SESSION_SIZE,
  seed: number = Date.now(),
): SimScenario[] {
  const tried = new Set(attemptedSids);
  const counts = new Map<string, number>();
  for (const s of attemptedSids) counts.set(s, (counts.get(s) ?? 0) + 1);
  const ranked = [...SIM_SCENARIOS].sort((a, b) => {
    const ta = tried.has(a.id) ? 1 : 0;
    const tb = tried.has(b.id) ? 1 : 0;
    if (ta !== tb) return ta - tb;
    return (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0);
  });
  // خلط حتمي داخل كل طبقة (جرب/لم يجرب) ببذرة الجلسة
  let s = seed || 1;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const shuffled = [...ranked];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(size, shuffled.length));
}

export const simScenarioById = new Map(SIM_SCENARIOS.map((s) => [s.id, s]));

// ---------- سجل المحاولة ----------
export interface SimStep {
  node: string;
  choice: string;
  rating: SimRating;
  outcome: string;
  delta: Partial<Record<SimSkill, number>>;
}

export interface SimAttempt {
  sid: string; // معرّف الموقف
  ts: number;
  steps: SimStep[];
}

// ---------- محرك الكفاءة: من الأدلة إلى الحالة ----------
export type SimStatus = "none" | "weak" | "improving" | "strong";

export const SIM_STATUS_WORD: Record<SimStatus, string> = {
  none: "بلا أدلة بعد",
  weak: "تحتاج تدريباً",
  improving: "في تحسّن",
  strong: "متقنة",
};

export interface SimSkillScore {
  skill: SimSkill;
  sum: number; // مجموع الأدلة
  count: number; // عدد القرارات التي ظهرت فيها الكفاءة
  ratio: number; // حصة الأدلة من الأقصى الممكن (٠ إلى ١)
  status: SimStatus;
}

const scoreOf = (skill: SimSkill, sum: number, count: number): SimSkillScore => {
  const max = count * 2;
  const ratio = max > 0 ? sum / max : 0;
  let status: SimStatus = "none";
  if (count > 0) status = ratio >= 0.75 ? "strong" : ratio >= 0.4 ? "improving" : "weak";
  return { skill, sum, count, ratio, status };
};

/** بروفايل الكفاءات لموقف واحد من خطوات المحاولة — يغطي كفاءات الموقف وأي كفاءة ظهرت في القرارات */
export function simProfile(scenario: SimScenario, steps: SimStep[]): SimSkillScore[] {
  const pool = new Map<SimSkill, { sum: number; count: number }>();
  const touch = (skill: SimSkill) => {
    if (!pool.has(skill)) pool.set(skill, { sum: 0, count: 0 });
  };
  for (const s of scenario.skills) touch(s);
  for (const st of steps) {
    for (const [k, v] of Object.entries(st.delta) as [SimSkill, number][]) {
      touch(k);
      const cur = pool.get(k)!;
      cur.sum += v;
      cur.count += 1;
    }
  }
  return [...pool.entries()]
    .map(([skill, { sum, count }]) => scoreOf(skill, sum, count))
    .sort((a, b) => b.ratio - a.ratio || b.count - a.count);
}

/** بروفايل مجمّع من كل محاولات المحاكاة — آخر محاولة لكل موقف هي الدليل الحي */
export function simAggregate(attempts: SimAttempt[]): SimSkillScore[] {
  const latestBySid = new Map<string, SimAttempt>();
  for (const a of [...attempts].sort((x, y) => x.ts - y.ts)) latestBySid.set(a.sid, a);
  const pool = new Map<SimSkill, { sum: number; count: number }>();
  for (const a of latestBySid.values()) {
    const sc = simScenarioById.get(a.sid);
    if (!sc) continue;
    for (const s of sc.skills) {
      if (!pool.has(s)) pool.set(s, { sum: 0, count: 0 });
    }
    for (const st of a.steps) {
      for (const [k, v] of Object.entries(st.delta) as [SimSkill, number][]) {
        const cur = pool.get(k) ?? { sum: 0, count: 0 };
        cur.sum += v;
        cur.count += 1;
        pool.set(k, cur);
      }
    }
  }
  return [...pool.entries()]
    .map(([skill, { sum, count }]) => scoreOf(skill, sum, count))
    .sort((a, b) => b.ratio - a.ratio || b.count - a.count);
}

/** أضعف كفاءة لها أدلة — هي هدف التدريب المستهدف */
export function weakestSkill(profile: SimSkillScore[]): SimSkill | null {
  const withEvidence = profile.filter((p) => p.count > 0 && p.status !== "strong");
  if (!withEvidence.length) return null;
  return withEvidence.reduce((min, p) => (p.ratio < min.ratio ? p : min), withEvidence[0]).skill;
}

export const simStatusColor: Record<SimStatus, string> = {
  none: "bg-muted text-muted-foreground",
  weak: "bg-red-50 text-red-700 border border-red-200",
  improving: "bg-amber-50 text-amber-700 border border-amber-200",
  strong: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

// ---------- التوصية المستهدفة: تمرينك التالي يُبنى على أضعف دليل ----------
export interface SimTip {
  concepts: string[]; // مفاهيم للمراجعة قبل التمرين
  labSkill: string | null; // كفاءة في مختبر المعلّم لها مواقف تدريب
  exercise: string; // نصوص التوصية
}

export const SIM_TIPS: Record<SimSkill, SimTip> = {
  "إدارة الصف": {
    concepts: ["C167", "C175", "C168"],
    labSkill: "إدارة الصف",
    exercise: "راجع أدوات التعزيز وبدائل العقاب في المكتبة، ثم جرّب موقف «إدارة الصف» في مختبر المعلّم وطبّق إشارة صمت متفق عليها بدل المناداة.",
  },
  التواصل: {
    concepts: ["C260", "C104"],
    labSkill: "تحفيز المشاركة",
    exercise: "راجع مهارات الحوار والاستماع في المكتبة، ثم تدرب في مختبر المعلّم على موقف «تحفيز المشاركة» — لاحظ كيف تُبنى المشاركة بالتدرج لا بالإلزام.",
  },
  "فهم المتعلم": {
    concepts: ["C268", "D1114"],
    labSkill: "مراعاة الفروق الفردية",
    exercise: "راجع التدريس المتمايز والتعاطف في المكتبة، ثم جرّب موقف «مراعاة الفروق الفردية» في مختبر المعلّم — تمرن على جمع الأدلة قبل إصدار الحكم على الطالب.",
  },
  "اتخاذ القرار التربوي": {
    concepts: ["C281", "D1467"],
    labSkill: null,
    exercise: "راجع التقويم التشخيصي وأخطاء الأهداف الشائعة في المكتبة، ثم أعد هذه المحاكاة مستهدفًا: اجمع الأدلة قبل كل قرار هذا المرة.",
  },
  "التقويم والتغذية الراجعة": {
    concepts: ["C282", "D1275"],
    labSkill: "بناء التقويم",
    exercise: "راجع التقويم التكويني وخصائص التغذية الراجعة الفعالة، ثم جرّب موقف «بناء التقويم» في مختبر المعلّم — حوّل الاختبار من محكمة إلى إنذار مبكر.",
  },
};

export interface SimRecommendation extends SimTip {
  skill: SimSkill | null;
  labSid: string | null; // موقف مختبر مقترح — إن وُجد لم يُتم بعد
  labTitle: string | null;
}

/** يبني التوصية من أضعف كفاءة: يفضّل موقف مختبر لم تجرّبه في تلك الكفاءة */
export function buildRecommendation(
  skill: SimSkill | null,
  labCandidates: { sid: string; title: string; skill: string; attempted: boolean }[],
): SimRecommendation | null {
  if (!skill) return null;
  const tip = SIM_TIPS[skill];
  const untried = labCandidates.find((c) => c.skill === tip.labSkill && !c.attempted);
  const tried = labCandidates.find((c) => c.skill === tip.labSkill);
  const pick = untried ?? tried ?? null;
  return { ...tip, skill, labSid: pick?.sid ?? null, labTitle: pick?.title ?? null };
}
