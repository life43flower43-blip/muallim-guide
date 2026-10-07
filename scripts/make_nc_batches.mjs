// تقسيم طابور المفاهيم (wave1+wave2) إلى دفعات مواصفات للوكلاء الكتابيين
import fs from 'node:fs';

const ROOT = '/home/z/my-project';
const OUT = `${ROOT}/scripts/nc_batch`;
fs.mkdirSync(OUT, { recursive: true });

const spec = fs.readdirSync(`${ROOT}/scripts`)
  .filter(f => /^newconcepts\d*\.json$/.test(f)).sort()
  .flatMap(f => JSON.parse(fs.readFileSync(`${ROOT}/scripts/${f}`, 'utf8')).concepts)
  .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

const qb = JSON.parse(fs.readFileSync(`${ROOT}/src/data/qbank.json`, 'utf8'));

// نموذج مرجعي: أول مفهوم بالبنك لديه خمسة أمثلة وستة أسئلة على الأقل
const modelC = qb.concepts.find(c => Array.isArray(c.examples) && c.examples.length === 5);
const modelQs = qb.questions.filter(q => q.conceptId === modelC.id).slice(0, 6);
const model = {
  title: modelC.title,
  explanation: modelC.explanation,
  examples: modelC.examples,
  questions: modelQs.map(q => ({
    type: q.type, difficulty: q.difficulty, question: q.question,
    options: q.options, correct: q.correct, reason: q.reason,
  })),
};

const SIZE = 25;
const nbatches = Math.ceil(spec.length / SIZE);
const summary = [];
for (let i = 0; i < nbatches; i++) {
  const chunk = spec.slice(i * SIZE, (i + 1) * SIZE);
  const name = `b${String(i + 1).padStart(2, '0')}`;
  fs.writeFileSync(`${OUT}/spec_${name}.json`, JSON.stringify({
    batch: name, count: chunk.length, concepts: chunk, model,
  }, null, 1));
  const chaps = [...new Set(chunk.map(c => `${c.courseId}|${c.chapter}`))];
  summary.push(`${name}: ${chunk.length} مفهوماً — ${chunk[0].id}..${chunk[chunk.length - 1].id} (${chaps.length} موضوعات)`);
}
console.log('عدد الدفعات:', nbatches, '| المجموع:', spec.length);
for (const s of summary) console.log(' ', s);
