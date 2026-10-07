// توليد أمثلة متدرجة (٤ إضافية → المجموع ٥) لكل مفهوم ينقصه الأمثلة في qbank.json
// المستخدم: «٥ أمثلة متدرجة ومتكاملة ومختلفة حسب المفهوم لكل مفهوم» — التدرج من الأسهل إلى الأعمق.
// تشغيل: node scripts/gen_examples.mjs   (يستأنف من نقاط الحفظ تلقائيًا)
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const ROOT = "/home/z/my-project";
const QBANK = path.join(ROOT, "src/data/qbank.json");
const OUTDIR = path.join(ROOT, "src/data/generated/ex");
const LOG = path.join(OUTDIR, "progress.log");
const TARGET = 5;          // العدد النهائي لكل مفهوم
const ASK = 5;             // نطلب ٥ لنبقي أفضل ٤ بعد الفحص
const CONCURRENCY = Number(process.env.GEN_CONC || 3);
const DEADLINE_MS = Number(process.env.GEN_DEADLINE_MS || 0);

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + "\n");
};

const qb = JSON.parse(fs.readFileSync(QBANK, "utf8"));
const courseName = Object.fromEntries(Object.entries(qb.courses));
const currentEx = (c) =>
  Array.isArray(c.examples) && c.examples.length > 0
    ? c.examples
    : c.example
      ? [c.example]
      : [];
const todoAll = qb.concepts.filter((c) => currentEx(c).length < TARGET);
const LIM = Number(process.env.GEN_LIMIT || 0);
const todo = LIM > 0 ? todoAll.slice(0, LIM) : todoAll;

// ---------- تطبيع عربي وفحص تشابه ----------
function normAr(s) {
  return (s || "")
    .normalize("NFC")
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[^\u0621-\u064A]/g, " ")
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

// ---------- البرومبت ----------
function exPrompt(c) {
  const have = currentEx(c);
  return `المفهوم: «${c.title}»
المحور: ${courseName[c.courseId]} — الموضوع: ${c.chapter}
الشرح المرجعي:
${c.explanation}
المثال المرجعي الحالي (ممنوع أن تقرب من صياغته أو من معناه):
${have[0]}

مهمتك: اكتب ${ASK} أمثلة واقعية جديدة للمفهوم «${c.title}»، مرتبة تصاعديًا من الأسهل إلى الأعمق (تدرّج تعليمي متكامل):
١. مثال تمهيدي بسيط: موقف يومي واضح يجسّد المفهوم لمن يسمعه أول مرة.
٢. مثال صفّي مباشر: معلم داخل صفه يطبّق المفهوم مع تلاميذه.
٣. مثال بزاوية مختلفة: تقويم أو تخطيط للدرس أو تعامل مع ولي أمر.
٤. مثال أعمق: حالة احترافية تُظهر أثر المفهوم في تعلم الطلاب أو في قرار المعلم.
٥. مثال رفيع: خطأ شائع لدى المعلمين يصحّحه المفهوم، أو حالة دقيقة متكاملة الأركان.

قواعد لغة صارمة:
- كل النص بالعربية الفصحى الواضحة. ممنوع أي كلمة إنجليزية أو حرف لاتيني.
- ممنوع كتابة الأرقام بأي رمز — اكتب العدد كلمة: «ثلاثة طلاب» لا «٣ طلاب».
- ممنوع الرموز التعبيرية. ممنوع الأخطاء الإملائية أو النحوية أو الصرفية: دقّق كل جملة (وافق الفعل مع الفاعل، وأصب الممنوع من الصرف والمثنى وجمع المذكر السالم).
- ممنوع تسمية مدارس أو شركات أو علامات تجارية. يُسمّى الأشخاص بأسماء عربية عامة (سارة، ريان، المعلمة هدى...).
- كل مثال من ٣ إلى ٥ جمل بموقف محدد بأسماء أشخاص ومرحلة تعليمية وسير أحداث — لا تعريف مجرد ولا نصائح عامة.
- كل مثال مختلف تمامًا عن بقية الأمثلة وعن المثال المرجعي في الزاوية والأحداث.

أعد JSON فقط بلا أي شرح أو أسوار كود، بالبنية:
{"examples": ["المثال الأول", "المثال الثاني", "المثال الثالث", "المثال الرابع", "المثال الخامس"]}`;
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

const isClean = (s) =>
  typeof s === "string" &&
  s.trim().length >= 80 && s.trim().length <= 700 &&
  !/[A-Za-z0-9\u0660-\u0669]/.test(s) &&
  !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s);

