// سجل التدريب الميداني — من رؤية المستخدم (بندي «التدريب الميداني» و«سجل التدريب الميداني»):
// قبل دخول المدرسة (ماذا أفعل؟ ماذا أحضر؟ الأخلاقيات)، أثناء الحصة (قائمة ملاحظة)،
// وبعد الحصة التأمل الرباعي (ماذا تعلمت؟ ماذا كان جيدًا؟ ماذا يمكن تحسينه؟ ماذا سأفعل لو كنت المعلم؟)
// قواعد صارمة: صفر أرقام ولا لاتيني ولا إيموجي في كل النصوص المعروضة، والتنصيص ب«».

export interface FieldVisit {
  id: string;
  ts: number;
  kind: VisitKind; // نوع الزيارة: مشاهدة حصة معلم أو تنفيذ حصة بنفسك
  school: string; // المدرسة
  grade: string; // الصف
  subject: string; // المادة
  supervisor: string; // المشرف — اختياري
  topic: string; // موضوع الدرس
  size: string; // حجم الصف — كلمات لا أرقام
  observed: string[]; // ما لاحظته أثناء الحصة — من قائمة الملاحظة
  happened: string; // ما حدث في الحصة
  learned: string; // ماذا تعلمت
  good: string; // ماذا كان جيدًا
  improve: string; // ماذا يمكن تحسينه
  wouldDo: string; // ماذا سأفعل لو كنت المعلم
  rating: string; // تقييمك للحصة — كلمات
}

export type VisitKind = "observe" | "teach";

export const VISIT_KIND_LABEL: Record<VisitKind, string> = {
  observe: "مشاهدة حصة معلم",
  teach: "تنفيذ حصة بنفسك",
};

// ---------- خيارات جاهزة (كلمات خالصة) ----------

export const SIZE_OPTIONS = [
  "صف صغير العدد",
  "صف متوسط العدد",
  "صف مزدحم",
] as const;

export const RATING_OPTIONS = [
  "حصة ملهمة",
  "حصة جيدة",
  "حصة تحتاج تطويرًا",
] as const;

// قائمة الملاحظة أثناء الحصة — بنود رؤية المستخدم الخمسة
export const OBSERVE_OPTIONS = [
  "حضور الطلاب ومشاركتهم",
  "إدارة الصف والانتقالات",
  "طريقة الشرح والتمثيل",
  "استراتيجية التدريس المستخدمة",
  "التعامل مع الفروق بين الطلاب",
] as const;

// قائمة الجاهزية قبل دخول المدرسة — ماذا أفعل؟ ماذا أحضر؟ الأخلاقيات
export const READY_CHECKLIST = [
  "اقرأ موضوع الدرس في الكتاب قبل الحصة",
  "جهّز دفتر ملاحظتك وقلمًا احتياطيًا",
  "اعرف جدول الحصص واسم المعلم المتعاون",
  "أتِ مبكرًا قبل جرس الحصة بوقت كافٍ",
  "التزم اللباس المهني المحتشم المناسب للمدرسة",
  "استأذن المشرف والمدير قبل استخدام أي أداة توثيق",
  "احترم خصوصية الطلاب ولا تشارك أسماءهم أو صورهم خارج المدرسة",
  "جهّز أسئلتك مسبقًا: ماذا أريد أن أتعلم من هذه الحصة؟",
] as const;

// ---------- كلمات الجاهزية ومدى الرحلة — نوعية بلا أرقام ----------

export function readinessWord(checked: number): string {
  if (checked === 0) return "ابدأ بترتيب أوراقك";
  if (checked < 3) return "أكمل بضعة تحضيرات";
  if (checked < READY_CHECKLIST.length) return "قاربت الجاهزية";
  return "جاهز للميدان تمامًا";
}

export function fieldJourneyWord(n: number): string {
  if (n <= 0) return "سجل زيارتك الأولى";
  if (n === 1) return "بداية رحلة الميدان";
  if (n <= 3) return "خطوات ميدانية ثابتة";
  if (n <= 9) return "متدرب ميداني ينضج";
  return "خبرة ميدانية راسخة";
}

