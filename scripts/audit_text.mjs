// تدقيق نصوص qbank.json — يصلح الميكانيكي المؤكد ويوثّق ما يحتاج مراجعة بشرية/آلية
// الإصلاحات الميكانيكية فقط: كلمات مكررة متلاصقة (توقفات)، مسافات مزدوجة، مسافة قبل علامة ترقيم
// التقرير: src/data/generated/proof/audit.json
import fs from "fs";
import path from "path";

const ROOT = "/home/z/my-project";
const QBANK = path.join(ROOT, "src/data/qbank.json");
const PROOF = path.join(ROOT, "src/data/generated/proof");
if (!fs.existsSync(PROOF)) fs.mkdirSync(PROOF, { recursive: true });

const qb = JSON.parse(fs.readFileSync(QBANK, "utf8"));
// نسخة احتياطية قبل أي إصلاح
const bak = path.join(ROOT, `src/data/qbank.bak_audit_${new Date().toISOString().slice(0, 10)}.json`);
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(qb, null, 1));

// ---------- أدوات ----------
const DIGITS = /[0-9\u0660-\u0669]/;
const LATIN = /[A-Za-z]/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u27BF]/u;
const DOUBLED_STOP = /\b(في|من|على|عن|إلى|الى|التي|الذي|الذين|هو|هي|هم|ثم|أن|إن|مع|كل|ما|لا|قد|كان|كانت|وقد|والتي|والذي)\s+\1\b/g;
const DBL_SPACE = / {2,}/g;
const SPACE_BEFORE_PUNCT = /\s+([،؛.:!؟])/g;
const SPACE_AFTER_OPEN = /([(«])\s+/g;

const fixes = [];
const flags = [];
let fixCount = 0;

function walkTexts(fn) {
  for (const c of qb.concepts) {
    fn(`concept:${c.id}:title`, c, "title");
    fn(`concept:${c.id}:explanation`, c, "explanation");
    if (Array.isArray(c.examples)) c.examples.forEach((e, i) => fn(`concept:${c.id}:examples[${i}]`, c.examples, i));
    if (typeof c.example === "string") fn(`concept:${c.id}:example`, c, "example");
  }
  for (const q of qb.questions) {
    fn(`question:${q.id}:question`, q, "question");
    q.options.forEach((o, i) => fn(`question:${q.id}:options[${i}]`, q.options, i, o, "text"));
    fn(`question:${q.id}:correct`, q, "correct");
    fn(`question:${q.id}:reason`, q, "reason");
  }
}

function fixText(loc, obj, key, s, o, okey) {
  if (typeof s !== "string" || !s) return s;
  let t = s;
  const before = t;
  t = t.replace(DOUBLED_STOP, (m, w) => w);
  t = t.replace(DBL_SPACE, " ");
  t = t.replace(SPACE_BEFORE_PUNCT, "$1");
  t = t.replace(SPACE_AFTER_OPEN, "$1");
  t = t.replace(/\s+([،؛])/g, "$1").replace(/([،؛])(?=\S)/g, "$1 ");
  if (t !== before) {
    fixCount++;
    fixes.push({ loc, before: before.slice(0, 120), after: t.slice(0, 120) });
    if (o && okey) o[okey] = t;
    else if (Array.isArray(obj)) obj[key] = t;
    else obj[key] = t;
  }
  return t;
}

walkTexts((loc, obj, key, o, okey) => {
  const s = o && okey ? o[okey] : Array.isArray(obj) ? obj[key] : obj[key];
  const t = fixText(loc, obj, key, s, o, okey);
  // فحوص العلامات (لا إصلاح آلي — توثيق فقط)
  if (typeof t === "string" && t) {
    if (DIGITS.test(t)) flags.push({ loc, type: "digits", sample: t.slice(0, 100) });
    else if (LATIN.test(t)) flags.push({ loc, type: "latin", sample: t.slice(0, 100) });
    else if (EMOJI.test(t)) flags.push({ loc, type: "emoji", sample: t.slice(0, 100) });
  }
});

// ---------- فحوص بنيوية ----------
// عناوين مفاهيم مكررة
const titleMap = new Map();
for (const c of qb.concepts) {
  const k = c.title.trim();
  if (titleMap.has(k)) flags.push({ loc: `concept:${c.id}`, type: "duplicate-title", sample: `${k} == ${titleMap.get(k)}` });
  else titleMap.set(k, c.id);
}
// أسئلة مكررة نصًا
const qMap = new Map();
for (const q of qb.questions) {
  const k = q.question.trim();
  if (qMap.has(k)) flags.push({ loc: `question:${q.id}`, type: "duplicate-question", sample: `${k.slice(0, 60)} == ${qMap.get(k)}` });
  else qMap.set(k, q.id);
}
// خيارات مكررة داخل السؤال أو الصحيح غير حاضر
for (const q of qb.questions) {
  const opts = q.options.map((o) => (o && typeof o.text === "string" ? o.text.trim() : ""));
  if (new Set(opts).size !== opts.length)
    flags.push({ loc: `question:${q.id}`, type: "duplicate-options", sample: opts.join(" | ").slice(0, 100) });
  if (!opts.includes(String(q.correct || "").trim()))
    flags.push({ loc: `question:${q.id}`, type: "correct-missing-from-options", sample: String(q.correct || "").slice(0, 60) });
  const corr = q.options.filter((o) => o && o.isCorrect);
  if (corr.length !== 1)
    flags.push({ loc: `question:${q.id}`, type: "correct-flag-count", sample: String(corr.length) });
  if (corr.length === 1 && String(q.correct || "").trim() !== corr[0].text.trim())
    flags.push({ loc: `question:${q.id}`, type: "correct-field-mismatch", sample: `${q.correct} != ${corr[0].text}` });
  if (q.options.length < 2)
    flags.push({ loc: `question:${q.id}`, type: "too-few-options", sample: String(q.options.length) });
  if (typeof q.reason !== "string" || q.reason.trim().length < 15)
    flags.push({ loc: `question:${q.id}`, type: "reason-too-short", sample: (q.reason || "").slice(0, 60) });
}
// شرح قصير جدًا أو أمثلة ناقصة
for (const c of qb.concepts) {
  if (typeof c.explanation !== "string" || c.explanation.trim().length < 60)
    flags.push({ loc: `concept:${c.id}`, type: "explanation-too-short", sample: (c.explanation || "").slice(0, 60) });
}

fs.writeFileSync(QBANK, JSON.stringify(qb, null, 1));
fs.writeFileSync(
  path.join(PROOF, "audit.json"),
  JSON.stringify({ fixed: fixCount, fixes, flags, generatedAt: new Date().toISOString() }, null, 1)
);
console.log(`fixed=${fixCount} flags=${flags.length}`);
const byType = {};
for (const f of flags) byType[f.type] = (byType[f.type] || 0) + 1;
console.log("flagTypes:", JSON.stringify(byType));
