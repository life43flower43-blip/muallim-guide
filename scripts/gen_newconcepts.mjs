// توليد محتوى المفاهيم المفقودة (شرح + ٥ أمثلة متدرجة + ٦ أسئلة) — من أسماء المستخدم حصراً
// نقطة حفظ لكل مفهوم: src/data/generated/nc/C###.json — يستأنف تلقائياً عند إعادة التشغيل
// تشغيل: node scripts/gen_newconcepts.mjs   (بيئة: GEN_CONC، GEN_DEADLINE_MS)
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const ROOT = "/home/z/my-project";
const OUTDIR = path.join(ROOT, "src/data/generated/nc");
const LOG = path.join(OUTDIR, "progress.log");
const SPEC = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/newconcepts.json"), "utf8")).concepts;
const CONCURRENCY = Number(process.env.GEN_CONC || 1);
const DEADLINE_MS = Number(process.env.GEN_DEADLINE_MS || 0);

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });
const log = (m) => {
  const line = `[${new Date().toISOString()}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + "\n");
};

// ---------- فحوص النظافة ----------
const hasDigit = (s) => /[0-9\u0660-\u0669]/.test(s);
const hasLatin = (s) => /[A-Za-z]/.test(s);
const hasEmoji = (s) => /[\u{1F300}-\u{1FAFF}\u{2600}-\u27BF}]/u.test(s);
const cleanText = (s, min = 40, max = 700) =>
  typeof s === "string" && s.trim().length >= min && s.trim().length <= max &&
  !hasDigit(s) && !hasLatin(s) && !hasEmoji(s);

// ---------- البرومبتات ----------
function contentPrompt(c) {
  return `المفهوم: «${c.title}» — من محور تربوي لتأهيل المعلمين.
مهمتك: اكتب محتوى تعليميًا للمفهوم بالعربية الفصحى، منشورًا من كتب أصول التربية والقياس والتقويم المقررة في كليات التربية.
أعد JSON فقط بلا أسوار كود ولا شرح، بالبنية:
{"explanation": "...", "examples": ["...", "...", "...", "...", "..."]}

شرط الشرح: من أربع إلى ست جمل تعريفية واضحة: ماهية المفهوم، عناصره أو أركانه، ثم فائدة عملية للمعلم داخل الصف.
شرط الأمثلة: خمسة أمثلة واقعية متدرجة تصاعديًا من الأسهل إلى الأعمق:
التمهيدي البسيط بموقف يومي، ثم مثال صفّي مباشر معلم مع تلاميذه، ثم مثال بزاوية تقويمية أو تخطيط أو تواصل مع ولي أمر، ثم مثال أعمق يظهر أثر المفهوم في تعلم الطلاب أو قرار المعلم، ثم مثال رفيع عن خطأ شائع يصححه المفهوم.
كل مثال من ثلاث إلى خمس جمل بموقف محدد بأسماء عربية عامة (سارة، ريان، المعلمة هدى) ومرحلة تعليمية.

قواعد لغة صارمة:
- ممنوع أي حرف لاتيني أو كلمة إنجليزية.
- ممنوع كتابة أي عدد برمز — اكتبه كلمة: «خمسة طلاب» لا «٥ طلاب».
- ممنوع الرموز التعبيرية. ممنوع الأخطاء الإملائية أو النحوية: دقق الإعراب والممنوع من الصرف والمثنى.
- ممنوع تسمية مدارس أو شركات أو علامات. ممنوع الإحالة إلى مصادر أو مؤلفين.`;
}

function questionsPrompt(c, explanation) {
  return `المفهوم: «${c.title}»
شرحه المعتمد:
${explanation}

مهمتك: اكتب ستة أسئلة تقويمية للمفهوم، منشورةً من أصول التربية والقياس، موزعة: أربعة أسئلة اختيار من متعدد بأربعة خيارات، وسؤالان صح أم خطأ.
أعد JSON فقط بلا أسوار كود، بالبنية:
{"questions": [{"type": "mcq", "question": "...", "options": ["...", "...", "...", "..."], "correct": "...", "reason": "..."}, {"type": "tf", "question": "...", "options": ["صح", "خطأ"], "correct": "صح", "reason": "..."}]}

شروط صارمة:
- الخيار الصحيح واحد محدد في حقل correct ومطابق نصًا لأحد الخيارات حرفيًا.
- البدائل الملهمة منطقية وقريبة، لا «جميع ما سبق» ولا «لا شيء مما سبق».
- reason: جملة إلى جملتين تشرحان لماذا الصحيح صحيح ولماذا أبرز البدائل خاطئة.
- تفاوت الصعوبة: سهل ومتوسط وصعب، والمواقف واقعية بأسماء عربية عامة.
- كل النص بالفصحى: ممنوع أي حرف لاتيني، ممنوع الأعداد برمز — اكتبها كلمات، ممنوع الرموز التعبيرية، ممنوع الأخطاء الإملائية والنحوية.
- ممنوع تسمية مدارس أو علامات، وممنوع الإحالة إلى مصادر أو مؤلفين.`;
}

// ---------- نداء عام ----------
function safeParse(txt) {
  if (!txt) return null;
  let t = txt.trim().replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a === -1 || b === -1) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

async function askJSON(zai, user, tag) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: "أنت أستاذ أصول التربية والقياس والتقويم ومحرر محتوى تعليمي عربي فصيح." },
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

// ---------- مفهوم واحد ----------
async function genOne(zai, c) {
  const outFile = path.join(OUTDIR, `${c.id}.json`);
  if (fs.existsSync(outFile)) {
    try {
      const st = JSON.parse(fs.readFileSync(outFile, "utf8"));
      if (st.complete) return { id: c.id, skipped: true };
    } catch {}
  }
  // المرحلة الأولى: الشرح والأمثلة
  let content = null;
  try { content = JSON.parse(fs.readFileSync(outFile, "utf8")); } catch {}
  if (!content || !Array.isArray(content.examples) || content.examples.length < 5 || !content.explanation) {
    const out = await askJSON(zai, contentPrompt(c), `${c.id}-محتوى`);
    const explanation = typeof out?.explanation === "string" ? out.explanation.trim() : "";
    const examples = Array.isArray(out?.examples) ? out.examples.filter((e) => cleanText(e, 60, 700)) : [];
    const unique = [];
    for (const e of examples) {
      const k = e.replace(/\s+/g, " ").trim();
      if (!unique.some((u) => u.replace(/\s+/g, " ") === k)) unique.push(k);
    }
    if (!cleanText(explanation, 60, 900) || unique.length < 5) {
      log(`${c.id} CONTENT-INSUFFICIENT (ex=${explanation.length}, exs=${unique.length})`);
      return { id: c.id, failed: true };
    }
    content = { id: c.id, title: c.title, courseId: c.courseId, chapter: c.chapter, explanation, examples: unique.slice(0, 5), questions: [] };
    fs.writeFileSync(outFile, JSON.stringify(content, null, 1));
    log(`${c.id} CONTENT-OK`);
  }
  // المرحلة الثانية: الأسئلة
  if (!Array.isArray(content.questions) || content.questions.length < 6) {
    const out = await askJSON(zai, questionsPrompt(c, content.explanation), `${c.id}-أسئلة`);
    const ok = [];
    for (const q of Array.isArray(out?.questions) ? out.questions : []) {
      if (!q || typeof q.question !== "string") continue;
      const opts = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [];
      const isTf = q.type === "tf";
      if (opts.length !== (isTf ? 2 : 4)) continue;
      if (new Set(opts).size !== opts.length) continue;
      const correct = String(q.correct || "").trim();
      if (!opts.includes(correct)) continue;
      if (typeof q.reason !== "string" || q.reason.trim().length < 15) continue;
      const texts = [q.question, correct, q.reason, ...opts];
      if (texts.some((t) => hasDigit(t) || hasLatin(t) || hasEmoji(t) || t.trim().length < 5)) continue;
      ok.push({
        type: isTf ? "tf" : "mcq",
        difficulty: ["سهل", "متوسط", "صعب"].includes(q.difficulty) ? q.difficulty : "متوسط",
        question: q.question.trim(),
        options: opts.map((t) => ({ text: t, isCorrect: t === correct })),
        correct,
        reason: q.reason.trim(),
      });
      if (ok.length >= 6) break;
    }
    if (ok.length < 6) {
      log(`${c.id} QUESTIONS-INSUFFICIENT (${ok.length}/6)`);
      return { id: c.id, failed: true };
    }
    content.questions = ok;
    fs.writeFileSync(outFile, JSON.stringify(content, null, 1));
  }
  content.complete = true;
  fs.writeFileSync(outFile, JSON.stringify(content, null, 1));
  log(`${c.id} COMPLETE`);
  return { id: c.id, ok: true };
}

// ---------- المجمّع ----------
async function main() {
  const zai = await ZAI.create();
  const todo = SPEC.filter((c) => {
    try {
      const st = JSON.parse(fs.readFileSync(path.join(OUTDIR, `${c.id}.json`), "utf8"));
      return !st.complete;
    } catch { return true; }
  });
  log(`START — مفاهيم: ${todo.length}، توازي: ${CONCURRENCY}`);
  let done = 0, failed = 0, skipped = 0, processed = 0, consecutiveFail = 0;
  const started = Date.now();
  const queue = [...todo];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      if (DEADLINE_MS && Date.now() - started > DEADLINE_MS) { log(`DEADLINE — متبقٍ: ${queue.length}`); break; }
      const c = queue.shift();
      if (!c) break;
      const r = await genOne(zai, c);
      processed++;
      if (r.skipped) skipped++;
      else if (r.failed) {
        failed++;
        consecutiveFail++;
        if (consecutiveFail >= 4) { log(`CIRCUIT — خروج بعد إخفاقات متتالية (المتبقي: ${queue.length})`); break; }
      } else { done++; consecutiveFail = 0; }
      if (processed % 5 === 0 || processed === todo.length) log(`PROGRESS ${processed}/${todo.length} — ok=${done} failed=${failed} skipped=${skipped}`);
    }
  });
  await Promise.all(workers);
  const remaining = todo.length - processed;
  log(`DONE — ok=${done} failed=${failed} skipped=${skipped} remaining=${remaining}`);
  if (remaining <= 0) fs.writeFileSync(path.join(OUTDIR, "_done.flag"), new Date().toISOString());
}

process.on("unhandledRejection", (e) => log("UNHANDLED " + (e?.stack || String(e)).slice(0, 300)));
process.on("uncaughtException", (e) => log("UNCAUGHT " + (e?.stack || String(e)).slice(0, 300)));

main().then(() => { log("EXIT"); process.exit(0); }).catch((e) => { log("FATAL " + String(e?.stack || e)); process.exit(1); });
