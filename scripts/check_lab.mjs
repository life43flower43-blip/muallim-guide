// مدقق بيانات مختبر المعلّم: بنية التفرع + قواعد النص الصارم
import fs from "node:fs";
import { LAB_SCENARIOS_A, LAB_SKILLS } from "/home/z/my-project/src/lib/lab-scenarios-a.ts";
import { LAB_SCENARIOS_B } from "/home/z/my-project/src/lib/lab-scenarios-b.ts";
import { LAB_SCENARIOS_C } from "/home/z/my-project/src/lib/lab-scenarios-c.ts";
import { LAB_EXAM_SCENARIOS } from "/home/z/my-project/src/lib/lab-exam.ts";
const qb = JSON.parse(fs.readFileSync("/home/z/my-project/src/data/qbank.json", "utf8"));
const conceptIds = new Set(qb.concepts.map((c) => c.id));

const bad = (s) => typeof s !== "string" || /[0-9\u0660-\u0669A-Za-z]/.test(s) || /[\u{1F000}-\u{1FAFF}\u{2600}-\u27BF}]/u.test(s) || s.includes('"');
const STAGES = ["الروضة", "الابتدائي", "المتوسط", "الثانوي"];
const trainIds = new Set([...LAB_SCENARIOS_A, ...LAB_SCENARIOS_B, ...LAB_SCENARIOS_C].map((s) => s.id));
const all = [...LAB_SCENARIOS_A, ...LAB_SCENARIOS_B, ...LAB_SCENARIOS_C, ...LAB_EXAM_SCENARIOS];
let errs = 0;

const ids = new Set(all.map((s) => s.id));
if (ids.size !== all.length) { console.log("× معرفات مكررة"); errs++; }
const skills = new Set(LAB_SKILLS);
for (const s of all) {
  const e = [];
  const isExam = s.id.startsWith("EX-");
  if (isExam && trainIds.has(s.id)) e.push("معرف اختبار يتداخل مع تدريبي");
  if (bad(s.title) || bad(s.skill) || bad(s.stage)) e.push("حقل رأسي مخالف");
  if (!skills.has(s.skill)) e.push(`كفاءة خارج القائمة: ${s.skill}`);
  if (!STAGES.includes(s.stage)) e.push(`مرحلة غير صالحة: ${s.stage}`);
  if (bad(s.intro) || s.intro.length < 100) e.push("مدخل قصير/مخالف");
  if (bad(s.end) || s.end.length < 100) e.push("خاتمة قصيرة/مخالفة");
  if (!Array.isArray(s.conceptIds) || !s.conceptIds.length) e.push("بلا مفاهيم");
  else for (const c of s.conceptIds) if (!conceptIds.has(c)) e.push(`مفهوم غير موجود: ${c}`);
  const nodes = Object.keys(s.nodes);
  if (!nodes.includes("start")) e.push("بلا عقدة بداية");
  const reached = new Set(["start"]);
  let changed = true;
  while (changed) { changed = false; for (const [k, nd] of Object.entries(s.nodes)) if (reached.has(k)) for (const o of nd.options) if (o.next !== "end" && !reached.has(o.next)) { reached.add(o.next); changed = true; } }
  for (const [k, nd] of Object.entries(s.nodes)) if (!reached.has(k)) e.push(`عقدة لا تصل: ${k}`);
  if (nodes.length < 3) e.push("عقد أقل من ثلاث");
  for (const [k, nd] of Object.entries(s.nodes)) {
    if (bad(nd.text)) e.push(`نص عقدة ${k} مخالف`);
    if (nd.options.length !== 3) e.push(`عقدة ${k}: خيارات ${nd.options.length}`);
    const texts = nd.options.map((o) => o.text);
    if (new Set(texts).size !== texts.length) e.push(`عقدة ${k}: خيارات مكررة`);
    const rs = nd.options.map((o) => o.rating).sort().join(",");
    if (rs !== "good,ok,poor") e.push(`عقدة ${k}: تقييمات ${rs}`);
    for (const o of nd.options) {
      if (bad(o.text) || bad(o.outcome)) e.push(`عقدة ${k}: نص مخالف`);
      if (o.text.length < 25 || o.outcome.length < 60) e.push(`عقدة ${k}: نص قصير`);
      if (o.next !== "end" && !s.nodes[o.next]) e.push(`عقدة ${k}: وجهة غير معروفة ${o.next}`);
    }
  }
  if (e.length) { errs += e.length; console.log(`× ${s.id} «${s.title}»:`, e.join("؛ ")); }
}
const examCount = LAB_EXAM_SCENARIOS.length;
console.log(errs ? `\nفشل: ${errs} ملاحظة` : `\nمقبول: ${all.length - examCount} موقف تدريبي و${examCount} مواقف اختبار استقلال — ${all.reduce((a, s) => a + Object.keys(s.nodes).length, 0)} عقدة قرار`);
if (errs) process.exit(1);
