// استوديو خطط الدروس — نموذج الخطة وتقييمها القواعدي ومركّب النص
// من رؤية المستخدم (بند «تخطيط الدروس» و«أدوات المعلم»):
// المادة، الصف، الموضوع، الأهداف، المعرفة السابقة، الوسائل، الاستراتيجية،
// الخطوات (خمس مراحل)، الأسئلة، التقويم، الواجب، الوقت + تقييم الخطة.
// قواعد صارمة: صفر أرقام ولا لاتيني ولا إيموجي في كل النصوص المعروضة، والتنصيص ب«».

export interface LessonPlanPhases {
  open: string; // التهيئة
  present: string; // العرض والتوضيح
  practice: string; // التطبيق والنشاط
  assess: string; // التقويم
  close: string; // الغلق
}

export interface LessonPlan {
  id: string;
  ts: number;
  subject: string; // المادة
  grade: string; // الصف
  topic: string; // الموضوع
  duration: string; // زمن التنفيذ — من القائمة كلمات
  objectives: string; // هدف في كل سطر
  prior: string; // المعرفة السابقة
  materials: string; // أداة في كل سطر
  strategies: string[]; // من القائمة
  phases: LessonPlanPhases;
  keyQuestions: string; // سؤال في كل سطر
  homework: string;
  differentiation: string; // مراعاة الفروق الفردية
}

// ---------- خيارات جاهزة (كلمات خالصة بلا أرقام) ----------
export const DURATION_OPTIONS = [
  "جزء من الحصة",
  "حصة كاملة",
  "حصتان متتاليتان",
  "مشروع أسبوع",
] as const;

export const STRATEGY_OPTIONS = [
  "التعلم التعاوني",
  "التعلم بالاكتشاف",
  "المناقشة والحوار",
  "لعب الأدوار",
  "التعلم بالمشروعات",
  "العصف الذهني",
  "التعلم باللعب",
  "الاستقصاء",
  "الفصل المقلوب",
  "التدريس المباشر",
] as const;

export const PHASE_META: { key: keyof LessonPlanPhases; label: string; guide: string; placeholder: string }[] = [
  {
    key: "open",
    label: "التهيئة",
    guide: "كيف تفتح الحصة وتشدّ انتباه طلابك؟",
    placeholder: "عرض موقف محسوس أو سؤال محير أو قصة قصيرة تربط الموضوع بحياتهم",
  },
  {
    key: "present",
    label: "العرض والتوضيح",
    guide: "كيف تبني المعرفة الجديدة خطوة خطوة؟",
    placeholder: "عرض المفهوم بأمثلة متدرجة، توضيح على السبورة، ربط بالمفاهيم السابقة",
  },
  {
    key: "practice",
    label: "التطبيق والنشاط",
    guide: "ماذا يفعل الطلاب بأيديهم ليتركون المعرفة تستقر؟",
    placeholder: "نشاط ثنائي أو ورقة عمل متدرجة أو مهمة مجموعة تطبق المفهوم في موقف جديد",
  },
  {
    key: "assess",
    label: "التقويم",
    guide: "كيف تتأكد أن الهدف تحقق قبل نهاية الحصة؟",
    placeholder: "أسئلة شفوية سريعة، بطاقة خروج، مراقبة أداء أثناء النشاط",
  },
  {
    key: "close",
    label: "الغلق",
    guide: "كيف تختم الحصة وتلخص الخيط الناظم؟",
    placeholder: "يلخص الطلاب بأنفسهم ما تعلموه، ثم ربط بالدرس القادم",
  },
];

const linesOf = (t: string) =>
  t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

// ---------- التقييم القواعدي — فحوص بنائية كلمات لا أرقام ----------
export type PlanCheckStatus = "done" | "partial" | "missing";

export interface PlanCheck {
  key: string;
  label: string;
  status: PlanCheckStatus;
  note: string;
}

export const PLAN_STATUS_WORD: Record<PlanCheckStatus, string> = {
  done: "مكتمل",
  partial: "مقترح تحسينه",
  missing: "ناقص",
};

export interface PlanReview {
  items: PlanCheck[];
  verdict: string;
  complete: boolean; // لا يوجد «ناقص»
}

export const PHASE_LABELS: Record<keyof LessonPlanPhases, string> = {
  open: "التهيئة",
  present: "العرض والتوضيح",
  practice: "التطبيق والنشاط",
  assess: "التقويم",
  close: "الغلق",
};

