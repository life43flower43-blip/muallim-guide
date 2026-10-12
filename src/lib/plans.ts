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

// ---------- قوالب خطط جاهزة — خطط احترافية كاملة الأركان يحمّلها المعلم ويكيّفها ----------
export interface PlanTemplate {
  id: string;
  name: string; // اسم القالب
  tag: string; // المواد التي يناسبها
  desc: string; // متى تستخدمه ولماذا
  form: Omit<LessonPlan, "id" | "ts">;
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "T1",
    name: "درس مفهوم بالاستقصاء",
    tag: "العلوم والرياضيات والدراسات",
    desc: "لأنزال مفهوم جديد بالاكتشاف لا بالتلقين — يبدأ بموقف محير وينتهي بصياغة الطلاب للمفهوم بكلماتهم",
    form: {
      subject: "العلوم",
      grade: "",
      topic: "",
      duration: "حصة كاملة",
      objectives:
        "يصوغ الطالب تعريف المفهوم بكلماته الخاصة\nيميز الطالب المفهوم من غيره في مواقف جديدة\nيطبق الطالب المفهوم في مشكلة من واقع حياته",
      prior: "المفاهيم الجذرية التي يقوم عليها المفهوم الجديد — مثال: يعرف الطالب الخصائص العامة للمواد المحيطة به",
      materials: "بطاقات أمثلة تطبق المفهوم ولا تطبقه\nسبورة جانبية لتدوين استنتاجات الطلاب\nورقة عمل مزدوجة لكل ثنائي",
      strategies: ["التعلم بالاكتشاف", "المناقشة والحوار"],
      phases: {
        open: "أعرض موقفًا محيرًا يخلق تساؤلًا حقيقيًا وأستمع لتفسيرات الطلاب الأولية دون تصحيح",
        present: "أوجه الاستقصاء بأسئلة متدرجة: ماذا لاحظت؟ لماذا؟ كيف نميز؟ — وأدون استنتاجاتهم على السبورة",
        practice: "يصنف الطلاب في ثنائيات بطاقات الأمثلة إلى ما يطبق المفهوم وما لا يطبقه مع تعليل كل اختيار",
        assess: "بطاقة خروج: مثال واحد من عنده يوضح المفهوم ومثال آخر لا يوضحه",
        close: "يصوغ الطلاب تعريف المفهوم بكلماتهم ونتفق على الصياغة النهائية ونعلقها",
      },
      keyQuestions: "ما القاسم المشترك بين الأمثلة كلها؟\nهل يصح تطبيق المفهوم على هذا المثال؟ ولماذا؟",
      homework: "يجيب الطالب عن سؤالين تطبيقيين من بيئته القريبة ويبرر إجابته",
      differentiation: "للمتعثر بطاقات أمثلة مصورة وزميل دعم — وللمتفوق مثال حدودي يختبر عمق فهمه",
    },
  },
  {
    id: "T2",
    name: "درس مهارة خطوة بخطوة",
    tag: "الرياضيات واللغات والتقنية",
    desc: "لمهارة تحتاج نمذجة وتدربًا متدرجًا — تنمذج المهارة بصوت مسموع ثم يتدرب الطلاب تحت إشرافك ثم باستقلال",
    form: {
      subject: "",
      grade: "",
      topic: "",
      duration: "حصة كاملة",
      objectives:
        "ينفذ الطالب خطوات المهارة بالترتيب الصحيح\nيكتشف الطالب موضع الخطأ في حل خاطئ ويصححه\nيستخدم الطالب المهارة في مسألة من واقع حياته",
      prior: "المهارات الجذرية التي تقوم عليها المهارة الجديدة — مثال: يجيد الطالب العمليات الأساسية",
      materials: "سبورة رئيسية لنمذجة الخطوات\nبطاقة خطوات مصورة لكل طالب\nبطاقات تدريب متدرجة الصعوبة",
      strategies: ["التدريس المباشر"],
      phases: {
        open: "أستحضر مهارة سابقة بمسألة سريعة أجيب عنها جماعيًا، ثم أعلن هدف اليوم بلغة الطلاب",
        present: "أنمذج المهارة خطوة خطوة وأنا أعلن تفكيري بصوت مسموع، ثم أعيدها بمشاركة الطلاب، ثم أمسح الخطوات وأطلب منهم استدعاءها",
        practice: "تدريب موجه جماعي، ثم بطاقة تدريب متدرجة يعمل عليها كل طالب وأتنقل بينهم للتيسير الفوري",
        assess: "مسألة مستقلة واحدة لكل طالب أراها قبل نهاية الحصة وأسجل من يحتاج دعمًا",
        close: "نراجع بطاقة الخطوات معًا ويذكر طالب موضع الخطأ الشائع وكيف نتجنبه",
      },
      keyQuestions: "ما الخطوة التالية؟ ولماذا؟\nأين يخطئ من يخطئ في هذه المهارة؟",
      homework: "تدريب قصير متدرج مع تصحيح ذاتي بمفتاح مرفق",
      differentiation: "للمتعثر بطاقة خطوات مصورة وأمثلة أقل خطوات — وللمتفوق فقرة تحدٍ تعكس المهارة",
    },
  },
  {
    id: "T3",
    name: "حصة قراءة وفهم",
    tag: "اللغة العربية واللغات",
    desc: "لبناء الفهم القرائي بطبقات: من الحرفي إلى الاستنتاجي إلى النقدي — قراءة تجعل الطالب يحاور النص لا يحفظه",
    form: {
      subject: "اللغة العربية",
      grade: "",
      topic: "",
      duration: "حصة كاملة",
      objectives:
        "يستخرج الطالب الأفكار الرئيسية من النص\nيستنتج الطالب المعنى من السياق\nيعبر الطالب عن موقفه من النص معللًا",
      prior: "المفردات الجديدة الواردة في النص وخبرات حياتية قريبة من موضوعه",
      materials: "نسخ النص لكل طالب\nلوحة تصنيف الأسئلة: حرفية واستنتاجية ونقدية",
      strategies: ["المناقشة والحوار", "التعلم التعاوني"],
      phases: {
        open: "أربط موضوع النص بحياة الطلاب بسؤال واحد وأستمع لتوقعاتهم من العنوان",
        present: "قراءة نموذجية مني ثم قراءات طلابية متبادلة، وأتوقف عند المفردات المفتاحية لأستخرج معناها من السياق",
        practice: "في مجموعات: كل مجموعة تستخرج فكرة رئيسية وتحولها إلى سؤال تطرحه على زملائها",
        assess: "سؤالان شفويان استنتاجيان يقيسان الفهم لدى عينات متنوعة من الطلاب",
        close: "يلخص الطلاب النص في جمل قليلة ويعبر كل طالب بموقف معلل من الفكرة",
      },
      keyQuestions: "ما الذي يريد الكاتب إقناعنا به؟\nلو كنا مكان الشخصية لاخترنا غير ما اختار؟",
      homework: "قراءة نص قصير مماثل واستخراج فكرته الرئيسية وسؤال استنتاجي عنه",
      differentiation: "للمتعثر نص مقسم فقرات بعناوين مساعدة — وللمتفوق نص إثرائي بنفس الموضوع يقيّمه",
    },
  },
  {
    id: "T4",
    name: "درس قيم بلعب الأدوار",
    tag: "التربية والدراسات الاجتماعية",
    desc: "لغرس قيمة بتجربتها لا بالوعظ — يعيش الطلاب الموقف فيقررون ويرون أثر قرارهم على الآخرين",
    form: {
      subject: "",
      grade: "",
      topic: "",
      duration: "حصة كاملة",
      objectives:
        "يصف الطالب السلوك الصحيح في موقف واقعي\nيبرر الطالب قراره في الموقف بدليل\nيقتدي الطالب بالقيمة في موقف جديد من بيئته",
      prior: "خبرات الطلاب اليومية القريبة من موقف الدرس",
      materials: "بطاقات مواقف لكل مجموعة\nمساحة حركة أمام الصف",
      strategies: ["لعب الأدوار", "العصف الذهني", "المناقشة والحوار"],
      phases: {
        open: "أعرض موقفًا يوميًا مألوفًا وأسأل: ماذا تفعل لو كنت مكانه؟ وأدون إجاباتهم دون تصحيح",
        present: "أمثل الموقف الصحيح أمامهم مع إبراز أثر كل اختيار على الأشخاص في الموقف",
        practice: "مجموعات تمثل مواقف متقاربة، وبعد كل تمثيل يوجه الصف سؤالًا للاعبين: ماذا لو غيرت قرارك؟",
        assess: "بطاقة موقف فردية: يكتب الطالب قراره وتعليله في سطر واحد",
        close: "نصوغ معًا تعهدًا قصيرًا بالقيمة بلغة الطلاب ونعلقه في الصف",
      },
      keyQuestions: "كيف شعر من تأثر بقرارك؟\nما الفرق بين ما هو صحيح وما هو سهل؟",
      homework: "يسجل الطالب موقفًا حقيقيًا طبق فيه القيمة خلال اليوم وما شعر به",
      differentiation: "للمتعثر بطاقة ببدايات جمل مكتملة — وللمتفوق موقف مركب فيه تعارض بين قيمتين",
    },
  },
  {
    id: "T5",
    name: "مشروع تعاوني قصير",
    tag: "كل المواد",
    desc: "لتعميق التعلم بالعمل المشترك — أدوار واضحة لكل عضو ومخرج ملموس يعرضه الفريق ويقيّمه أقرانه",
    form: {
      subject: "",
      grade: "",
      topic: "",
      duration: "حصتان متتاليتان",
      objectives:
        "يتعاون الطالب مع فريقه ويفي بدوره المحدد\nينجز الفريق مخرجًا واحدًا متكاملًا\nيقيّم الطالب عمل فريقه وأداءه هو",
      prior: "المعرفة والمهارة التي سيطبق المشروع ما تعلموه منها سابقًا",
      materials: "بطاقات الأدوار لكل فريق\nأوراق تخطيط وأدوات عرض بسيطة\nلوحة معايير التقييم معلنة مسبقًا",
      strategies: ["التعلم التعاوني", "التعلم بالمشروعات"],
      phases: {
        open: "أوزع الفرق بأدوار معلنة: قائد ومقرر وضابط وقت وعضو مواد ومقدم — وأشرح معيار النجاح",
        present: "أعرض نموذج مخرج جيد ونموذجًا ناقصًا وأطلب منهم اكتشاف الفرق بينهما بأنفسهم",
        practice: "يعمل الفريق على مهمة محددة الزمن وأتنقل بينهم للتيسير وأسجل ملاحظاتي عن كل فريق",
        assess: "عرض كل فريق لمخرجه ثم تقييم الأقران بمعايير اللوحة المعلنة",
        close: "يكتب كل طالب سطرين: ماذا أضافت عليّ المجموعة؟ وماذا سأحسن في المرة القادمة؟",
      },
      keyQuestions: "هل ساهمت كل عضو بأدواره؟\nكيف نتأكد أن مخرجنا يحقق المعيار؟",
      homework: "استكمال جزء بسيط من المخرج لمن قصر، وفقرة إثراء لمن أكمل",
      differentiation: "الأدوار نفسها تفرق: دور تحدٍ للمتفوق ودعم خطوة بخطوة للمتعثر داخل الفريق الواحد",
    },
  },
  {
    id: "T6",
    name: "تجربة عملية بالاستقصاء",
    tag: "العلوم والحاسوب",
    desc: "لتدريب الملاحظة والاستنتاج — يتوقع الطلاب قبل التجربة ثم يجربون ثم يقارنون توقعهم بالنتيجة",
    form: {
      subject: "العلوم",
      grade: "",
      topic: "",
      duration: "حصة كاملة",
      objectives:
        "يصوغ الطالب توقعًا مسبقًا للتجربة مع تعليله\nيسجل الطالب ملاحظاته بدقة وأمان\nيقارن الطالب نتيجته بتوقعه ويستنتج",
      prior: "أدوات التجربة وطريقة استخدامها الآمنة",
      materials: "عدد التجربة مقسمة لطاولات المجموعات\nورقة تسجيل ثلاثية: توقعي وملاحظتي واستنتاجي\nلوحة أمان التجربة",
      strategies: ["الاستقصاء", "التعلم بالاكتشاف"],
      phases: {
        open: "أعرض الأدوات وأسأل: ماذا تتوقع أن يحدث لو فعلنا كذا؟ وأدون توقعاتهم على اللوحة",
        present: "نتفق على خطوات التجربة الآمنة وأبرز ما يجب ملاحظته بدقة أثناء التنفيذ",
        practice: "ينفذ الطلاب التجربة في مجموعات ويسجلون على ورقة التسجيل الثلاثية",
        assess: "أطلب من فريقين قراءة استنتاجهما والصف يقيّم دقة الاستنتاج",
        close: "نقارن التوقعات المدونة بالنتائج الفعلية ونسمي معًا ما تعلمناه",
      },
      keyQuestions: "لماذا اختلفت نتيجتنا عن توقعنا؟\nماذا يتغير لو غيرنا متغيرًا واحدًا؟",
      homework: "تصميم تجربة منزلية بسيطة بنفس الفكرة وتسجيل توقعها ونتيجتها",
      differentiation: "للمتعثر ورقة تسجيل بخيارات جاهزة — وللمتفوق متغير إضافي يختبره ويقارن نتيجته",
    },
  },
];
