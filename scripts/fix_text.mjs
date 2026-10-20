// إصلاح الكتابات الخاطئة في qbank.json — أرقام رمزية إلى كلمات + إزالة الحروف اللاتينية
// كل إصلاح مكتوب صراحةً بسياقه (لا استبدال أعمى)، مع نسخة احتياطية وتحقق نهائي من خلو النصوص من الأرقام واللاتيني
import fs from "fs";
import path from "path";

const ROOT = "/home/z/my-project";
const QBANK = path.join(ROOT, "src/data/qbank.json");
const qb = JSON.parse(fs.readFileSync(QBANK, "utf8"));
const bak = path.join(ROOT, `src/data/qbank.bak_fix_${new Date().toISOString().slice(0, 10)}.json`);
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(qb, null, 1));

let fixes = 0;
const log = [];
function patch(loc, s, pairs) {
  if (typeof s !== "string") return s;
  let t = s;
  for (const [from, to] of pairs) {
    if (t.includes(from)) {
      t = t.split(from).join(to);
      fixes++;
      log.push({ loc, from: from.slice(0, 60), to: to.slice(0, 60) });
    }
  }
  return t;
}

// ---------- كلمات الأعداد (الأساسية فقط كما يلزم السياق) ----------
const FEM_UNITS = { "٣": "ثلاث", "٤": "أربع", "٥": "خمس", "٦": "ست", "٧": "سبع", "٨": "ثمان", "٩": "تسع", "١٠": "عشر" };
const MASC_YEARS = { "١٢": "اثني عشر", "١٣": "ثلاثة عشر", "١٤": "أربعة عشر", "١٥": "خمسة عشر", "١٦": "ستة عشر" };

function applyGlobal(t) {
  // الأعمار بين قوسين: (٥ سنوات) / (١٥ عامًا)
  t = t.replace(/\(\s*([٠-٩]+)\s*(سنوات|سنة|عامًا|عاماً|عام)\s*\)/g, (m, num, unit) => {
    if (unit === "سنوات" && FEM_UNITS[num]) return `(${FEM_UNITS[num]} سنوات)`;
    if (unit === "سنة" && num === "١٤") return "(أربع عشرة سنة)";
    if ((unit === "عامًا" || unit === "عاماً" || unit === "عام") && MASC_YEARS[num]) return `(${MASC_YEARS[num]} ${unit})`;
    return m;
  });
  // عمره/عمرها + رقم + سنوات
  t = t.replace(/(عمره|عمرها|عمر)\s+([٠-٩]+)\s+(سنوات|سنة)/g, (m, w, num, unit) => {
    if (FEM_UNITS[num]) return `${w} ${FEM_UNITS[num]} ${unit}`;
    if (unit === "سنة" && num === "١٤") return `${w} أربع عشرة سنة`;
    return m;
  });
  // النسب
  t = t.split("نسبة ٩:٣:٣:١").join("نسبة تسعة إلى ثلاثة إلى ثلاثة إلى واحد");
  t = t.split("نسبة ٣:١").join("نسبة ثلاثة إلى واحد");
  t = t.split("نسبة ٥٠٪").join("نسبة خمسين بالمئة");
  return t;
}

for (const c of qb.concepts) {
  c.title = applyGlobal(c.title);
  c.explanation = applyGlobal(c.explanation);
  if (Array.isArray(c.examples)) c.examples = c.examples.map(applyGlobal);
  if (typeof c.example === "string") c.example = applyGlobal(c.example);
}
for (const q of qb.questions) {
  q.question = applyGlobal(q.question);
  q.options = q.options.map((o) => ({ ...o, text: applyGlobal(o.text) }));
  q.correct = applyGlobal(q.correct);
  q.reason = applyGlobal(q.reason);
}

