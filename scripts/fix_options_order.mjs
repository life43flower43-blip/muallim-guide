// إصلاح: موازنة موضع الإجابة الصحيحة في أسئلة wave1/wave2 + شطب النقاط الختامية من العناوين
import fs from "node:fs";
const ROOT = "/home/z/my-project";
const P = `${ROOT}/src/data/qbank.json`;
fs.copyFileSync(P, `${ROOT}/src/data/qbank.bak_optorder.json`);
const qb = JSON.parse(fs.readFileSync(P, "utf8"));

// ١) موازنة المواضع: اختر موضع الصحيح الأقل استخداماً (تناوب عادل) ثم وزّع الباقي حوله
const used = [0, 0, 0, 0];
let moved = 0;
for (const q of qb.questions) {
  if (q.type !== "mcq") continue;
  const n = Number(q.conceptId.slice(1));
  if (n < 280) continue; // القديم متوازن نسبياً — لا نلمسه
  const correct = q.options.find((o) => o.isCorrect);
  const rest = q.options.filter((o) => !o.isCorrect);
  // الأقل استخداماً (مع كسر التعادل بالدوران)
  let target = 0;
  for (let i = 1; i < 4; i++) if (used[i] < used[target]) target = i;
  // رتب الباقي بترتيب ثابت ثم أدخل الصحيح في الموضع الهدف
  const arranged = [...rest];
  arranged.splice(target, 0, correct);
  // حرك البقية بترتيب دوّار ثابت لتفادي نمط قابل للتوقع
  const shift = (Number(q.id.slice(1)) + target) % rest.length;
  const before = arranged.slice(0, target);
  const after = arranged.slice(target + 1);
  const rot = (arr, s) => arr.map((_, i) => arr[(i + s) % arr.length]);
  const mixed = [...before, ...rot(after, shift)];
  const out = [...mixed.slice(0, target), correct, ...mixed.slice(target)];
  q.options = out;
  used[target]++;
  moved++;
}
console.log("أسئلة أعيد توزيع خياراتها:", moved, "| توزيع المواضع:", used.join("/"));

// ٢) شطب النقاط الختامية من العناوين
let fixedT = 0;
for (const c of qb.concepts) {
  const t = c.title.trim();
  if (/[.،؛]$/.test(t)) { c.title = t.replace(/[.،؛]+$/, "").trim(); fixedT++; console.log("  عنوان:", c.id, "→", c.title); }
}
fs.writeFileSync(P, JSON.stringify(qb, null, 1));
console.log("عناوين أُصلحت:", fixedT);

// ٣) المواصفة ونقاط الحفظ تتزامن مع العناوين
for (const f of ["newconcepts.json", "newconcepts2.json"]) {
  const fp = `${ROOT}/scripts/${f}`;
  const spec = JSON.parse(fs.readFileSync(fp, "utf8"));
  let n = 0;
  for (const c of spec.concepts) if (/[.،؛]$/.test(c.title.trim())) { c.title = c.title.trim().replace(/[.،؛]+$/, "").trim(); n++; }
  if (n) fs.writeFileSync(fp, JSON.stringify(spec, null, 1));
  console.log(`${f}: عناوين أُصلحت ${n}`);
}
for (const id of ["C491", "C508", "C564"]) {
  const fp = `${ROOT}/src/data/generated/nc/${id}.json`;
  if (!fs.existsSync(fp)) continue;
  const c = JSON.parse(fs.readFileSync(fp, "utf8"));
  c.title = c.title.trim().replace(/[.،؛]+$/, "").trim();
  fs.writeFileSync(fp, JSON.stringify(c, null, 1));
  console.log(`nc/${id}.json: عنوان منقح`);
}