export function planReview(p: LessonPlan): PlanReview {
  const items: PlanCheck[] = [];

  // البطاقة التعريفية
  const cardFields: [string, string][] = [
    ["subject", "المادة"],
    ["grade", "الصف"],
    ["topic", "الموضوع"],
    ["duration", "زمن التنفيذ"],
  ];
  const filled = cardFields.filter(([k]) => String(p[k as keyof LessonPlan] ?? "").trim().length > 0);
  if (filled.length === cardFields.length) {
    items.push({ key: "card", label: "البطاقة التعريفية", status: "done", note: "المادة والصف والموضوع والزمن كلها محددة" });
  } else if (filled.length === 0) {
    items.push({ key: "card", label: "البطاقة التعريفية", status: "missing", note: `أكمل البطاقة: ${cardFields.filter(([k]) => !String(p[k as keyof LessonPlan] ?? "").trim()).map(([, l]) => l).join(" و")}` });
  } else {
    items.push({ key: "card", label: "البطاقة التعريفية", status: "partial", note: `ينقص البطاقة: ${cardFields.filter(([k]) => !String(p[k as keyof LessonPlan] ?? "").trim()).map(([, l]) => l).join(" و")}` });
  }

  // الأهداف — جوهر الخطة
  const objs = linesOf(p.objectives);
  if (objs.length === 0) {
    items.push({ key: "objectives", label: "الأهداف التعليمية", status: "missing", note: "اكتب هدفًا واحدًا على الأقل يصف ما سيتحكم به الطالب بعد الدرس" });
  } else if (objs.length === 1) {
    items.push({ key: "objectives", label: "الأهداف التعليمية", status: "partial", note: "لديك هدف معرفي واحد — المقترح إضافة هدف مهاري أو وجداني إلى جواره، وكل هدف بفعل واضح قابل للملاحظة" });
  } else {
    items.push({ key: "objectives", label: "الأهداف التعليمية", status: "done", note: "أهداف متعددة تغطي وجوهًا مختلفة من التعلم" });
  }

  // المعرفة السابقة
  items.push(
    p.prior.trim()
      ? { key: "prior", label: "المعرفة السابقة", status: "done", note: "حددت ما يقوم عليه الدرس — ممتاز" }
      : { key: "prior", label: "المعرفة السابقة", status: "partial", note: "حدد ما يُفترض أن يعرفه الطلاب قبل الدرس لتسند عليه البناء" }
  );

  // الوسائل
  items.push(
    p.materials.trim()
      ? { key: "materials", label: "الوسائل والأدوات", status: "done", note: "وسائل محددة تجهزها قبل الحصة" }
      : { key: "materials", label: "الوسائل والأدوات", status: "partial", note: "أدرج وسائلك المهيأة مسبقًا حتى لا يقطع البحث عنها خط الدرس" }
  );

  // الاستراتيجية
  items.push(
    p.strategies.length > 0
      ? { key: "strategies", label: "استراتيجيات التدريس", status: "done", note: p.strategies.join(" و") }
      : { key: "strategies", label: "استراتيجيات التدريس", status: "missing", note: "اختر الاستراتيجية التي تخدم طبيعة الموضوع ومرحلة الطلاب" }
  );

  // خطوات التنفيذ — المراحل الخمس
  const emptyPhases = PHASE_META.filter((ph) => !p.phases[ph.key].trim()).map((ph) => ph.label);
  const donePhases = PHASE_META.length - emptyPhases.length;
  if (emptyPhases.length === 0) {
    items.push({ key: "phases", label: "خطوات التنفيذ", status: "done", note: "المراحل الخمس مكتملة من التهيئة إلى الغلق" });
  } else if (donePhases >= 3) {
    items.push({ key: "phases", label: "خطوات التنفيذ", status: "partial", note: `اكتملت معظم المراحل — تبقى: ${emptyPhases.join(" و")}` });
  } else {
    items.push({ key: "phases", label: "خطوات التنفيذ", status: "missing", note: `الخطوات جوهر الخطة — المراحل الناقصة: ${emptyPhases.join(" و")}` });
  }

  // التقويم على حدة — لأنه الأكثر إهمالًا
  items.push(
    p.phases.assess.trim()
      ? { key: "assess", label: "أداة التقويم", status: "done", note: "لديك وسيلة تتأكد بها من تحقق الهدف" }
      : { key: "assess", label: "أداة التقويم", status: "partial", note: "أضف تقويمًا سريعًا قبل الغلق — بطاقة خروج أو سؤال شفوي — كي لا تنتهي الحصة بلا دليل فهم" }
  );

  // الأسئلة المفتاحية
  items.push(
    p.keyQuestions.trim()
      ? { key: "questions", label: "الأسئلة المفتاحية", status: "done", note: "أسئلتك الجاهزة تقود الحوار الصفي" }
      : { key: "questions", label: "الأسئلة المفتاحية", status: "partial", note: "جهّز سؤالين أو أكثر يفتحان التفكير — السؤال الجيد نصف الشرح" }
  );

  // الواجب
  items.push(
    p.homework.trim()
      ? { key: "homework", label: "الواجب", status: "done", note: "واجب يثبت التعلم بعد الحصة" }
      : { key: "homework", label: "الواجب", status: "partial", note: "ختم الدرس بواجب قصير واضح يمدّ التعلم إلى البيت" }
  );

  // الفروق الفردية
  items.push(
    p.differentiation.trim()
      ? { key: "differentiation", label: "الفروق الفردية", status: "done", note: "خطتك تخدم المتعثر والمتوسط والمتفوق" }
      : { key: "differentiation", label: "الفروق الفردية", status: "partial", note: "فكر في المتعثر الذي يحتاج تيسيرًا والمتفوق الذي يحتاج إثراءً — صف طريقة خدمتك لكل منهما" }
  );

  const hasMissing = items.some((i) => i.status === "missing");
  const allDone = items.every((i) => i.status === "done");
  return {
    items,
    complete: !hasMissing,
    verdict: allDone
      ? "خطة متكاملة — جاهزة للتطبيق بثقة"
      : hasMissing
        ? "خطة تحتاج إكمالًا — عالج الناقص ثم أعد التقييم"
        : "خطة جيدة تكتمل بلمسات — المقترحات تحسّنها أكثر",
  };
}

