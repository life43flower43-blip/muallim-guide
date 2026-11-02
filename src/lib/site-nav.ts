// خريطة الموقع العام: تصنيفات المقالات (المحاور) وأقسام التطبيق، مع صورة ولون لكل منها
import { publicBank, summary } from "@/lib/public-bank";
import type { Concept } from "@/lib/types";

export type CourseMeta = { short: string; img: string; color: string; about: string };

export const COURSE_META: Record<string, CourseMeta> = {
  M1: { short: "النمو", img: "/home/situations-v2.jpg", color: "#2E7D5B", about: "مراحل نمو الطالب الجسمي والعقلي والانفعالي والاجتماعي، وما يعنيه كل منها للمعلم داخل الصف." },
  M2: { short: "علم النفس التربوي", img: "/home/concepts-v2.jpg", color: "#7A4E9C", about: "الدافعية والانفعالات والذكاء والفروق الفردية: الأسس النفسية التي يقوم عليها التعليم." },
  M3: { short: "التعلم", img: "/home/methods-v2.jpg", color: "#1F6FA8", about: "نظريات التعلم السلوكية والمعرفية والبنائية، وكيف يحفظ الطالب المعلومة ويسترجعها وينقلها." },
  M4: { short: "التقويم والقياس", img: "/home/test-v2.jpg", color: "#B4532A", about: "أنواع التقويم، وبناء الاختبارات، والصدق والثبات، وتحليل الأسئلة وتفسير الدرجات." },
  M5: { short: "طرائق التدريس", img: "/home/skills-v2.jpg", color: "#136F5C", about: "استراتيجيات التدريس وإدارة الصف وتخطيط الدرس وأساليب طرح الأسئلة داخل الصف." },
  SE1: { short: "التربية الخاصة", img: "/home/situations-v2.jpg", color: "#A0466B", about: "فئات ذوي الاحتياجات الخاصة، والتعليم الدامج، وتكييف التدريس والتقويم لكل طالب." },
  F1: { short: "أسس التربية", img: "/home/plan-v2.jpg", color: "#6B5B2E", about: "الأسس الفلسفية والاجتماعية للتربية، وأخلاقيات مهنة التعليم، وأدوار المعلم." },
  AI1: { short: "الذكاء الاصطناعي", img: "/home/concepts-v2.jpg", color: "#3A55A4", about: "استخدام أدوات الذكاء الاصطناعي في التعليم بوعي: الفرص والمخاطر والضوابط." },
  G1: { short: "المكتبة التربوية", img: "/home/plan-v2.jpg", color: "#4E6E3A", about: "مفاهيم تربوية عامة يحتاجها كل معلم، مجمّعة من مصادر الإعداد التربوي." },
  C1: { short: "المهارات", img: "/home/skills-v2.jpg", color: "#8A6A12", about: "مهارات المعلم العملية: التواصل، والعرض، والتعزيز، وتنويع المثيرات، وغلق الدرس." },
};

export const courseMeta = (id: string): CourseMeta => COURSE_META[id] ?? { short: id, img: "/home/concepts-v2.jpg", color: "#136F5C", about: "" };

/** أقسام التطبيق كما تُعرض في الموقع: لكل قسم صفحة تعريف ورابط يفتحه في التطبيق */
export type AppSection = { slug: string; open: string; title: string; img: string; lead: string; points: string[] };

