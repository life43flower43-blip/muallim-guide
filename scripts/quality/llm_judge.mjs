// حكم لغوي آلي بثلاث مهام: ترابط العينة + فيصل ة/ه + مراجعة العناوين
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const IN = '/home/z/my-project/scripts/quality/out/llm_inputs';
const OUT = '/home/z/my-project/scripts/quality/out';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const zai = await ZAI.create();

async function call(system, user) {
  for (let a = 0; a < 3; a++) {
    try {
      const c = await zai.chat.completions.create({
        messages: [{ role: 'assistant', content: system }, { role: 'user', content: user }],
        thinking: { type: 'disabled' },
      });
      return c.choices[0]?.message?.content || '';
    } catch (e) {
      await sleep(1500 * (a + 1));
    }
  }
  return '';
}

function parseLines(raw, need) {
  const out = [];
  if (!raw) return out;
  const clean = raw.replace(/```(json)?/g, '');
  for (const line of clean.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    try { out.push(JSON.parse(t)); } catch {}
  }
  return out;
}

async function pool(jobs, conc, fn) {
  let i = 0;
  const workers = Array.from({ length: conc }, async () => {
    while (true) {
      const my = i++;
      if (my >= jobs.length) return;
      await fn(jobs[my]);
    }
  });
  await Promise.all(workers);
}

// ============ المهمة ١: ترابط العينة ============
const sample = JSON.parse(fs.readFileSync(`${IN}/coherence_sample.json`, 'utf-8'));
const cohSys = 'أنت مدقق لغة عربية تربوي. لكل نص مرقّم أعيد سطراً واحداً بصيغة JSON فقط: {"id":"المعرف","clarity":عدد من 1 إلى 5,"issue":"سليم|جمل متداخلة طويلة|انقطاع ربط|تكرار وحشو|غموض|خلل لغوي"}. clarity=5 نص سلس واضح تماماً، 1 نص مربك متقطع يصعب فهمه. بلا أي شرح إضافي.';
const cohOut = `${OUT}/llm_coherence.jsonl`;
let cohDone = 0;
await pool(chunk(sample, 8), 3, async (group) => {
  const user = group.map((s, i) => `${i + 1}. [id=${s.id}]\n${s.text.slice(0, 900)}`).join('\n\n');
  const raw = await call(cohSys, user);
  for (const r of parseLines(raw)) {
    if (r && r.id) { fs.appendFileSync(cohOut, JSON.stringify({ id: String(r.id), clarity: r.clarity, issue: r.issue }) + '\n'); }
  }
  cohDone++;
  console.log(`coherence batch ${cohDone}`);
});

// ============ المهمة ٢: فيصل ة/ه ============
const heta = JSON.parse(fs.readFileSync(`${IN}/heta_contexts.json`, 'utf-8'));
const hSys = 'لكل سطر مرقّم: سياق فيه كلمة منتهية بهاء (بين «»). قرر بدقة: هل الهاء ضمير متصل صحيح (مثل: مشروعه أي المشروع الخاص به) أم خطأ إملائي والصواب تاء مربوطة؟ أعيد سطر JSON فقط لكل عنصر: {"i":الرقم,"verdict":"صحيح|خطأ","fix":"الصواب إن كانت خطأ وإلا فارغة"}. بلا شرح.';
const hOut = `${OUT}/llm_heta.jsonl`;
let hDone = 0;
await pool(chunk(heta, 12), 3, async (group) => {
  const user = group.map((h, i) => `${i + 1}. [token=${h.token}] …${h.context}…`).join('\n');
  const raw = await call(hSys, user);
  const rows = parseLines(raw);
  rows.forEach((r, k) => {
    if (r && typeof r.i !== 'undefined' && group[r.i - 1]) {
      fs.appendFileSync(hOut, JSON.stringify({ token: group[r.i - 1].token, right: group[r.i - 1].right, id: group[r.i - 1].id, context: group[r.i - 1].context, verdict: r.verdict, fix: r.fix }) + '\n');
    }
  });
  hDone++;
  console.log(`heta batch ${hDone}`);
});

// ============ المهمة ٣: مراجعة العناوين ============
const titles = JSON.parse(fs.readFileSync(`${IN}/titles.json`, 'utf-8'));
const tSys = 'أنت مدقق مصطلحات تربوية ونفسية بالعربية الفصحى. إليك قائمة عناوين مفاهيم مرقّمة. أعد فقط العناوين التي فيها خطأ إملائي واضح أو مصطلح محرَّف (مثل «التعق» بدل «التعلق»)، كل واحد بسطر JSON: {"i":الرقم,"title":"النص","fix":"التصحيح"}. السليم لا تذكره مطلقاً. لا تلمس أسلوب الصياغة ولا الاختصارات المقصودة.';
const tOut = `${OUT}/llm_titles.jsonl`;
let tDone = 0;
await pool(chunk(titles, 100), 3, async (group) => {
  const user = group.map((t, i) => `${i + 1}. [id=${t.id}] ${t.title}`).join('\n');
  const raw = await call(tSys, user);
  const rows = parseLines(raw);
  for (const r of rows) {
    if (r && typeof r.i !== 'undefined' && group[r.i - 1]) {
      fs.appendFileSync(tOut, JSON.stringify({ id: group[r.i - 1].id, title: r.title, fix: r.fix }) + '\n');
    }
  }
  tDone++;
  console.log(`titles batch ${tDone}/14`);
});

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

console.log('DONE — المخرجات في', OUT);
