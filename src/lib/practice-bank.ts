// ============================================================================
// بنك التدريب لكل مقرر — منقول من «course-bank» في أوريندو ومكيّف لبنك تربوي
// ============================================================================
// كل مقرر موضوعاته فصوله. لكل مقرر: تدريب ذكي يبدأ بالأضعف، ومزيج من
// الفصول، واختبار شامل، وجلسة لكل فصل تُحفظ أفضل نتيجتها (نجوم).
// ويحسب هنا مستوى الإتقان (على نمط Khan Academy) وجاهزية الاختبار
// (على نمط UWorld) من محاولات المتعلم نفسه.
// ============================================================================

import {
  COURSES,
  QUESTIONS,
  chaptersOfCourse,
  conceptsOfCourse,
  questionById,
  questionsOfChapter,
  questionsOfCourse,
  shuffle,
} from './qbank'
import type { Attempt, Difficulty, Question } from './types'

export const SESSION_SIZE = 10
export const EXAM_SIZE = 30
export const EXAM_SECONDS = 30 * 60

export const topicKey = (courseId: string, chapter: string) => `${courseId}::${chapter}`
export const examKey = (courseId: string) => `${courseId}::exam`

/** ٠–٣ نجوم من أفضل نتيجة (كما في أوريندو) */
export function starsFor(percent: number | undefined): number {
  if (percent === undefined) return 0
  return percent >= 90 ? 3 : percent >= 70 ? 2 : percent > 0 ? 1 : 0
}

const DIFF_ORDER: Record<Difficulty, number> = { سهل: 0, متوسط: 1, صعب: 2 }

/** الأسئلة الجديدة أولًا ثم ما سبق، وفي كل مجموعة من الأسهل إلى الأصعب */
function orderForLearning(qs: Question[], attempts: Record<string, Attempt>): Question[] {
  const unseen = shuffle(qs.filter((q) => !attempts[q.id]))
  const wrong = shuffle(qs.filter((q) => attempts[q.id] && !attempts[q.id].correct))
  const seen = shuffle(qs.filter((q) => attempts[q.id]?.correct))
  const byDiff = (a: Question, b: Question) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]
  return [...wrong, ...unseen.sort(byDiff), ...seen]
}

/** جلسة فصل واحد */
export function chapterSession(courseId: string, chapter: string, attempts: Record<string, Attempt>, size = SESSION_SIZE): string[] {
  return orderForLearning(questionsOfChapter(courseId, chapter), attempts).slice(0, size).map((q) => q.id)
}

/** مزيج المقرر: سؤالان من كل واحد من ثمانية فصول عشوائية */
export function courseMix(courseId: string): string[] {
  const out: string[] = []
  for (const ch of shuffle(chaptersOfCourse(courseId)).slice(0, 8)) {
    out.push(...shuffle(questionsOfChapter(courseId, ch)).slice(0, 2).map((q) => q.id))
  }
  return shuffle(out).slice(0, 16)
}

/** الاختبار الشامل: متوسط وصعب موزّع على الفصول بالتساوي */
export function courseExam(courseId: string, size = EXAM_SIZE): string[] {
  const chapters = shuffle(chaptersOfCourse(courseId))
  const pools = chapters.map((ch) => {
    const qs = questionsOfChapter(courseId, ch)
    const hard = shuffle(qs.filter((q) => q.difficulty !== 'سهل'))
    return [...hard, ...shuffle(qs.filter((q) => q.difficulty === 'سهل'))]
  })
  const out: string[] = []
  for (let round = 0; out.length < size && round < 6; round++) {
    for (const pool of pools) {
      if (out.length >= size) break
      if (pool[round]) out.push(pool[round].id)
    }
  }
  return shuffle(out)
}

/** اختبار تجريبي على كل المقررات بحسب حجم كل مقرر */
export function fullMockExam(size = EXAM_SIZE * 2): string[] {
  const total = COURSES.reduce((n, c) => n + questionsOfCourse(c.id).length, 0) || 1
  const out: string[] = []
  for (const c of COURSES) {
    const share = Math.max(2, Math.round((questionsOfCourse(c.id).length / total) * size))
    out.push(...courseExam(c.id, share))
  }
  return shuffle(out).slice(0, size)
}

// ---------- الإتقان والجاهزية ----------

export type MasteryLevel = 0 | 1 | 2 | 3
export const MASTERY_LABELS: Record<MasteryLevel, string> = { 0: 'لم يبدأ', 1: 'متعرِّف', 2: 'متمكِّن', 3: 'متقِن' }

type Tally = { answered: number; correct: number }

function tally(qs: Question[], attempts: Record<string, Attempt>): Tally {
  let answered = 0
  let correct = 0
  for (const q of qs) {
    const a = attempts[q.id]
    if (!a) continue
    answered += 1
    if (a.correct) correct += 1
  }
  return { answered, correct }
}

