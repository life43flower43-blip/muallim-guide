// يقسم بنك الأسئلة وقت البناء إلى جزأين: «أساسي» يكفي لفتح التطبيق، و«تفاصيل» (أسباب الإجابات والأمثلة) تُحمَّل في الخلفية
import { readFileSync, writeFileSync } from "node:fs";
const dir = "public/data/";
const bank = JSON.parse(readFileSync(dir + "qbank.json", "utf8"));
const detail = { c: {}, q: {} };
const concepts = bank.concepts.map(({ examples, ...c }) => {
  if (examples) detail.c[c.id] = examples;
  return c;
});
const questions = bank.questions.map(({ reason, ...q }) => {
  if (reason !== undefined) detail.q[q.id] = reason;
  return q;
});
writeFileSync(dir + "qbank-core.json", JSON.stringify({ courses: bank.courses, maps: bank.maps ?? {}, concepts, questions }));
writeFileSync(dir + "qbank-detail.json", JSON.stringify(detail));
console.log("split-bank: core + detail written");
