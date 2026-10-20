// بنك الأسئلة على الخادم — يُقرأ من الملف نفسه الذي تحمّله الواجهة،
// ليتحقق الخادم من الإجابات قبل منح الجواهر (لا يكفي أن تقول الواجهة «أجبت صحيحًا»).
import { readFile } from 'fs/promises'
import path from 'path'
import type { Question } from '@/lib/types'

let cache: Promise<Map<string, Question>> | null = null

async function load(): Promise<Map<string, Question>> {
  const file = path.join(process.cwd(), 'public', 'data', 'qbank.json')
  const raw = JSON.parse(await readFile(file, 'utf8')) as { questions: Question[] }
  return new Map(raw.questions.map((q) => [q.id, q]))
}

export function serverQuestions(): Promise<Map<string, Question>> {
  cache ??= load().catch((e) => {
    cache = null
    throw e
  })
  return cache
}

/** هل الإجابة صحيحة؟ الإجابة نص الخيار المختار كما يعرضه البنك */
export function isCorrectAnswer(q: Question, answer: string): boolean {
  return answer === q.correct
}
