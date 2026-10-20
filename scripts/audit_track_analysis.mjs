// تحليل تقرير الغائب حسب المسار لاختيار دفعة الاستكمال
import fs from 'node:fs';
const rep = JSON.parse(fs.readFileSync('/home/z/my-project/scripts/audit_missing_report.json', 'utf8'));

const trackOf = s => {
  if (/المسار:\s*(\S+)/.exec(s)) return /المسار:\s*(\S+)/.exec(s)[1];
  if (s.includes('✅') || s.includes('✳')) return 'أ'; // taxonomy_batch12 الافتراضي أ
  return '؟';
};

const byTrack = {};
for (const r of rep) {
  const t = trackOf(r.section);
  byTrack[t] = byTrack[t] || { sections: 0, missing: 0 };
  byTrack[t].sections++;
  byTrack[t].missing += r.missing;
}
console.log('=== حسب المسار ===');
for (const [t, v] of Object.entries(byTrack)) console.log(`${t}: ${v.sections} قسماً، ${v.missing} اسماً غائباً`);

// مسار أ فقط: أقسام مرتبة
const trackA = rep.filter(r => trackOf(r.section).startsWith('أ'))
  .sort((a, b) => b.missing - a.missing);
console.log('\n=== أقسام المسار أ (غائب ≥ ١٠):', trackA.filter(r => r.missing >= 10).length, 'قسماً ===');
let sum = 0;
for (const r of trackA.filter(r => r.missing >= 10)) { sum += r.missing; }
console.log('إجمالي أسمائها:', sum);
console.log('\n=== أقسام المسار أ (غائب ≥ ١٢):', trackA.filter(r => r.missing >= 12).length, 'قسماً ===');
sum = 0;
for (const r of trackA.filter(r => r.missing >= 12)) sum += r.missing;
console.log('إجمالي أسمائها:', sum);

// أقسام ٥-٩
const small = trackA.filter(r => r.missing >= 5 && r.missing < 10);
console.log('\n=== أقسام المسار أ (٥-٩):', small.length, 'قسماً، إجمالي', small.reduce((s, r) => s + r.missing, 0), '===');
for (const r of small) console.log(`  ${r.missing} — ${r.section}`);
