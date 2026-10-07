// دمج المفاهيم المكتملة في qbank.json — idempotent: يلمس المفاهيم المكتملة غير الموجودة فقط
// تشغيل: node scripts/merge_newconcepts.mjs
import fs from "fs";
import path from "path";

const ROOT = "/home/z/my-project";
const QBANK = path.join(ROOT, "src/data/qbank.json");
const NCDIR = path.join(ROOT, "src/data/generated/nc");
const SPEC = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/newconcepts.json"), "utf8")).concepts;

const qb = JSON.parse(fs.readFileSync(QBANK, "utf8"));
const hasDigit = (s) => /[0-9\u0660-\u0669]/.test(s);
const hasLatin = (s) => /[A-Za-z]/.test(s);
const norm = (s) => s.normalize("NFC").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();

const existingIds = new Set(qb.concepts.map((c) => c.id));
const existingTitles = new Set(qb.concepts.map((c) => norm(c.title)));
const existingQids = new Set(qb.questions.map((q) => q.id));

// نسخة احتياطية قبل أول دمج فقط (تبقى أصلية في كل مرة لاحقة إن لم توجد)
const bak = path.join(ROOT, "src/data/qbank.bak_newconcepts.json");
if (!fs.existsSync(bak)) fs.writeFileSync(bak, JSON.stringify(qb, null, 1));

// أكبر رقم مفهوم وسؤال حاليًا
let maxC = 0, maxQ = 0;
for (const c of qb.concepts) { const n = Number(c.id.replace("C", "")); if (n > maxC) maxC = n; }
for (const q of qb.questions) { const n = Number(q.id.replace("Q", "")); if (n > maxQ) maxQ = n; }

let added = 0, invalid = 0, pending = 0;
for (const spec of SPEC) {
  if (existingIds.has(spec.id) || existingTitles.has(norm(spec.title))) continue;
  const f = path.join(NCDIR, `${spec.id}.json`);
  if (!fs.existsSync(f)) { pending++; continue; }
  let st;
  try { st = JSON.parse(fs.readFileSync(f, "utf8")); } catch { pending++; continue; }
  if (!st.complete) { pending++; continue; }

  // تحقق صارم قبل الدمج
  const exs = Array.isArray(st.examples) ? st.examples : [];
  const qs = Array.isArray(st.questions) ? st.questions : [];
  const okExs = exs.length === 5 && exs.every((e) => typeof e === "string" && e.length >= 60 && !hasDigit(e) && !hasLatin(e));
  const okExpl = typeof st.explanation === "string" && st.explanation.length >= 60 && !hasDigit(st.explanation) && !hasLatin(st.explanation);
  const okQs = qs.length === 6 && qs.every((q) => {
    const opts = (q.options || []).map((o) => o.text);
    return opts.length === (q.type === "tf" ? 2 : 4) &&
      opts.filter((t) => t === q.correct).length === 1 &&
      q.options.filter((o) => o.isCorrect).length === 1 &&
      typeof q.reason === "string" && q.reason.length >= 15 &&
      [q.question, q.correct, q.reason, ...opts].every((t) => typeof t === "string" && !hasDigit(t) && !hasLatin(t));
  });

  if (!okExs || !okExpl || !okQs) { invalid++; console.log(`INVALID ${spec.id} (exs=${okExs}, expl=${okExpl}, qs=${okQs})`); continue; }

  const concept = {
    id: spec.id,
    courseId: spec.courseId,
    chapter: spec.chapter,
    title: spec.title,
    explanation: st.explanation.trim(),
    example: exs[0],
    examples: exs,
  };
  qb.concepts.push(concept);
  existingIds.add(spec.id);
  existingTitles.add(norm(spec.title));
  for (const q of qs) {
    maxQ++;
    const qid = `Q${maxQ}`;
    if (existingQids.has(qid)) { maxQ++; }
    qb.questions.push({
      id: qid,
      conceptId: spec.id,
      type: q.type,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      correct: q.correct,
      reason: q.reason,
    });
    existingQids.add(qid);
  }
  added++;
}

fs.writeFileSync(QBANK, JSON.stringify(qb, null, 1));
console.log(`added=${added} invalid=${invalid} pending=${pending} concepts=${qb.concepts.length} questions=${qb.questions.length}`);
