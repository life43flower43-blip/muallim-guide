// مدقق وملتقط مخرجات وكلاء الكتابة → نقاط حفظ nc كاملة → جاهزة للدمج
// تشغيل: node scripts/nc_ingest.mjs [b01 b02 ... | all]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/home/z/my-project';
const DIR = `${ROOT}/scripts/nc_batch`;
const NCDIR = `${ROOT}/src/data/generated/nc`;
if (!fs.existsSync(NCDIR)) fs.mkdirSync(NCDIR, { recursive: true });

const spec = fs.readdirSync(`${ROOT}/scripts`)
  .filter(f => /^newconcepts\d*\.json$/.test(f)).sort()
  .flatMap(f => JSON.parse(fs.readFileSync(`${ROOT}/scripts/${f}`, 'utf8')).concepts);
const specById = new Map(spec.map(c => [c.id, c]));

const hasDigit = (s) => /[0-9\u0660-\u0669]/.test(s);
const hasLatin = (s) => /[A-Za-z]/.test(s);
const hasEmoji = (s) => /[\u{1F000}-\u{1FAFF}\u{2600}-\u27BF}]/u.test(s);
const bad = (s) => typeof s !== 'string' || hasDigit(s) || hasLatin(s) || hasEmoji(s);

const args = process.argv.slice(2);
const all = fs.readdirSync(DIR).filter(f => /^b\d+[a-z]?\.json$/.test(f) && !f.startsWith('spec'));
const files = (args.length && args[0] !== 'all')
  ? all.filter(f => args.some(a => f.startsWith(a)))
  : all;
if (!files.length) { console.log('لا ملفات مخرجات موجودة بعد.'); process.exit(0); }

// مفاهيم متعددة المصادر: دمج ملفات a/b لنفس الدفعة
const byBatch = {};
for (const f of files) {
  const b = f.match(/^b\d+/)[0];
  (byBatch[b] = byBatch[b] || []).push(f);
}

let okTotal = 0, failTotal = 0;
const seenTitles = new Map();
for (const [batch, flist] of Object.entries(byBatch).sort()) {
  const concepts = [];
  const parseErrors = [];
  for (const f of flist.sort()) {
    try {
      const j = JSON.parse(fs.readFileSync(`${DIR}/${f}`, 'utf8'));
      concepts.push(...(j.concepts || []));
    } catch (e) { parseErrors.push(`${f}: JSON غير صالح (${String(e.message).slice(0, 60)})`); }
  }
  const errors = [...parseErrors];
  const written = [];
  for (const c of concepts) {
    const errs = [];
    const sp = specById.get(c?.id);
    if (!sp) { errors.push(`${c?.id || '؟'}: معرف غير معروف`); continue; }
    if (typeof c.title !== 'string' || c.title.trim() !== sp.title) errs.push('العنوان لا يطابق المواصفة');
    const ex = c.explanation;
    if (bad(ex) || ex.trim().length < 60 || ex.length > 900) errs.push(`الشرح (${bad(ex) ? 'مخالف' : ex?.length})`);
    const exs = Array.isArray(c.examples) ? c.examples : [];
    if (exs.length !== 5) errs.push(`الأمثلة ${exs.length}/خمسة`);
    else if (exs.some(e => bad(e) || e.trim().length < 60 || e.length > 700)) errs.push('مثال مخالف/قصير');
    else if (new Set(exs.map(e => e.replace(/\s+/g, ' ').trim())).size !== 5) errs.push('أمثلة مكررة');
    const qs = Array.isArray(c.questions) ? c.questions : [];
    if (qs.length !== 6) errs.push(`الأسئلة ${qs.length}/ستة`);
    else {
      const mcq = qs.filter(q => q.type === 'mcq').length;
      const tf = qs.filter(q => q.type === 'tf').length;
      if (mcq !== 4 || tf !== 2) errs.push(`الأنواع mcq=${mcq} tf=${tf}`);
      for (const q of qs) {
        const opts = Array.isArray(q.options) ? q.options : [];
        const texts = opts.map(o => o?.text);
        const want = q.type === 'tf' ? 2 : 4;
        if (texts.length !== want) { errs.push(`سؤال بخيارات ${texts.length}/${want}`); break; }
        if (new Set(texts).size !== texts.length) { errs.push('خيارات مكررة'); break; }
        if (texts.filter(t => t === q.correct).length !== 1) { errs.push('الصحيح غير مطابق حرفيًا'); break; }
        if (opts.filter(o => o?.isCorrect).length !== 1) { errs.push('isCorrect ليس واحداً'); break; }
        if (texts.some(t => bad(t))) { errs.push('خيار مخالف (رقم/لاتيني)'); break; }
        if (bad(q.question) || q.question.trim().length < 5) { errs.push('نص سؤال مخالف'); break; }
        if (bad(q.reason) || q.reason.trim().length < 15) { errs.push('سبب مخالف/قصير'); break; }
        if (!['سهل', 'متوسط', 'صعب'].includes(q.difficulty)) { errs.push('صعوبة غير صالحة'); break; }
      }
      if (!errs.length) {
        const tfAnswers = qs.filter(q => q.type === 'tf').map(q => q.correct);
        if (new Set(tfAnswers).size === 1) errs.push('سؤالا صح/خطأ بنفس الإجابة');
        const key = (q) => q.question.replace(/\s+/g, ' ').trim();
        if (new Set(qs.map(key)).size !== 6) errs.push('أسئلة مكررة داخل المفهوم');
      }
    }
    if (errs.length) { errors.push(`${c.id} «${sp.title}»: ${errs.join('؛ ')}`); continue; }
    const dupKey = sp.title.replace(/\s+/g, ' ').trim();
    if (seenTitles.has(dupKey)) { errors.push(`${c.id} «${sp.title}»: مكتوب مرتين (${seenTitles.get(dupKey)})`); continue; }
    seenTitles.set(dupKey, c.id);
    fs.writeFileSync(path.join(NCDIR, `${sp.id}.json`), JSON.stringify({
      id: sp.id, title: sp.title, courseId: sp.courseId, chapter: sp.chapter,
      explanation: ex.trim(), examples: exs.map(e => e.replace(/\s+/g, ' ').trim()),
      questions: qs.map(q => ({
        type: q.type, difficulty: q.difficulty,
        question: q.question.trim(),
        options: (q.options || []).map(o => ({ text: String(o.text).trim(), isCorrect: !!o.isCorrect })),
        correct: q.correct, reason: q.reason.trim(),
      })),
      source: 'agent-wave', complete: true,
    }, null, 1));
    written.push(sp.id);
  }
  okTotal += written.length; failTotal += errors.length;
  console.log(`[${batch}] مكتوب: ${written.length} — أخطاء: ${errors.length}`);
  for (const e of errors.slice(0, 8)) console.log('   ✗', e);
  if (errors.length > 8) console.log(`   … و${errors.length - 8} أخرى`);
}
console.log(`\nالإجمالي: مقبول ${okTotal} | مرفوض ${failTotal}`);
console.log('التقاط تم — شغّل: node scripts/merge_newconcepts.mjs');
if (failTotal > 0) process.exit(1);
