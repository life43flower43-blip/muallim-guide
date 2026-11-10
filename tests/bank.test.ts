// سلامة بنك الأسئلة: يفشل الاختبار إن أُضيف سؤال معيب
import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

type Opt = { text: string; isCorrect: boolean };
type Q = { id: string; conceptId: string; type: string; question: string; options: Opt[]; correct: string; reason?: string };
const bank = JSON.parse(readFileSync("public/data/qbank.json", "utf8")) as { courses: Record<string, string>; concepts: { id: string; courseId: string; title: string; explanation: string }[]; questions: Q[] };
const conceptIds = new Set(bank.concepts.map((c) => c.id));

describe("بنك الأسئلة", () => {
  it("معرّفات الأسئلة والمفاهيم لا تتكرر", () => {
    expect(new Set(bank.questions.map((q) => q.id)).size).toBe(bank.questions.length);
    expect(conceptIds.size).toBe(bank.concepts.length);
  });

  it("كل مفهوم في محور موجود وله شرح وسؤال واحد على الأقل", () => {
    const withQ = new Set(bank.questions.map((q) => q.conceptId));
    for (const c of bank.concepts) {
      expect(bank.courses[c.courseId], c.id).toBeTruthy();
      expect(c.explanation.trim().length, c.id).toBeGreaterThan(20);
      expect(withQ.has(c.id), c.id).toBe(true);
    }
  });

  it("كل سؤال: مفهوم موجود، وإجابة صحيحة واحدة تطابق «correct»، وخيارات غير مكررة، وشرح", () => {
    const bad: string[] = [];
    for (const q of bank.questions) {
      const texts = q.options.map((o) => o.text.trim());
      const right = q.options.filter((o) => o.isCorrect);
      const ok =
        conceptIds.has(q.conceptId) &&
        q.question.trim().length > 0 &&
        q.options.length >= 2 &&
        right.length === 1 &&
        right[0].text === q.correct &&
        new Set(texts).size === texts.length &&
        texts.every(Boolean) &&
        !!q.reason?.trim();
      if (!ok) bad.push(q.id);
    }
    expect(bad).toEqual([]);
  });

  it("أسئلة صح/خطأ خياراها «صح» و«خطأ»", () => {
    const bad = bank.questions.filter((q) => q.type === "tf" && !["صح", "خطأ"].includes(q.correct)).map((q) => q.id);
    expect(bad).toEqual([]);
  });

  it("لا تكون الإجابة الصحيحة أطول من ضعف أطول خيار خاطئ (تلميح يكشفها)", () => {
    const bad = bank.questions
      .filter((q) => q.type === "mcq")
      .filter((q) => {
        const longestWrong = Math.max(...q.options.filter((o) => !o.isCorrect).map((o) => o.text.length));
        return q.correct.length > 2 * longestWrong;
      })
      .map((q) => q.id);
    expect(bad).toEqual([]);
  });
});