// ---------- إصلاحات صريحة بسياقها ----------
const explicit = [
  // معامل الذكاء — C051 (أمثلة المصفوفة)
  ["concept:C051:ex0", "معامل ذكاء البالغ ٨٥", "معامل ذكاء البالغ خمسة وثمانين"],
  ["concept:C051:ex1", "معامل ذكاء ٩٢", "معامل ذكاء قدره اثنان وتسعون"],
  ["concept:C051:ex2", "البالغة ٧٨", "البالغة ثمانٍ وسبعين"],
  ["concept:C051:ex3", "معامل ذكاء ٨٨", "معامل ذكاء قدره ثمانية وثمانون"],
  ["concept:C051:ex4", "معامل ذكاء ٨٣", "معامل ذكاء قدره ثلاثة وثمانون"],
  // Q315 — سؤال الترتيب: أرقام البنود إلى كلمات ترتيب
  ["question:Q315:question", "الأهداف الآتية: (١) هدف تفصيلي لحصة، (٢) غاية التربية الكلية، (٣) هدف عام للمرحلة. ما ترتيبها الصحيح من الأعم إلى الأدق؟", "الأهداف الثلاثة الآتية: أولها هدف تفصيلي لحصة، وثانيها غاية التربية الكلية، وثالثها هدف عام للمرحلة. ما ترتيبها الصحيح من الأعم إلى الأدق؟"],
  ["question:Q315:o0", "١ ثم ٢ ثم ٣", "الأول ثم الثاني ثم الثالث"],
  ["question:Q315:o1", "٢ ثم ٣ ثم ١", "الثاني ثم الثالث ثم الأول"],
  ["question:Q315:o2", "٣ ثم ٢ ثم ١", "الثالث ثم الثاني ثم الأول"],
  ["question:Q315:o3", "١ ثم ٣ ثم ٢", "الأول ثم الثالث ثم الثاني"],
  ["question:Q315:correct", "٢ ثم ٣ ثم ١", "الثاني ثم الثالث ثم الأول"],
  // Q865 / Q874
  ["question:Q865:o3", "ينامون ٨ ساعات مع من ينامون ٦ ساعات", "ينامون ثماني ساعات مع من ينامون ست ساعات"],
  ["question:Q874:reason", "الخياران ٢ و ٤", "الخياران الثاني والرابع"],
  ["question:Q874:reason", "الخيار ٣", "الخيار الثالث"],
  // C105 — رمز القسمة
  ["concept:C105:example", "ثم رسم الطلاب التوزيع بالدوائر على أوراقهم، وانتقلت أخيراً إلى الرمز ١٢÷٤=٣ بعد أن رأوه بأيديهم أولاً ثم على الورق.", "ثم رسم الطلاب التوزيع بالدوائر على أوراقهم، وانتقلت أخيراً إلى كتابة رمز القسمة على السبورة: اثنتا عشرة تقسَّم على أربعة يساوي ثلاثة، بعد أن رأوه بأيديهم أولاً ثم على الورق."],
  // C107 — الأعداد العشرية
  ["concept:C107:example", "فأعاد الدرس بمقارنة ٣٫٥ بـ ٣٫٧٥ على شريط قياس بالمتر", "فأعاد الدرس بمقارنة العدد ثلاثة ونصف بالعدد ثلاثة وسبعة وسبعين جزءًا من المئة على شريط قياس بالمتر"],
  // معامل الذكاء — أسئلة الإرشاد
  ["question:Q1353:question", "فحصل على درجة ٨٥", "فحصل على درجة خمسة وثمانين"],
  ["question:Q1354:question", "معامل ذكاء ١١٥", "معامل ذكاء مئة وخمسة عشر"],
  ["question:Q1356:question", "معامل ذكاء ٩٥", "معامل ذكاء خمسة وتسعين"],
  ["question:Q1356:o0", "أعلى من ٩٥", "أعلى من خمسة وتسعين"],
  ["question:Q1358:question", "معامل الذكاء ١٢٠", "معامل الذكاء البالغ مئةً وعشرين"],
  ["question:Q1358:question", "الذي حصل على ١٠٠", "الذي حصل على مئة"],
  ["question:Q1361:question", "معامل ذكاء ٩٠", "معامل ذكاء تسعين"],
  ["question:Q1363:question", "معامل ذكاء ١٠٥", "معامل ذكاء مئة وخمس"],
  ["question:Q1363:o3", "أعلى من ١١٠", "أعلى من مئة وعشرة"],
  ["question:Q1364:question", "معامل ذكاء ٩٥", "معامل ذكاء خمسة وتسعين"],
  ["question:Q593:reason", "هي ٣:١", "هي ثلاثة إلى واحد"],
  ["question:Q428:question", "مثل TIMSS و PISA", "الكبرى"],
  // اللاتيني — عناوين وأسئلة
  ["concept:C120:title", "الواقع الافتراضي VR في التعليم", "الواقع الافتراضي في التعليم"],
  ["concept:C121:title", "الواقع المعزز AR في التعليم", "الواقع المعزز في التعليم"],
  ["concept:C125:title", "منصات إدارة التعلم LMS", "منصات إدارة التعلم"],
  ["concept:C204:title", "الامتحانات الرسمية والدولية (TIMSS وPISA ووظائفها)", "الامتحانات الرسمية والدولية ووظائفها"],
];

