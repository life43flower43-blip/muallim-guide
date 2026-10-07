// جرد شامل: كل أسماء المستخدم المختارة (docs/batch*_selected.md) مقابل البنك + المدرج
// ينتج: scripts/audit_missing_report.json — أقسام كاملة غائبة + أسماء غائبة لكل قسم
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/home/z/my-project';

// تطبيع عربي (نفس منطق b15_match.py)
function norm(s) {
  return (s || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[-–—_:،.·«»"'(){}\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 1) البنك الحالي
const qbank = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/qbank.json'), 'utf8'));
const bankTitles = new Set(qbank.concepts.map(c => norm(c.title)));

// 2) المدرج (الـ41 الجديدة)
let queued = new Set();
try {
  const nc = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/newconcepts.json'), 'utf8'));
  for (const c of nc.concepts) queued.add(norm(c.title));
} catch {}

// 3) ملفات المختار
const selDir = path.join(ROOT, 'docs');
const selFiles = fs.readdirSync(selDir).filter(f => /^batch\d+_selected\.md$/.test(f) || f === 'taxonomy_batch12_selected.md');

// ترتيب الدفعات
const batchOrder = f => {
  const m = /(\d+)/.exec(f);
  return m ? +m[1] : 99;
};
selFiles.sort((a, b) => batchOrder(a) - batchOrder(b));

// 4) تحليل الملفات: أقسام ## وأسماء سطر مختار
const sections = []; // {batch, section, pathTrack, names:[{name, status}]}
let current = null;
for (const f of selFiles) {
  const batch = /(\d+)/.exec(f)[1];
  const text = fs.readFileSync(path.join(selDir, f), 'utf8');
  const lines = text.split('\n');
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^##\s+(.+)/.exec(line);
    if (h) {
      if (current && current.names.some(n => n.status === 'مختار')) sections.push(current);
      current = { batch, section: h[1].trim(), names: [] };
      continue;
    }
    if (!current) continue;
    const mk = /^\*\*مختار[^:]*:\*\*\s*(.*)$/.exec(line);
    if (mk) {
      // أسماء مفصولة بفواصل، قد تحمل [محتمل مكرر]
      for (let name of mk[1].split('،')) {
        name = name.trim().replace(/\s*\[محتمل مكرر\]\s*$/, '').trim();
        if (name && !name.startsWith('#')) current.names.push({ name, status: 'مختار' });
      }
      continue;
    }
    // سطور المكرر/المدمج لا نهتم بها (ليست مفاهيم مستقلة)
  }
  if (current && current.names.some(n => n.status === 'مختار')) { sections.push(current); current = null; }
}

// 5) المطابقة: مختار فقط
const report = [];
let totalSelected = 0, totalInBank = 0, totalQueued = 0, totalMissing = 0;
for (const sec of sections) {
  const missing = [], inBank = [], inQueue = [];
  for (const n of sec.names) {
    const nn = norm(n.name);
    if (bankTitles.has(nn)) inBank.push(n.name);
    else if (queued.has(nn)) inQueue.push(n.name);
    else missing.push(n.name);
  }
  totalSelected += sec.names.length;
  totalInBank += inBank.length;
  totalQueued += inQueue.length;
  totalMissing += missing.length;
  if (missing.length) report.push({
    batch: sec.batch, section: sec.section,
    total: sec.names.length, inBank: inBank.length, queued: inQueue.length, missing: missing.length,
    missingNames: missing
  });
}

report.sort((a, b) => b.missing - a.missing);

fs.writeFileSync(path.join(ROOT, 'scripts/audit_missing_report.json'), JSON.stringify(report, null, 1));

// ملخص طباعي
console.log('=== الملخص العام ===');
console.log('إجمالي مختار المستخدم:', totalSelected);
console.log('في البنك:', totalInBank, '| مدرج بالفعل:', totalQueued, '| غائب:', totalMissing);
console.log('أقسام بها غائب:', report.length);
console.log('\n=== أكبر 40 قسمًا غائبًا ===');
for (const r of report.slice(0, 40)) {
  console.log(`[د${r.batch}] ${r.section} — غائب ${r.missing}/${r.total}`);
}
console.log('\nالتقرير الكامل: scripts/audit_missing_report.json');
