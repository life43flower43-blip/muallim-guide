// مدقق جودة عميق للبنك: تحيز الموضع، طول الصحيح، التكرار العابر للمفاهيم، القوالب، العناوين
import fs from "node:fs";
const qb = JSON.parse(fs.readFileSync("/home/z/my-project/src/data/qbank.json", "utf8"));
const norm = (s) => String(s).replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();

const grp = (id) => { const n = Number(id.slice(1)); return n <= 279 ? "old" : n <= 320 ? "wave1" : "wave2"; };

// ١) تحيز موضع الإجابة الصحيحة (mcq)
const posCount = { old: [0, 0, 0, 0], wave1: [0, 0, 0, 0], wave2: [0, 0, 0, 0] };
let longestRate = { old: [0, 0], wave1: [0, 0], wave2: [0, 0] }; // [correctIsLongest, total]
for (const q of qb.questions) {
  if (q.type !== "mcq") continue;
  const g = grp(q.conceptId);
  const ci = q.options.findIndex((o) => o.isCorrect);
  if (ci >= 0 && ci < 4) posCount[g][ci]++;
  const len = q.options.map((o) => o.text.length);
  longestRate[g][1]++;
  if (len[ci] === Math.max(...len) && len.filter((l) => l === len[ci]).length === 1) longestRate[g][0]++;
}
console.log("== موضع الصحيح (mcq) ==");
for (const g of ["old", "wave1", "wave2"]) {
  const t = posCount[g].reduce((a, b) => a + b, 0) || 1;
  const pc = posCount[g].map((x) => Math.round((x / t) * 100));
  const lr = longestRate[g];
  console.log(`${g}: مواضع٪=${pc.join("/")} | الصحيح الأطول=${lr[0]}/${lr[1]} (${Math.round((lr[0] / (lr[1] || 1)) * 100)}٪)`);
}

// ٢) أسئلة مكررة عابرة للمفاهيم
const qMap = new Map();
for (const q of qb.questions) { const k = norm(q.question); (qMap.get(k) || qMap.set(k, []).get(k)).push(q.id); }
const dupQ = [...qMap.entries()].filter(([, v]) => v.length > 1);
console.log("== أسئلة مكررة نصاً ==", dupQ.length);
dupQ.slice(0, 8).forEach(([k, v]) => console.log("  ×", v.join(" , "), "|", k.slice(0, 60)));

// ٣) أمثلة مكررة عابرة للمفاهيم
const eMap = new Map();
for (const c of qb.concepts) for (const e of c.examples || []) { const k = norm(e); (eMap.get(k) || eMap.set(k, []).get(k)).push(c.id); }
const dupE = [...eMap.entries()].filter(([, v]) => new Set(v).size > 1);
console.log("== أمثلة مكررة ==", dupE.length);
dupE.slice(0, 6).forEach(([, v]) => console.log("  ×", [...new Set(v)].join(" , ")));

// ٤) عناوين مفاهيم مكررة
const tMap = new Map();
for (const c of qb.concepts) { const k = norm(c.title); (tMap.get(k) || tMap.set(k, []).get(k)).push(c.id + ":" + c.chapter); }
const dupT = [...tMap.entries()].filter(([, v]) => v.length > 1);
console.log("== عناوين مكررة ==", dupT.length);
dupT.slice(0, 8).forEach(([k, v]) => console.log("  ×", k, "←", v.join(" , ")));

// ٥) عناوين بنقطة ختامية
const dotted = qb.concepts.filter((c) => /[.،؛]$/.test(c.title.trim()));
console.log("== عناوين بترقيم ختامي ==", dotted.length, dotted.map((c) => c.id).join(","));

// ٦) صحة/خطأ يفضح إجابته بنص السؤال
const tfLeak = qb.questions.filter((q) => q.type === "tf" && /(كتابة|^| )صح( |$|\.|،)/.test(q.question) === true && q.question.includes("صح"));
console.log("== tf نصه يتضمن كلمة صح ==", tfLeak.length, tfLeak.slice(0, 5).map((q) => q.id).join(","));

// ٧) مفاهيم بلا سؤال صعب
const noHard = [];
for (const c of qb.concepts) {
  if (Number(c.id.slice(1)) <= 279) continue;
  const qs = qb.questions.filter((q) => q.conceptId === c.id);
  if (qs.length && !qs.some((q) => q.difficulty === "صعب")) noHard.push(c.id);
}
console.log("== مفاهيم جديدة بلا سؤال صعب ==", noHard.length, noHard.slice(0, 12).join(","));

// ٨) قوالب مكررة: بدايات الشرح (أول ٣٠ حرفاً معيارياً)
const openMap = new Map();
for (const c of qb.concepts) { if (grp(c.id) !== "wave2") continue; const k = norm(c.explanation).slice(0, 30); (openMap.get(k) || openMap.set(k, 0).get(k)); openMap.set(k, openMap.get(k) + 1); }
const topOpen = [...openMap.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
console.log("== بدايات شرح متكررة في wave2 ==", topOpen.length);
topOpen.slice(0, 6).forEach(([k, n]) => console.log(`  ×(${n})`, k));

// ٩) سبب السؤال منسوخ حرفياً من الشرح
let reasonCopied = 0;
for (const c of qb.concepts) {
  if (grp(c.id) !== "wave2") continue;
  for (const q of qb.questions.filter((q) => q.conceptId === c.id)) if (norm(q.reason) === norm(c.explanation)) reasonCopied++;
}
console.log("== سبب منسوخ حرفياً من الشرح ==", reasonCopied);

// ١٠) خيارات mcq مكررة بين سؤالين بنفس المفهوم (نفس المجموعة رباعية)
let optSetDup = 0;
for (const c of qb.concepts) {
  if (grp(c.id) !== "wave2") continue;
  const sets = qb.questions.filter((q) => q.conceptId === c.id && q.type === "mcq").map((q) => q.options.map((o) => norm(o.text)).sort().join("‖"));
  optSetDup += sets.length - new Set(sets).size;
}
console.log("== مجموعات خيارات مكررة داخل مفهوم ==", optSetDup);
