// تطبيق رقع إثراء البدائل بتحقق مستقل صارم (لا ثقة بالمدقق الخارجي)
import fs from "node:fs";
const ROOT = "/home/z/my-project";
const P = `${ROOT}/src/data/qbank.json`;
fs.copyFileSync(P, `${ROOT}/src/data/qbank.bak_optenrich.json`);
const qb = JSON.parse(fs.readFileSync(P, "utf8"));
const byId = new Map(qb.questions.map((q) => [q.id, q]));
const bad = (s) => typeof s !== "string" || /[0-9\u0660-\u0669A-Za-z]/.test(s) || /[\u{1F000}-\u{1FAFF}\u{2600}-\u27BF}]/u.test(s);

const file = process.argv[2] || "patch_a.json";
const patch = JSON.parse(fs.readFileSync(`${ROOT}/scripts/optfix/${file}`, "utf8"));
let ok = 0, rej = [];
for (const p of patch.patches) {
  const q = byId.get(p.id);
  const errs = [];
  if (!q) errs.push("سؤال غير موجود");
  else if (q.type !== "mcq") errs.push("ليس mcq");
  else {
    if (!Array.isArray(p.options) || p.options.length !== 4) errs.push("الخيارات ليست أربعة");
    else {
      const texts = p.options.map((o) => o.text);
      if (new Set(texts).size !== 4) errs.push("خيارات مكررة");
      if (p.options.filter((o) => o.isCorrect).length !== 1) errs.push("isCorrect ليس واحداً");
      const curC = q.options.find((o) => o.isCorrect)?.text;
      const newC = p.options.find((o) => o.isCorrect)?.text;
      if (curC !== newC) errs.push("نص الصحيح تغير");
      // موضع الصحيح كما هو
      if (q.options.findIndex((o) => o.isCorrect) !== p.options.findIndex((o) => o.isCorrect)) errs.push("موضع الصحيح تغير");
      if (texts.some((t) => bad(t))) errs.push("نص مخالف");
      // هامش الطول بعد الإصلاح
      const L = texts.map((t) => t.length);
      const ci = p.options.findIndex((o) => o.isCorrect);
      const mo = Math.max(...L.filter((_, i) => i !== ci));
      if ((L[ci] - mo) / Math.max(mo, 1) > 0.3) errs.push(`هامش ${Math.round(((L[ci] - mo) / mo) * 100)}٪`);
    }
  }
  if (errs.length) { rej.push(`${p.id}: ${errs.join("؛")}`); continue; }
  q.options = p.options.map((o) => ({ text: o.text.trim(), isCorrect: !!o.isCorrect }));
  ok++;
}
fs.writeFileSync(P, JSON.stringify(qb, null, 1));
console.log(`${file}: مطبق ${ok} | مرفوض ${rej.length}`);
rej.slice(0, 6).forEach((r) => console.log("  ✗", r));
if (rej.length) process.exit(1);
