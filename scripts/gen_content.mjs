// توليد ٥ أمثلة واقعية + أسئلة جديدة لكل مفهوم — ٣ نداءات صغيرة لكل مفهوم (تجنب قطع JSON)
// تشغيل: node scripts/gen_content.mjs   |   اختبار: GEN_LIMIT=1 node scripts/gen_content.mjs
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const ROOT = "/home/z/my-project";
const QBANK = path.join(ROOT, "src/data/qbank.json");
const OUTDIR = path.join(ROOT, "src/data/generated");
const LOG = path.join(OUTDIR, "progress.log");
const N_EXAMPLES = 5;
const ASK_EX = 6;
const N_QUESTIONS = 16;
const BATCH = 10; // أسئلة لكل نداء (نداءان)
const CONCURRENCY = 3;
// سقف زمني لكل دفعة (بالميلي ثانية) — يخرج بنعومة قبل مهلة القوقعة، ويستأنف لاحقاً من checkpoints
const DEADLINE_MS = Number(process.env.GEN_DEADLINE_MS || 0);

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + "\n");
};

const qb = JSON.parse(fs.readFileSync(QBANK, "utf8"));
const courseName = Object.fromEntries(Object.entries(qb.courses));
const qsByConcept = new Map();
for (const q of qb.questions) {
  if (!qsByConcept.has(q.conceptId)) qsByConcept.set(q.conceptId, []);
  qsByConcept.get(q.conceptId).push(q.question);
}

// ---------- تطبيع عربي وفحص تشابه ----------
function normAr(s) {
  return (s || "")
    .normalize("NFC")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[^\u0621-\u064A0-9]/g, " ")
    .replace(/\s+/g, " ").trim().toLowerCase();
}
const STOP = new Set("في من على عن الى إلى التي الذي هذا هذه ذلك مع او أو ثم حتى كل بعض غير نعم لا هل ما ماذا كيف لماذا عندما بين بينما عبر لدى لكن لكنه بل إذ إذا لان لأن ان أن يكون تكون كان كانت هي هو هم هن أنت أنا نحن وقد ولم لما له لها لهم فيه فيها منها منه عليه عليها".split(/\s+/));
function toks(s) {
  return normAr(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));
}
function jac(a, b) {
  const A = new Set(a), B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}
function fingerprint(q) { return normAr(q).slice(0, 90); }

// ---------- البرومبتات ----------
const BASE_RULES = `قواعد لغة صارمة:
- كل النص بالعربية الفصحى الواضحة. ممنوع أي كلمة إنجليزية أو حرف لاتيني.
- الأرقام دائمًا بالأرقام العربية الهندية (٠١٢٣٤٥٦٧٨٩) لا اللاتينية.
- ممنوع الرموز التعبيرية. ممنوع أخطاء إملائية أو نحوية أو صرفية: دقّق كل جملة قبل كتابتها (قل «والدتها» لا «والدتيها»، ووافق الفعل مع الفاعل، وأصب الممنوع من الصرف والمثنى وجمع المذكر السالم).
- ممنوع تسمية مدارس أو شركات أو علامات تجارية. يُسمى الأشخاص بأسماء عربية عامة (سارة، ريان، المعلمة هدى...).

قواعد أمثلة صارمة:
- كل مثال موقف واقعي من مدرسة حقيقية: معلم داخل صفه، طالب، ولي أمر، امتحان، حصة، نشاط، سلوك صفّي — يجسّد المفهوم في أحداثه وظروفه الفعلية، لا تعريف مجرد.
- كل مثال مختلف عن الآخر: زوايا متنوعة (رياض أطفال/ابتدائي/متوسط/ثانوي، موقف صفّي/تقويمي/أسري/إداري، أو خطأ شائع يصحّحه المفهوم).`;

function ctxBlock(c) {
  const existingQs = (qsByConcept.get(c.id) || []).map((q, i) => `${i + 1}. ${q.question}`).join("\n");
  return `المفهوم: «${c.title}»
المحور: ${courseName[c.courseId]} — الموضوع: ${c.chapter}
الشرح المرجعي:
${c.explanation}
المثال المرجعي الحالي (لا تقربه بصياغة مشابهة، استخرج منه فهم المفهوم فقط):
${c.example}
الأسئلة الموجودة مسبقًا لهذا المفهوم — ممنوع تكرار معناها أو صياغة قريبة منها:
${existingQs || "لا أسئلة سابقة"}`;
}