// ---------- كلمة يوم الزيارة — كلمات خالصة بلا أرقام ----------

export function visitDayWord(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  const weekday = d.toLocaleDateString("ar", { weekday: "long" });
  if (diffDays <= 0) return `اليوم · ${weekday}`;
  if (diffDays === 1) return `أمس · ${weekday}`;
  if (diffDays === 2) return `قبل يومين · ${weekday}`;
  if (diffDays <= 6) return `منذ أيام قليلة · ${weekday}`;
  if (diffDays <= 13) return `منذ أسبوع · ${weekday}`;
  if (diffDays <= 45) return `منذ أسابيع · ${weekday}`;
  return `منذ شهور · ${weekday}`;
}

// ---------- مركّب النص — نسخة قابلة للمشاركة بلا أرقام ولا لاتيني ----------

const linesOf = (t: string) =>
  t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

export function composeVisitText(v: FieldVisit): string {
  const L: string[] = [];
  L.push(`زيارة ميدانية: ${v.school.trim() || "مدرسة"}`);
  const card = [
    v.grade.trim() ? `الصف: ${v.grade.trim()}` : "",
    v.subject.trim() ? `المادة: ${v.subject.trim()}` : "",
    v.topic.trim() ? `الدرس: ${v.topic.trim()}` : "",
    v.supervisor.trim() ? `المشرف: ${v.supervisor.trim()}` : "",
    v.size.trim() ? v.size.trim() : "",
  ].filter(Boolean);
  if (card.length) L.push(card.join(" — "));
  L.push(`نوع الزيارة: ${VISIT_KIND_LABEL[v.kind]}`);

  if (v.observed.length) {
    L.push("");
    L.push("ما لاحظته أثناء الحصة:");
    for (const o of v.observed) L.push(`– ${o}`);
  }

  const section = (title: string, body?: string) => {
    if (!body?.trim()) return;
    L.push("");
    L.push(`${title}:`);
    for (const ln of linesOf(body)) L.push(`– ${ln}`);
  };
  section("ما حدث في الحصة", v.happened);
  section("ماذا تعلمت", v.learned);
  section("ماذا كان جيدًا", v.good);
  section("ماذا يمكن تحسينه", v.improve);
  section("ماذا سأفعل لو كنت المعلم", v.wouldDo);

  if (v.rating.trim()) {
    L.push("");
    L.push(`تقييم الحصة: ${v.rating.trim()}`);
  }
  return L.join("\n");
}

// ---------- دليل حقول التأمل — أسئلة رؤية المستخدم الأربعة ----------

export const REFLECT_FIELDS: {
  key: "learned" | "good" | "improve" | "wouldDo";
  label: string;
  guide: string;
  placeholder: string;
}[] = [
  {
    key: "learned",
    label: "ماذا تعلمت؟",
    guide: "فكرة أو حيلة أو درسًا أخذته من هذه الحصة",
    placeholder: "تعلمت أن التفاتة قصيرة لطالب متعثر تمنع تعطّل الدرس كله",
  },
  {
    key: "good",
    label: "ماذا كان جيدًا؟",
    guide: "ما أعجبك في إدارة الحصة أو في أدائك أنت إن كنت المنفذ",
    placeholder: "التهيئة بسؤال محير شدت انتباههم من الدقيقة الأولى",
  },
  {
    key: "improve",
    label: "ماذا يمكن تحسينه؟",
    guide: "أين ضاعت ثوانٍ أو تشتت انتباه — بلسان المنصف لا الحاكم",
    placeholder: "توزيع أوراق النشاط استغرق وقتًا طويلًا لأن كل طالب نادى في نفس اللحظة",
  },
  {
    key: "wouldDo",
    label: "ماذا سأفعل لو كنت المعلم؟",
    guide: "قرارك العملي في نفس الموقف — خطة قابلة للتطبيق",
    placeholder: "سأعين طالبًا موزعًا للأوراق وأجهزها مفرزة لكل صف",
  },
];