export function masteryOf(t: Tally): MasteryLevel {
  if (t.answered === 0) return 0
  const acc = t.correct / t.answered
  if (t.answered >= 4 && acc >= 0.9) return 3
  if (t.answered >= 3 && acc >= 0.7) return 2
  return 1
}

let conceptQuestions: Map<string, Question[]> | null = null
function questionsByConcept(): Map<string, Question[]> {
  if (conceptQuestions && conceptQuestions.size > 0) return conceptQuestions
  conceptQuestions = new Map()
  for (const q of QUESTIONS) {
    const list = conceptQuestions.get(q.conceptId)
    if (list) list.push(q)
    else conceptQuestions.set(q.conceptId, [q])
  }
  return conceptQuestions
}

/** توزيع مفاهيم المقرر على مستويات الإتقان الأربعة */
export function courseMastery(courseId: string, attempts: Record<string, Attempt>): Record<MasteryLevel, number> {
  const out: Record<MasteryLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  const byConcept = questionsByConcept()
  for (const c of conceptsOfCourse(courseId)) out[masteryOf(tally(byConcept.get(c.id) ?? [], attempts))] += 1
  return out
}

/** حالة كل فصل: أسئلته، ما أُجيب منها، والدقة */
export function chapterStats(courseId: string, chapter: string, attempts: Record<string, Attempt>) {
  const qs = questionsOfChapter(courseId, chapter)
  const t = tally(qs, attempts)
  return { total: qs.length, ...t, accuracy: t.answered ? t.correct / t.answered : null, level: masteryOf(t) }
}

/** المقدار الذي يكفي ليُعدّ المقرر مُغطّى في حساب الجاهزية */
const COVERAGE_TARGET = 40

/** جاهزية المقرر (٠–١): الدقة مضروبة في التغطية — لا جاهزية من خمسة أسئلة محظوظة */
export function courseReadiness(courseId: string, attempts: Record<string, Attempt>): number {
  const t = tally(questionsOfCourse(courseId), attempts)
  if (t.answered === 0) return 0
  return (t.correct / t.answered) * Math.min(1, t.answered / COVERAGE_TARGET)
}

/** الجاهزية الإجمالية: متوسط المقررات موزونًا بحجم كل مقرر */
export function overallReadiness(attempts: Record<string, Attempt>): number {
  let sum = 0
  let weight = 0
  for (const c of COURSES) {
    const w = questionsOfCourse(c.id).length
    sum += courseReadiness(c.id, attempts) * w
    weight += w
  }
  return weight ? sum / weight : 0
}

/** أضعف الفصول: ما أُجيب فيه بدقة أقل من ٧٠٪، الأضعف أولًا */
export function weakChapters(attempts: Record<string, Attempt>, courseId?: string, limit = 3) {
  const out: { courseId: string; chapter: string; accuracy: number; answered: number }[] = []
  for (const c of COURSES) {
    if (courseId && c.id !== courseId) continue
    for (const ch of chaptersOfCourse(c.id)) {
      const s = chapterStats(c.id, ch, attempts)
      if (s.answered >= 2 && s.accuracy !== null && s.accuracy < 0.7) out.push({ courseId: c.id, chapter: ch, accuracy: s.accuracy, answered: s.answered })
    }
  }
  return out.sort((a, b) => a.accuracy - b.accuracy).slice(0, limit)
}

/** التدريب الذكي: من الفصول الأضعف أولًا، ثم أول فصل لم يبدأه، ثم مراجعة المتقَن */
export function smartSession(attempts: Record<string, Attempt>, courseId?: string, size = SESSION_SIZE): string[] {
  const out = new Set<string>()
  for (const w of weakChapters(attempts, courseId, 3)) {
    for (const id of chapterSession(w.courseId, w.chapter, attempts, 4)) out.add(id)
  }
  const courses = courseId ? COURSES.filter((c) => c.id === courseId) : COURSES
  for (const c of courses) {
    if (out.size >= size) break
    const fresh = chaptersOfCourse(c.id).find((ch) => chapterStats(c.id, ch, attempts).answered === 0)
    if (fresh) for (const id of chapterSession(c.id, fresh, attempts, 4)) out.add(id)
  }
  if (out.size < size) {
    const pool = courseId ? questionsOfCourse(courseId) : courses.flatMap((c) => questionsOfCourse(c.id))
    for (const q of orderForLearning(shuffle(pool).slice(0, 200), attempts)) {
      if (out.size >= size) break
      out.add(q.id)
    }
  }
  return shuffle([...out].filter((id) => questionById(id))).slice(0, size)
}

/** الفصل التالي في المقرر: أول فصل لم يُتقن */
export function nextChapter(courseId: string, attempts: Record<string, Attempt>): string | null {
  const chapters = chaptersOfCourse(courseId)
  return chapters.find((ch) => chapterStats(courseId, ch, attempts).level < 2) ?? chapters[0] ?? null
}
