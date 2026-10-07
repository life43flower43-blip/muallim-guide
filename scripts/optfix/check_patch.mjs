import fs from 'fs';

// مدقق الرقع مقابل بنك الأسئلة — يطبع «patch_a: مقبول ن | مرفوض ن»
const AR = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

const usage = () => {
  const arg = process.argv[2] || 'patch_a.json';
  return arg.startsWith('/') ? arg : new URL('.', import.meta.url).pathname + arg;
};
const patchPath = usage();
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
const bank = JSON.parse(fs.readFileSync('/home/z/my-project/src/data/qbank.json','utf8'));
const targets = JSON.parse(fs.readFileSync(new URL('.', import.meta.url).pathname + 'targets.json','utf8'));
const byId = new Map(bank.questions.map(q => [q.id, q]));
const allowed = new Set(targets.a);

const hasDigit = /[\d\u0660-\u0669\u06F0-\u06F9\u066B\u066C]/;
const hasLatin = /[A-Za-z]/;
const hasEmoji = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
const BAD_FORM = /جميع ما سبق|كل ما سبق|لا شيء مما سبق|ولا مما سبق|جميع ما ذكر/;

const rejects = [];
for (const p of patch.patches) {
  const errs = [];
  const q = byId.get(p.id);
  if (!q) { rejects.push([p.id, 'معرف غير موجود في البنك']); continue; }
  if (!allowed.has(p.id)) errs.push('معرف خارج القائمة المسندة');
  if (q.type !== 'mcq') errs.push('نوع السؤال ليس اختيارياً');
  if (!Array.isArray(p.options)) { errs.push('خيارات غير مصفوفة'); rejects.push([p.id, errs.join('، ')]); continue; }
  if (p.options.length !== q.options.length) errs.push(`عدد الخيارات ${p.options.length} بدل ${q.options.length}`);
  // وحدة الصحيح وموضعه وتطابقه حرفياً
  const ciPatch = p.options.findIndex(o => o && o.isCorrect === true);
  const ciBank = q.options.findIndex(o => o.isCorrect === true);
  if (ciPatch < 0) errs.push('لا يوجد خيار صحيح واحد true');
  const trues = p.options.filter(o => o && o.isCorrect === true).length;
  if (trues !== 1) errs.push(`عدد الخيارات الصحيحة ${trues} بدل واحداً`);
  if (ciPatch >= 0 && ciBank >= 0 && ciPatch !== ciBank) errs.push(`موضع الصحيح ${ciPatch} بدل ${ciBank}`);
  if (ciPatch >= 0 && ciBank >= 0 && p.options[ciPatch].text !== q.options[ciBank].text) errs.push('نص الصحيح غير مطابق حرفياً');
  // سلامة النصوص وهامش الطول
  const cl = q.options[ciBank].text.length;
  for (let i = 0; i < p.options.length; i++) {
    const o = p.options[i];
    if (!o || typeof o.text !== 'string') { errs.push(`الخيار ${i} ناقص`); continue; }
    const t = o.text;
    if (typeof o.isCorrect !== 'boolean') errs.push(`الخيار ${i} بلا علم صواب`);
    if (hasDigit.test(t)) errs.push(`رقم في الخيار ${i}`);
    if (hasLatin.test(t)) errs.push(`حرف لاتيني في الخيار ${i}`);
    if (hasEmoji.test(t)) errs.push(`إيموجي في الخيار ${i}`);
    if (t.includes('"')) errs.push(`تنصيص ممنوع في الخيار ${i}`);
    if (/[\n\r\t]/.test(t)) errs.push(`سطر جديد في الخيار ${i}`);
    if (BAD_FORM.test(t)) errs.push(`صيغة ممنوعة في الخيار ${i}`);
    if (i !== ciPatch) {
      const margin = Math.abs(t.length - cl) / cl;
      if (margin > 0.30) errs.push(`هامش طول ${Math.round(margin * 100)}% في الخيار ${i}`);
    }
  }
  // تكرار نصوص داخل السؤال
  const texts = p.options.map(o => o.text);
  if (new Set(texts).size !== texts.length) errs.push('خياران متطابقان داخل السؤال');
  if (errs.length) rejects.push([p.id, errs.join('، ')]);
}
const idsPatched = new Set(patch.patches.map(p => p.id));
for (const id of allowed) if (!idsPatched.has(id)) rejects.push([id, 'رأقة مفقودة']);
if (idsPatched.size > allowed.size) rejects.push(['—', 'رقع زائدة خارج القائمة']);

const okCount = patch.patches.length - rejects.length;
const line = `patch_a: مقبول ${AR(okCount)} | مرفوض ${AR(rejects.length)}`;
console.log(line);
if (rejects.length) for (const [id, why] of rejects) console.log(' —', id, ':', why);
process.exit(rejects.length ? 1 : 0);
