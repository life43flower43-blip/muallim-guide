// المراجعة المتباعدة — مبني على فكرة صناديق ليتمر، ومستوحى من فصل «التذكر والنسيان»
// كلما أجاب الطالب صحيحاً تباعدت مراجعة السؤال، والخطأ يعيده إلى البداية فوراً.

import { QUESTIONS, questionById, shuffle } from "./qbank";
import type { Attempt } from "./types";

export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];

export function nextBox(box: number, correct: boolean): number {
  if (!correct) return 1;
  return Math.min(box + 1, 5);
}

export function dueAt(box: number, ts: number): number {
  const days = BOX_INTERVALS_DAYS[Math.min(box, 5)];
  return ts + days * 24 * 60 * 60 * 1000;
}

/** أسئلة مستحقة للمراجعة: المتأخرة حسب الصندوق + كل ما أُجيب خطأ سابقاً */
export function dueQuestionIds(attempts: Record<string, Attempt>): string[] {
  const now = Date.now();
  const out: { qid: string; score: number }[] = [];
  for (const [qid, at] of Object.entries(attempts)) {
    if (!questionById(qid)) continue;
    if (!at.correct) {
      out.push({ qid, score: -1000 }); // الأخطاء أولاً
    } else if (dueAt(at.box, at.ts) <= now) {
      out.push({ qid, score: -dueAt(at.box, at.ts) });
    }
  }
  return out.sort((a, b) => a.score - b.score).map((x) => x.qid);
}

/** بناء جلسة مراجعة ذكية بحد أقصى */
export function buildReviewSet(attempts: Record<string, Attempt>, max = 15): string[] {
  const due = dueQuestionIds(attempts);
  return due.slice(0, max);
}

/** إعادة الأسئلة التي أجاب عنها خطأ (أولوية الأحدث خطأً) */
export function buildRedoSet(attempts: Record<string, Attempt>, max = 20): string[] {
  return Object.entries(attempts)
    .filter(([, at]) => !at.correct)
    .sort((a, b) => b[1].ts - a[1].ts)
    .slice(0, max)
    .map(([qid]) => qid);
}

/** أسئلة لم يواجهها المستخدم بعد — للتدريب على مفهوم/مساق */
export function unseenIn(ids: string[], attempts: Record<string, Attempt>): string[] {
  return ids.filter((qid) => !attempts[qid]);
}

/** ترتيب ذكي للتدريب: الأسئلة الجديدة أولاً ثم ما وُاجه سابقاً (كل مجموعة مخلوطة داخلياً) */
export function orderUnseenFirst(
  qids: string[],
  attempts: Record<string, Attempt>
): string[] {
  const unseen: string[] = [];
  const seen: string[] = [];
  for (const id of qids) (attempts[id] ? seen : unseen).push(id);
  return [...shuffle(unseen), ...shuffle(seen)];
}

export const totalQuestions = QUESTIONS.length;