function exPrompt(c) {
  return `${ctxBlock(c)}

مهمتك: اكتب ${ASK_EX} أمثلة واقعية للمفهوم «${c.title}». كل مثال من ٣ إلى ٥ جمل بموقف محدد (بأسماء أشخاص ومرحلة تعليمية وسير أحداث) يجسّد المفهوم في أحداثه وظروفه، والزوايا مختلفة تمامًا عن بعضها.

${BASE_RULES}

أعد JSON فقط بلا أي شرح أو أسوار كود، بالبنية:
{"examples": ["مثال ١", "مثال ٢", "مثال ٣", "مثال ٤", "مثال ٥", "مثال ٦"]}`;
}

function qPrompt(c, batchNo, avoidTexts) {
  const angles = batchNo === 1
    ? "ركّز في هذه الدفعة على: موقف صفّي يُشخّصه المعلم، تمييز المفهوم عن مفهوم قريب، وتطبيق في التقويم أو التخطيط للدرس."
    : "ركّز في هذه الدفعة على: خطأ شائع لدى المعلمين يصحّحه المفهوم، استنتاج معالجة تربوية من حالة، وربط المفهوم بتفاعل أسري أو مدرسي أوسع.";
  const avoid = avoidTexts.length ? `\nأسئلة وُلّدت في الدفعة السابقة لهذا المفهوم — ممنوع الاقتراب من معناها:\n${avoidTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}` : "";
  return `${ctxBlock(c)}${avoid}

مهمتك: اكتب ${BATCH} أسئلة اختيار من متعدد جديدة كليًا للمفهوم «${c.title}». ${angles}
كل سؤال زاوية مختلفة عن بقية الأسئلة. المشتتات معقولة ومقنعة لكنها خاطئة قطعًا. توزيع الصعوبة تقريبيًا: ثلث «سهل»، ثلث «متوسط»، ثلث «صعب».

${BASE_RULES}

قواعد أسئلة صارمة:
- نص السؤال ٢٥ إلى ٤٠٠ حرف. الخيارات من كلمة إلى ٢٥٠ حرفًا.
- «reason» سطران: لماذا الصحيح صحيح، ولمَ أبرز المشتتات خاطئة.

أعد JSON فقط بلا أي شرح أو أسوار كود، بالبنية:
{"questions": [{"question": "نص السؤال", "difficulty": "سهل", "options": ["الخيار الصحيح أولاً لا يشترط", "خيار", "خيار", "خيار"], "correctIndex": 0, "reason": "التوجيه"}]}`;
}

// ---------- نداء عام ----------
function safeParse(txt) {
  if (!txt) return null;
  let t = txt.trim().replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

async function askJSON(zai, sys, user, tag) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: sys },
            { role: "user", content: user },
          ],
          thinking: { type: "disabled" },
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 180000)),
      ]);
      const txt = completion?.choices?.[0]?.message?.content;
      const parsed = safeParse(txt);
      if (parsed) return parsed;
      throw new Error(`unparseable (len=${txt ? txt.length : 0})`);
    } catch (e) {
      log(`${tag} FAIL attempt=${attempt}: ${String(e.message || e).slice(0, 140)}`);
      await new Promise((r) => setTimeout(r, 8000 * attempt));
    }
  }
  return null;
}

function isCleanArabic(s, min, max) {
  return typeof s === "string" && s.trim().length >= min && s.trim().length <= max && !/[A-Za-z]/.test(s);
}

