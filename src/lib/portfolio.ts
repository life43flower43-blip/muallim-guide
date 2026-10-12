// ملف الإنجاز المهني — من رؤية المستخدم (بندا «السجل المهني» و«Teacher Ready»):
// يجمع أثر المعلم المتدرب من كل مصادر التطبيق ويصف جاهزيته كلمات لا نسب،
// ويركّب نص ملف إنجاز قابلًا للمشاركة. قواعد صارمة: بلا أرقام لاتينية ولا لاتيني في النص المعروض.

import type { Attempt, SessionRecord } from "./types";
import type { LabAttempt } from "./lab";
import type { LessonPlan } from "./plans";
import type { FieldVisit } from "./field";
import { arCount, QUESTION_OBJ_FORMS, type CountForms } from "./arabic";

export interface PortfolioInput {
  name: string;
  xp: number;
  attempts: Record<string, Attempt>;
  sessions: SessionRecord[];
  conceptReads: Record<string, number>;
  scenarioChoices: Record<string, unknown>;
  labAttempts: LabAttempt[];
  lessonPlans: LessonPlan[];
  fieldVisits: FieldVisit[];
  achievementsTotal: number;
  achievementsEarned: number;
}

// ---------- محطات الجاهزية الست — من رؤية المستخدم ----------
// درّب على الأسئلة، بنى معرفته، واجه المواقف، تدرّب بالمختبر، خطط درسًا، نزل الميدان

export interface ReadinessCheck {
  key: string;
  label: string; // ما أنجزته — بلسان الإنجاز
  next: string; // توجيهك إن لم تنجزه بعد — بلسان الخطوة القادمة
  done: (st: PortfolioInput) => boolean;
}

export const READINESS_CHECKS: ReadinessCheck[] = [
  {
    key: "quiz",
    label: "درّبت على أسئلة تختبر معرفتك",
    next: "ابدأ أول اختبار — كل سؤال يجزئ ضباب المعرفة",
    done: (st) => st.sessions.length >= 1,
  },
  {
    key: "read",
    label: "بنيت معرفتك من مكتبة التربية",
    next: "اطلع على مجموعة من مفاهيم المكتبة — الفهم أولًا",
    done: (st) => Object.keys(st.conceptReads).length >= 5,
  },
  {
    key: "scenarios",
    label: "واجهت مواقف الصف واتخذت قراراتك",
    next: "افتح محاكاة الصف وقرر في مواقف حقيقية",
    done: (st) => Object.keys(st.scenarioChoices).length >= 3,
  },
  {
    key: "lab",
    label: "صقلت قراراتك في مختبر المعلّم",
    next: "تدرّب في مختبر المعلّم على مواقف متفرعة القرارات",
    done: (st) => st.labAttempts.length >= 3,
  },
  {
    key: "plan",
    label: "خططت درسًا كامل الأركان",
    next: "اصنع خطة درس في الاستوديو — أنت ملّم الحصة قبل صعودها",
    done: (st) => st.lessonPlans.length >= 1,
  },
  {
    key: "field",
    label: "وثّقت زيارة ميدانية وتأملتها",
    next: "سجّل زيارتك الميدانية الأولى في سجل الميدان",
    done: (st) => st.fieldVisits.length >= 1,
  },
];

export function readinessChecks(st: PortfolioInput): { check: ReadinessCheck; ok: boolean }[] {
  return READINESS_CHECKS.map((check) => ({ check, ok: check.done(st) }));
}

/** كلمة الجاهزية المهنية — من بداية الطريق إلى معلم جاهز */
export function readinessWord(st: PortfolioInput): string {
  const done = READINESS_CHECKS.filter((c) => c.done(st)).length;
  if (done === 0) return "بداية الطريق";
  if (done <= 2) return "معلم في التكوين";
  if (done <= 4) return "معلم ناشئ";
  if (done === 5) return "على أعتاب الميدان";
  return "معلم جاهز";
}

/** وصف كلمة الجاهزية — سطر يشرح ما تعنيه هذه المرحلة */
export function readinessDesc(st: PortfolioInput): string {
  const done = READINESS_CHECKS.filter((c) => c.done(st)).length;
  if (done === READINESS_CHECKS.length)
    return "أتممت دورة الإعداد كاملة: معرفة وتدريب وتخطيط وميدان — حافظ على تقدمك بمراجعة أسبوعية";
  if (done === 0)
    return "كل معلم كبير بدأ من هنا — خطوة واحدة اليوم تصنع الفرق";
  return "محطاتك المنجزة تقول إنك تسير بثبات — أكمل البقية بخطوات صغيرة";
}

/** نص ملف الإنجاز القابل للمشاركة — الأعداد بالصيغ العربية الصحيحة */
const ACH_FORMS: CountForms = {
  one: "محطة تقدم واحدة",
  two: "محطتين",
  few: "محطات",
  many: "محطة",
};

export function composePortfolioText(st: PortfolioInput, word: string): string {
  const L: string[] = [];
  L.push(`ملف إنجاز المعلم المتدرب${st.name.trim() ? `: ${st.name.trim()}` : ""}`);
  L.push(`مرحلة الجاهزية: ${word}`);
  const done = READINESS_CHECKS.filter((c) => c.done(st));
  if (done.length) {
    L.push("");
    L.push("ما أنجزته:");
    for (const c of done) L.push(`– ${c.label}`);
  }
  const remaining = READINESS_CHECKS.filter((c) => !c.done(st));
  if (remaining.length) {
    L.push("");
    L.push("محطاتي القادمة:");
    for (const c of remaining) L.push(`– ${c.next}`);
  }
  const qCount = st.attempts ? Object.keys(st.attempts).length : 0;
  const extra: string[] = [];
  if (qCount > 0) extra.push(`واجهت ${arCount(qCount, QUESTION_OBJ_FORMS)}`);
  if (st.achievementsEarned > 0)
    extra.push(`أنجزت ${arCount(st.achievementsEarned, ACH_FORMS)} من أصل ${arCount(st.achievementsTotal, ACH_FORMS)}`);
  if (extra.length) {
    L.push("");
    L.push(`ملخص الأثر: ${extra.join("، ")}`);
  }
  L.push("");
  L.push("أُعدّ هذا الملف من تطبيق تربوي — مساعد إعداد المعلم");
  return L.join("\n");
}
