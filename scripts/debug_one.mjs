import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

const qb = JSON.parse(fs.readFileSync("/home/z/my-project/src/data/qbank.json", "utf8"));
const c = qb.concepts[0];
const courseName = Object.fromEntries(Object.entries(qb.courses));

const SYSTEM = `أنت خبير تربوي، محرر محتوى تعليمي عربي فصيح. أعد JSON فقط بلا أي نص إضافي.`;
const USER = `المفهوم: «${c.title}»
المحور: ${courseName[c.courseId]} — الموضوع: ${c.chapter}
الشرح المرجعي:
${c.explanation}

أعد JSON فقط بالبنية:
{"examples": [٢ أمثلة واقعية من ٣ جمل عن مواقف مدرسية تجسّد المفهوم], "questions": [٣ أسئلة اختيار من متعدد] كل سؤال: {"question": "نص السؤال", "difficulty": "سهل", "options": ["أ","ب","ج","د"], "correctIndex": 0, "reason": "سبب مختصر"}}`;

const zai = await ZAI.create();
const completion = await zai.chat.completions.create({
  messages: [
    { role: "assistant", content: SYSTEM },
    { role: "user", content: USER },
  ],
  thinking: { type: "disabled" },
});
const txt = completion?.choices?.[0]?.message?.content;
console.log("=== RAW TYPE:", typeof txt);
console.log("=== RAW LEN:", txt ? txt.length : 0);
console.log("=== RAW FIRST 800 ===");
console.log(txt ? txt.slice(0, 800) : "(empty)");
fs.writeFileSync("/home/z/my-project/src/data/generated/_raw_debug.txt", txt || "EMPTY");