// ---------- مفهوم واحد ----------
async function genConcept(zai, c) {
  const outFile = path.join(OUTDIR, `${c.id}.json`);
  let state = { examples: [], questions: [] };
  if (fs.existsSync(outFile)) {
    try { state = JSON.parse(fs.readFileSync(outFile, "utf8")); } catch { state = { examples: [], questions: [] }; }
  }
  if (state.examples.length >= N_EXAMPLES && state.questions.length >= N_QUESTIONS) return { id: c.id, skipped: true };

  // ١) الأمثلة
  if (state.examples.length < N_EXAMPLES) {
    const out = await askJSON(zai, `أنت خبير تربوي ومحرر محتوى تعليمي عربي فصيح.\n${BASE_RULES}`, exPrompt(c), `${c.id}-أمثلة`);
    const seen = [];
    const arr = Array.isArray(out?.examples) ? out.examples : [];
    for (const e of arr) {
      if (!isCleanArabic(e, 80, 700)) continue;
      const s = e.trim();
      const n = toks(s);
      if (seen.some((p) => jac(p, n) > 0.7)) continue;
      seen.push(n);
      state.examples.push(s);
      if (state.examples.length >= N_EXAMPLES) break;
    }
    fs.writeFileSync(outFile, JSON.stringify(state, null, 1));
    if (state.examples.length < N_EXAMPLES) {
      log(`${c.id} PARTIAL examples=${state.examples.length}`);
      return { id: c.id, failed: true };
    }
  }

  // ٢) الأسئلة — دفعتان
  while (state.questions.length < N_QUESTIONS) {
    const batchNo = state.questions.length === 0 ? 1 : 2;
    const avoid = state.questions.map((q) => q.question);
    const out = await askJSON(zai, `أنت خبير تربوي ومتخصص بنوك أسئلة اختيار من متعدد للتربية والتعليم.\n${BASE_RULES}`, qPrompt(c, batchNo, avoid), `${c.id}-أسئلة${batchNo}`);
    const arr = Array.isArray(out?.questions) ? out.questions : [];
    let added = 0;
    for (const q of arr) {
      if (state.questions.length >= N_QUESTIONS) break;
      if (!q || !isCleanArabic(q.question, 25, 500)) continue;
      const text = q.question.trim();
      if (!Array.isArray(q.options) || q.options.length !== 4) continue;
      if (!q.options.every((o) => isCleanArabic(o, 1, 300))) continue;
      const ci = Number(q.correctIndex);
      if (!Number.isInteger(ci) || ci < 0 || ci > 3) continue;
      const diff = ["سهل", "متوسط", "صعب"].includes(q.difficulty) ? q.difficulty : "متوسط";
      const reason = isCleanArabic(q.reason, 10, 600) ? q.reason.trim() : "الإجابة الصحيحة تنطبق على المفهوم، أما بقية الخيارات فتنطبق على مفاهيم أخرى أو على فهم خاطئ شائع.";
      const t = toks(text);
      let dup = state.questions.some((x) => jac(toks(x.question), t) > 0.72);
      if (!dup) for (const eq of qsByConcept.get(c.id) || []) {
        if (fingerprint(eq) === fingerprint(text) || jac(toks(eq), t) > 0.72) { dup = true; break; }
      }
      if (dup) continue;
      state.questions.push({ question: text, difficulty: diff, options: q.options.map((o) => o.trim()), correctIndex: ci, reason });
      added++;
    }
    fs.writeFileSync(outFile, JSON.stringify(state, null, 1));
    if (added === 0) break; // لا تقدم — لا تكرر بلا نهاية
  }

  if (state.questions.length >= N_QUESTIONS) {
    log(`${c.id} OK — أمثلة ${state.examples.length}، أسئلة ${state.questions.length}`);
    return { id: c.id, ok: true };
  }
  log(`${c.id} PARTIAL — أمثلة ${state.examples.length}، أسئلة ${state.questions.length}`);
  return { id: c.id, failed: true };
}

// ---------- المجمّع ----------
async function main() {
  const zai = await ZAI.create();
  const limit = Number(process.env.GEN_LIMIT || 0);
  const from = Number(process.env.GEN_FROM || 0);
  const to = Number(process.env.GEN_TO || 0);
  let slice = qb.concepts;
  if (limit > 0) slice = slice.slice(0, limit);
  if (from > 0 || to > 0) slice = slice.slice(from, to > 0 ? to : undefined);
  const todo = slice;
  log(`START — مفاهيم: ${todo.length}، توازي: ${CONCURRENCY}`);
  let done = 0, failed = 0, skipped = 0, processed = 0;
  const started = Date.now();
  const queue = [...todo];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      if (DEADLINE_MS && Date.now() - started > DEADLINE_MS) { log(`DEADLINE — متبقٍ في الطابور: ${queue.length}`); break; }
      const c = queue.shift();
      if (!c) break;
      const r = await genConcept(zai, c);
      processed++;
      if (r.skipped) skipped++;
      else if (r.failed) failed++;
      else done++;
      if (processed % 5 === 0 || processed === todo.length) {
        log(`PROGRESS ${processed}/${todo.length} (${Math.round((processed / todo.length) * 100)}%) — ok=${done} failed=${failed} skipped=${skipped}`);
      }
    }
  });
  await Promise.all(workers);
  log(`DONE — ok=${done} failed=${failed} skipped=${skipped}`);
  fs.writeFileSync(path.join(OUTDIR, "_done.flag"), new Date().toISOString());
}

// حماية من الانهيار الصامت — كل استثناء يُسجّل في اللوج
process.on("unhandledRejection", (e) => log("UNHANDLED " + (e?.stack || String(e)).slice(0, 300)));
process.on("uncaughtException", (e) => { log("UNCAUGHT " + (e?.stack || String(e)).slice(0, 300)); });

// نبض دوري — يثبت أن العملية حية
setInterval(() => log("HEARTBEAT"), 60000);

main().catch((e) => { log("FATAL " + String(e?.stack || e)); process.exit(1); });