const byLoc = (id) => id.split(":")[0] === "concept" ? qb.concepts.find((c) => c.id === id.split(":")[1]) : qb.questions.find((q) => q.id === id.split(":")[1]);

for (const [loc, from, to] of explicit) {
  const [kind, id, field] = loc.split(":");
  const obj = kind === "concept" ? qb.concepts.find((c) => c.id === id) : qb.questions.find((q) => q.id === id);
  if (!obj) { console.log("MISSING", loc); continue; }
  const hit = (setter) => { fixes++; log.push({ loc, from: from.slice(0, 60), to: to.slice(0, 60) }); setter(); };
  const has = (s) => typeof s === "string" && s.includes(from);

  if (field && /^o[0-3]$/.test(field)) {
    const i = Number(field[1]);
    if (has(obj.options[i]?.text)) hit(() => (obj.options[i].text = obj.options[i].text.split(from).join(to)));
  } else if (field === "correct") {
    if (has(String(obj.correct))) hit(() => (obj.correct = String(obj.correct).split(from).join(to)));
  } else if (field === "reason") {
    if (has(obj.reason)) hit(() => (obj.reason = obj.reason.split(from).join(to)));
  } else if (field === "example") {
    if (has(obj.example)) hit(() => (obj.example = obj.example.split(from).join(to)));
  } else if (field === "title") {
    if (has(obj.title)) hit(() => (obj.title = obj.title.split(from).join(to)));
  } else if (field && /^ex[0-9]$/.test(field)) {
    const i = Number(field[2]);
    if (has(obj.examples?.[i])) hit(() => (obj.examples[i] = obj.examples[i].split(from).join(to)));
  } else if (field === "question") {
    if (has(obj.question)) hit(() => (obj.question = obj.question.split(from).join(to)));
  } else {
    // بلا حقل: طبّق على كل الحقول النصية الرئيسية حيث وُجد المقطع
    if (has(obj.question)) hit(() => (obj.question = obj.question.split(from).join(to)));
    if (has(String(obj.correct))) hit(() => (obj.correct = String(obj.correct).split(from).join(to)));
    if (has(obj.reason)) hit(() => (obj.reason = obj.reason.split(from).join(to)));
    if (has(obj.title)) hit(() => (obj.title = obj.title.split(from).join(to)));
    if (has(obj.explanation)) hit(() => (obj.explanation = obj.explanation.split(from).join(to)));
  }
}

// ---------- تحقق نهائي: صفر أرقام وصفر لاتيني في كل النصوص ----------
const DIGITS = /[0-9\u0660-\u0669]/;
const LATIN = /[A-Za-z]/;
const remaining = [];
for (const c of qb.concepts) {
  const texts = [c.title, c.explanation, ...(c.examples || []), ...(c.example ? [c.example] : [])];
  for (const t of texts) if (typeof t === "string" && (DIGITS.test(t) || LATIN.test(t))) remaining.push(`concept:${c.id}: ${t.slice(0, 80)}`);
}
for (const q of qb.questions) {
  const texts = [q.question, q.correct, q.reason, ...q.options.map((o) => o.text)];
  for (const t of texts) if (typeof t === "string" && (DIGITS.test(t) || LATIN.test(t))) remaining.push(`question:${q.id}: ${t.slice(0, 80)}`);
}

fs.writeFileSync(QBANK, JSON.stringify(qb, null, 1));
fs.writeFileSync(path.join(ROOT, "src/data/generated/proof/fix_report.json"), JSON.stringify({ fixes, log, remaining }, null, 1));
console.log(`applied=${fixes} remaining-violations=${remaining.length}`);
for (const r of remaining.slice(0, 15)) console.log("REMAIN:", r);