// ---------- مركّب النص — نسخة قابلة للمشاركة بلا أرقام ولا لاتيني ----------
export function composePlanText(p: LessonPlan): string {
  const L: string[] = [];
  L.push(`خطة درس: ${p.topic.trim() || "بدون موضوع"}`);
  const card = [
    p.subject.trim() ? `المادة: ${p.subject.trim()}` : "",
    p.grade.trim() ? `الصف: ${p.grade.trim()}` : "",
    p.duration.trim() ? `زمن التنفيذ: ${p.duration.trim()}` : "",
  ].filter(Boolean);
  if (card.length) L.push(card.join(" — "));

  const section = (title: string, body?: string) => {
    if (!body?.trim()) return;
    L.push("");
    L.push(`${title}:`);
    for (const ln of linesOf(body)) L.push(`– ${ln}`);
  };
  const listSection = (title: string, items: string[]) => {
    if (!items.length) return;
    L.push("");
    L.push(`${title}:`);
    for (const it of items) L.push(`– ${it}`);
  };

  section("الأهداف التعليمية", p.objectives);
  section("المعرفة السابقة", p.prior);
  section("الوسائل والأدوات", p.materials);
  listSection("استراتيجيات التدريس", p.strategies);
  const phaseBlocks = PHASE_META.filter((ph) => p.phases[ph.key].trim());
  if (phaseBlocks.length) {
    L.push("");
    L.push("خطوات التنفيذ:");
    for (const ph of phaseBlocks) {
      L.push(`· ${ph.label}:`);
      for (const ln of linesOf(p.phases[ph.key])) L.push(`   – ${ln}`);
    }
  }
  section("الأسئلة المفتاحية", p.keyQuestions);
  section("الواجب", p.homework);
  section("الفروق الفردية", p.differentiation);
  return L.join("\n");
}

// ---------- كلمات تقدم الخطة بقائمة «خططي» — نوعية بلا أرقام ----------
export function planMaturityWord(p: LessonPlan): string {
  const r = planReview(p);
  const done = r.items.filter((i) => i.status === "done").length;
  if (done === r.items.length) return "مكتملة الأركان";
  if (r.complete) return "شبه مكتملة";
  if (done >= Math.floor(r.items.length / 2)) return "في منتصف الطريق";
  return "بداية قائمة";
}