// ---------- مفهوم واحد ----------
async function genConcept(zai, c) {
  const outFile = path.join(OUTDIR, `${c.id}.json`);
  let state = { examples: [] };
  if (fs.existsSync(outFile)) {
    try { state = JSON.parse(fs.readFileSync(outFile, "utf8")); } catch { state = { examples: [] }; }
  }
  if (!Array.isArray(state.examples)) state.examples = [];
  if (state.examples.length >= TARGET - currentEx(c).length) return { id: c.id, skipped: true };

  const have = currentEx(c);
  const out = await askJSON(
    zai,
    "أنت خبير تربوي ومحرر محتوى تعليمي عربي فصيح.",
    exPrompt(c),
    `${c.id}-أمثلة`
  );
  const seen = have.map((e) => toks(e));
  const arr = Array.isArray(out?.examples) ? out.examples : [];
  for (const e of arr) {
    if (state.examples.length >= TARGET - have.length) break;
    if (!isClean(e)) continue;
    const s = e.trim();
    const n = toks(s);
    if (seen.some((p) => jac(p, n) > 0.62)) continue;
    seen.push(n);
    state.examples.push(s);
  }
  fs.writeFileSync(outFile, JSON.stringify(state, null, 1));
  if (state.examples.length >= TARGET - have.length) {
    log(`${c.id} OK — أمثلة إضافية ${state.examples.length}`);
    return { id: c.id, ok: true };
  }
  log(`${c.id} PARTIAL — إضافي ${state.examples.length}/${TARGET - have.length}`);
  return { id: c.id, failed: true };
}

// ---------- المجمّع ----------
async function main() {
  const zai = await ZAI.create();
  log(`START — مفاهيم ناقصة: ${todo.length}، توازي: ${CONCURRENCY}`);
  let done = 0, failed = 0, skipped = 0, processed = 0, consecutiveFail = 0;
  const started = Date.now();
  const queue = [...todo];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      if (DEADLINE_MS && Date.now() - started > DEADLINE_MS) { log(`DEADLINE — متبقٍ: ${queue.length}`); break; }
      const c = queue.shift();
      if (!c) break;
      const r = await genConcept(zai, c);
      processed++;
      if (r.skipped) skipped++;
      else if (r.failed) {
        failed++;
        consecutiveFail++;
        if (consecutiveFail >= 3) { log(`CIRCUIT — ${consecutiveFail} إخفاقات متتالية، خروج (المتبقي: ${queue.length})`); break; }
      } else { done++; consecutiveFail = 0; }
      if (processed % 5 === 0 || processed === todo.length) {
        log(`PROGRESS ${processed}/${todo.length} (${Math.round((processed / todo.length) * 100)}%) — ok=${done} failed=${failed} skipped=${skipped}`);
      }
    }
  });
  await Promise.all(workers);
  const remaining = todo.length - processed;
  log(`DONE — ok=${done} failed=${failed} skipped=${skipped} remaining=${remaining}`);
  if (remaining <= 0) fs.writeFileSync(path.join(OUTDIR, "_done.flag"), new Date().toISOString());
}

process.on("unhandledRejection", (e) => log("UNHANDLED " + (e?.stack || String(e)).slice(0, 300)));
process.on("uncaughtException", (e) => log("UNCAUGHT " + (e?.stack || String(e)).slice(0, 300)));
setInterval(() => log("HEARTBEAT"), 60000);

main().then(() => { log("EXIT"); process.exit(0); }).catch((e) => { log("FATAL " + String(e?.stack || e)); process.exit(1); });
