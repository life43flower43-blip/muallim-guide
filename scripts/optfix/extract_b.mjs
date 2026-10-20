// سكربت مؤقت: يستخرج أسئلة الحقل b فقط من البنك إلى ملف خفيف للقراءة
import fs from 'fs';
const bank = JSON.parse(fs.readFileSync('/home/z/my-project/src/data/qbank.json', 'utf8'));
const targets = JSON.parse(fs.readFileSync('/home/z/my-project/scripts/optfix/targets.json', 'utf8'));
const ids = targets.b;
const byId = new Map(bank.questions.map(q => [q.id, q]));
const out = [];
const missing = [];
for (const id of ids) {
  const q = byId.get(id);
  if (!q) { missing.push(id); continue; }
  out.push({
    id: q.id,
    conceptId: q.conceptId,
    type: q.type,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    correct: q.correct,
    reason: q.reason,
  });
}
fs.writeFileSync('/home/z/my-project/scripts/optfix/b_pool.json', JSON.stringify(out, null, 1), 'utf8');
console.log('extracted:', out.length, 'missing:', JSON.stringify(missing));
const types = {};
for (const q of out) types[q.type] = (types[q.type] || 0) + 1;
console.log('types:', JSON.stringify(types));
const optCounts = {};
for (const q of out) optCounts[q.options.length] = (optCounts[q.options.length] || 0) + 1;
console.log('optionCounts:', JSON.stringify(optCounts));
