// دمج الأمثلة المولّدة في qbank.json — idempotent: يدمج المفاهيم التي تقل أمثلتها عن ٥ فقط
// تشغيل: node scripts/merge_examples.mjs
import fs from "fs";
import path from "path";

const ROOT = "/home/z/my-project";
const QBANK = path.join(ROOT, "src/data/qbank.json");
const EXDIR = path.join(ROOT, "src/data/generated/ex");
const BACKUP = path.join(ROOT, "src/data/qbank.backup-examples.json");
const TARGET = 5;

const qb = JSON.parse(fs.readFileSync(QBANK, "utf8"));
if (!fs.existsSync(BACKUP)) fs.writeFileSync(BACKUP, JSON.stringify(qb, null, 1));

let merged = 0, skipped = 0;
const distBefore = {};
for (const c of qb.concepts) {
  const cur = Array.isArray(c.examples) && c.examples.length > 0 ? c.examples : (c.example ? [c.example] : []);
  distBefore[cur.length] = (distBefore[cur.length] || 0) + 1;
  if (cur.length >= TARGET) { skipped++; continue; }
  const exFile = path.join(EXDIR, `${c.id}.json`);
  if (!fs.existsSync(exFile)) continue;
  let state;
  try { state = JSON.parse(fs.readFileSync(exFile, "utf8")); } catch { continue; }
  const extra = Array.isArray(state.examples) ? state.examples : [];
  if (extra.length === 0) continue;
  const final = [...cur];
  for (const e of extra) {
    if (final.length >= TARGET) break;
    if (typeof e === "string" && e.trim().length > 0 && !/[A-Za-z]/.test(e)) final.push(e.trim());
  }
  if (final.length === TARGET) {
    c.examples = final;
    if (!c.example) c.example = final[0];
    merged++;
  }
}

const distAfter = {};
for (const c of qb.concepts) {
  const n = (Array.isArray(c.examples) ? c.examples.length : 0) || (c.example ? 1 : 0);
  distAfter[n] = (distAfter[n] || 0) + 1;
}

fs.writeFileSync(QBANK, JSON.stringify(qb, null, 1));
console.log("distBefore:", JSON.stringify(distBefore));
console.log("distAfter:", JSON.stringify(distAfter));
console.log(`merged=${merged} skipped=${skipped} concepts=${qb.concepts.length}`);