export const APP_SECTIONS: AppSection[] = [
  {
    slug: "exam-simulator", open: "examsim", title: "اختبار المحاكاة", img: "/home/test-v2.jpg",
    lead: "اختبار كامل بأقسام وزمن محدد يحاكي اختبارات التوظيف والرخصة المهنية، ثم تقرير يبين أداءك في كل قسم.",
    points: ["أقسام موزعة على المحاور التربوية بأوزان قريبة من الاختبارات الرسمية", "مؤقت ظاهر، وخريطة للأسئلة، وإمكانية تمييز السؤال للعودة إليه", "تقرير بعد النهاية: نسبتك في كل قسم، وحد النجاح، وأين تحتاج مراجعة"],
  },
  {
    slug: "placement", open: "placement", title: "اختبر نفسك", img: "/home/test-v2.jpg",
    lead: "اختبار قصير يحدد مستواك في كل محور، ويرتب لك من أين تبدأ المذاكرة.",
    points: ["أسئلة من كل المحاور في جلسة واحدة قصيرة", "نتيجة لكل محور بدل رقم واحد عام", "خطة تبدأ بالمحور الأضعف"],
  },
  {
    slug: "concepts", open: "learn", title: "المفاهيم التربوية", img: "/home/concepts-v2.jpg",
    lead: "أكثر من ألف وخمسمئة مفهوم تربوي، لكل مفهوم شرح مبسط وأمثلة من الصف وقاعدة تطبقها.",
    points: ["المفاهيم مرتبة في محاور وفصول كما في مقررات كليات التربية", "خريطة ذهنية لكل فصل، ومقاطع مصورة لأهم المفاهيم", "سؤال تدريبي بعد كل مفهوم مع تفسير كل خيار"],
  },
  {
    slug: "classroom-situations", open: "sim", title: "المواقف الصفية", img: "/home/situations-v2.jpg",
    lead: "مواقف حقيقية من الصف تختار فيها تصرفك، ثم ترى أثره على الطلاب والمفهوم التربوي الذي يفسره.",
    points: ["مواقف في إدارة الصف والتعامل مع الطلاب وأولياء الأمور", "لكل خيار نتيجة وتفسير، لا إجابة صحيحة فقط", "تدريب مباشر على أسئلة المواقف في اختبارات التوظيف"],
  },
  {
    slug: "teaching-skills", open: "lab", title: "مهارات التدريس", img: "/home/skills-v2.jpg",
    lead: "مختبر لمهارات المعلم العملية: التهيئة، وطرح الأسئلة، والتعزيز، وإدارة الوقت، وغلق الدرس.",
    points: ["تمارين قصيرة لكل مهارة", "أمثلة لما يقوله المعلم ويفعله داخل الصف", "أدوات للقياس والتقويم في المكان نفسه"],
  },
  {
    slug: "lesson-plan", open: "studio", title: "خطة الدرس", img: "/home/plan-v2.jpg",
    lead: "اكتب خطة درس كاملة خطوة بخطوة: الأهداف، والتهيئة، والأنشطة، والتقويم، والواجب.",
    points: ["صياغة أهداف سلوكية قابلة للقياس", "قوالب جاهزة لاستراتيجيات تدريس مختلفة", "حفظ خططك والرجوع إليها"],
  },
  {
    slug: "assessment-tools", open: "measure", title: "أدوات القياس والتقويم", img: "/home/methods-v2.jpg",
    lead: "أدوات يحتاجها المعلم في التقويم: جدول المواصفات، وسلم التقدير، وتحليل البدائل، وحساب الثبات.",
    points: ["جدول مواصفات يوزع الأسئلة على الأهداف والمحتوى", "سلم تقدير وقائمة رصد قابلة للتعديل", "حساب معاملات الصعوبة والتمييز والثبات"],
  },
  {
    slug: "mind-maps", open: "mind", title: "الخرائط الذهنية", img: "/home/concepts-v2.jpg",
    lead: "خريطة ذهنية لكل فصل تربط مفاهيمه ببعضها، مع مقاطع مصورة بصوت عربي لأهم النظريات.",
    points: ["مراجعة فصل كامل في دقائق", "روابط تنقلك من الخريطة إلى شرح المفهوم", "مقاطع قصيرة لنظريات بياجيه وماسلو وفيجوتسكي وغيرها"],
  },
  {
    slug: "misconceptions", open: "myths", title: "أخطاء تربوية شائعة", img: "/home/methods-v2.jpg",
    lead: "أفكار منتشرة بين المعلمين والطلاب لا يدعمها البحث التربوي، مع التصحيح والدليل.",
    points: ["الخطأ الشائع، ثم ما يقوله البحث", "أمثلة توضح أثر الفكرة الخاطئة في الصف", "أسئلة تتحقق بها من فهمك"],
  },
  {
    slug: "flashcards", open: "flash", title: "البطاقات التعليمية", img: "/home/plan-v2.jpg",
    lead: "بطاقات للمراجعة السريعة: المفهوم على وجه، والتعريف على الوجه الآخر.",
    points: ["مراجعة في أي وقت ولو لدقيقتين", "تعيد عليك البطاقات التي نسيتها أكثر", "مرتبة بحسب المحور والفصل"],
  },
];

export const sectionBySlug = (slug: string) => APP_SECTIONS.find((s) => s.slug === slug);

/** تطبيع النص العربي للبحث: حذف التشكيل وتوحيد الألف والياء والتاء المربوطة */
export const normalizeAr = (t: string) =>
  t
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();

export function searchConcepts(q: string, limit = 40): Concept[] {
  const words = normalizeAr(q).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const scored: { c: Concept; s: number }[] = [];
  for (const c of publicBank().concepts) {
    const title = normalizeAr(c.title);
    const body = normalizeAr(c.explanation);
    let s = 0;
    for (const w of words) {
      if (title.includes(w)) s += 5;
      else if (body.includes(w)) s += 1;
      else { s = 0; break; }
    }
    if (s > 0) scored.push({ c, s });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.c);
}

/** أحدث المقالات: آخر ما أضيف إلى البنك */
export const latestConcepts = (n = 6) => publicBank().concepts.slice(-n).reverse();

/** مقالات مختارة: موزعة على المحاور بانتظام */
export function pickedConcepts(n = 6): Concept[] {
  const all = publicBank().concepts;
  const step = Math.floor(all.length / n);
  return Array.from({ length: n }, (_, i) => all[i * step + 7]).filter(Boolean);
}

export const excerpt = (c: Concept, n = 130) => summary(c.explanation, n);

/** مدة القراءة بالدقائق */
export function readMinutes(c: Concept) {
  const words = [c.explanation, ...(c.examples ?? [c.example]), c.rule ?? ""].join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}
