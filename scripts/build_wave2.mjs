// بناء دفعة الاستكمال الثانية: الأقسام الجوهرية الغائبة كليًا من المسار أ
// المصدر: audit_missing_report.json (أسماء المستخدم حرفيًا من ملفاته المختارة)
// لا تأليف: فقط أسماء وردت في ملفات المستخدم، وبدون أي اسم موجود في البنك أو المدرج
import fs from 'node:fs';

const ROOT = '/home/z/my-project';

function norm(s) {
  return (s || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[-–—_:،.·«»"'(){}\[\]]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const qbank = JSON.parse(fs.readFileSync(`${ROOT}/src/data/qbank.json`, 'utf8'));
const wave1 = JSON.parse(fs.readFileSync(`${ROOT}/scripts/newconcepts.json`, 'utf8'));
const rep = JSON.parse(fs.readFileSync(`${ROOT}/scripts/audit_missing_report.json`, 'utf8'));

const taken = new Set();
for (const c of qbank.concepts) taken.add(norm(c.title));
for (const c of wave1.concepts) taken.add(norm(c.title));

// الأقسام المختارة: [دفعتها، بادئة اسم القسم كما في التقرير، المحور]
// المحاور: M1 نمو الطلاب | M2 المشاعر والذكاء | M3 كيف يتعلمون | M4 التقويم | M5 التدريس | G1 ثقافة تربوية
const CHOSEN = [
  // G1 — ثقافة تربوية (أقسام الغايدة والقيم والحماية والإرشاد)
  ['13', '20. التربية الأخلاقية وتكوين الشخصية', 'G1'],
  ['13', '27. التربية القانونية للطلاب', 'G1'],
  ['13', '26. العدالة وحقوق الإنسان في التعليم', 'G1'],
  ['13', '25. حقوق الطفل في التعليم', 'G1'],
  ['13', '24. التربية من أجل السلام', 'G1'],
  ['13', '1. الإرشاد النفسي المدرسي', 'G1'],
  ['13', '28. حماية الطفل في المدرسة', 'G1'],
  ['15', '116. مكافحة التنمر', 'G1'],
  // M5 — التدريس وإدارة الصف
  ['13', '29. الانضباط المدرسي المتقدم', 'M5'],
  ['13', '7. تنظيم الصف والمدرسة', 'M5'],
  ['16', '24. تعليم اللغة العربية', 'M5'],
  // M3 — كيف يتعلمون
  ['3', '3. علم التعلم المعرفي المتقدم', 'M3'],
  ['14', '9. الألعاب التعليمية المتقدمة', 'M3'],
  ['3', '9. الذكاء الاصطناعي التربوي المتقدم', 'M3'],
  ['3', '2. التقويم الذاتي والوعي بالتعلم', 'M3'],
  // M4 — التقويم
  ['3', '1. التقويم المتقدم للتعلم', 'M4'],
  ['13', '4. التقييم النفسي المدرسي', 'M4'],
  // M2 — المشاعر والذكاء والسلوك
  ['13', '22. التربية الوجدانية والقيمية', 'M2'],
  ['13', '30. التحليل الوظيفي للسلوك', 'M2'],
  // M1 — نمو الطلاب
  ['13', '21. مراحل النمو الأخلاقي', 'M1'],
  ['13', '6. الانتقال بين المراحل التعليمية', 'M1'],
];

const concepts = [];
const skipped = { inBank: 0, inQueue: 0, dupe: 0 };
const logDupes = [];

for (const [batch, prefix, course] of CHOSEN) {
  const sec = rep.find(r => r.batch === batch && r.section.startsWith(prefix.replace(/^\d+\.\s*/, '').slice(0, 15)) && r.section.includes(prefix.split('. ')[1]?.split(' — ')[0] || prefix));
  const target = rep.find(r => r.batch === batch && r.section.startsWith(prefix));
  const cleanName = prefix.replace(/^\d+\.\s*/, '');
  if (!target) { console.error('!! لم أعثر على القسم:', batch, prefix); continue; }

  for (const name of target.missingNames) {
    const nn = norm(name);
    if (taken.has(nn)) {
      // تمييز: هل هو بالبنك أم بالمدرج أم تكرار داخلي؟
      const inBank = qbank.concepts.some(c => norm(c.title) === nn);
      const inQ1 = wave1.concepts.some(c => norm(c.title) === nn);
      if (inBank) skipped.inBank++;
      else if (inQ1) skipped.inQueue++;
      else skipped.dupe++;
      logDupes.push(`[د${batch}] ${name} (${target.section.split(' —')[0]}) => ${inBank ? 'بالبنك' : inQ1 ? 'بالدفعة المدرجة' : 'تكرار داخلي'}`);
      continue;
    }
    taken.add(nn);
    concepts.push({ id: `C${321 + concepts.length}`, courseId: course, chapter: cleanName, title: name });
  }
}

const byChapter = {};
for (const c of concepts) {
  const k = `${c.courseId} | ${c.chapter}`;
  byChapter[k] = (byChapter[k] || 0) + 1;
}
console.log('=== دفعة الاستكمال الثانية ===');
console.log('إجمالي المفاهيم الجديدة:', concepts.length);
console.log('مستبعد (بالبنك):', skipped.inBank, '| (بالدفعة الأولى):', skipped.inQueue, '| (تكرار داخلي):', skipped.dupe);
console.log('\n=== التوزيع ===');
for (const [k, v] of Object.entries(byChapter)) console.log(`${k}: ${v}`);
if (logDupes.length) {
  console.log('\n=== التكرارات المستبعدة ===');
  for (const d of logDupes) console.log(' -', d);
}

fs.writeFileSync(`${ROOT}/scripts/newconcepts2.json`, JSON.stringify({
  note: 'دفعة الاستكمال الثانية — الأقسام الجوهرية الغائبة كليًا، أسماء المستخدم حرفيًا من ملفاته المختارة (docs/batch*_selected.md) بلا أي إضافة خارجية',
  concepts
}, null, 1));
console.log('\nحُفظ: scripts/newconcepts2.json');
