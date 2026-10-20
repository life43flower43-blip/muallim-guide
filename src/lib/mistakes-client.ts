'use client'

// ============================================================================
// الأخطاء على الواجهة (منقول من أوريندو): مكان واحد يسجّل الإجابة الخاطئة،
// ويرسل نتيجة المراجعة، ويقرأ الأخطاء المفتوحة — من الخادم للمسجَّل،
// ومن الجهاز للضيف. أخطاء الضيف تنتقل إلى حسابه بعد الدخول.
// النص والخيارات من البنك المحمَّل في الواجهة، والخادم يحفظ المعرّف فقط.
// ============================================================================

import { useMemo } from 'react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useLocalMistakesStore } from './local-mistakes-store'
import { conceptById, questionById, COURSE_SHORT } from './qbank'
import type { Concept, Question } from './types'

export type MistakeItem = {
  id: string
  question: Question
  concept: Concept | undefined
  courseId: string
  mistakeCount: number
  userAnswer: string | null
  due: boolean
  nextReview: string | null
  lastReview: string | null
}

export type MistakeCourseGroup = { courseId: string; name: string; count: number; due: number }

export type MistakesData = {
  items: MistakeItem[]
  /** أخطاء مُصلَحة حان تثبيتها — تدخل جلسة المراجعة ولا تظهر في القائمة */
  refresh: MistakeItem[]
  byCourse: MistakeCourseGroup[]
  stats: { open: number; due: number; mastered: number | null }
  isGuest: boolean
}

export const MISTAKES_QUERY_KEY = ['my-mistakes'] as const
export const REVIEW_SESSION_SIZE = 12

type RawItem = { id: string; questionId: string; mistakeCount: number; userAnswer?: string | null; due: boolean; nextReview?: string | null; lastReview?: string | null }
type ServerResult = { kind: 'guest' } | { kind: 'server'; items: RawItem[]; refresh: RawItem[]; mastered: number }

async function fetchServerMistakes(): Promise<ServerResult> {
  const res = await fetch('/api/my-mistakes')
  const json = await res.json().catch(() => null)
  if (json?.reason === 'not_authenticated') return { kind: 'guest' }
  if (!res.ok || !json?.items) throw new Error(json?.reason || `HTTP ${res.status}`)
  return { kind: 'server', items: json.items, refresh: json.refresh ?? [], mastered: json.masteredCount ?? 0 }
}

function enrich(raw: RawItem[]): MistakeItem[] {
  const out: MistakeItem[] = []
  for (const r of raw) {
    const question = questionById(r.questionId)
    if (!question) continue // سؤال حُذف من البنك
    const concept = conceptById(question.conceptId)
    out.push({
      id: r.id,
      question,
      concept,
      courseId: concept?.courseId ?? '',
      mistakeCount: r.mistakeCount,
      userAnswer: r.userAnswer ?? null,
      due: r.due,
      nextReview: r.nextReview ?? null,
      lastReview: r.lastReview ?? null,
    })
  }
  return out
}

function groupByCourse(items: MistakeItem[]): MistakeCourseGroup[] {
  const m = new Map<string, MistakeCourseGroup>()
  for (const it of items) {
    const g = m.get(it.courseId) ?? { courseId: it.courseId, name: COURSE_SHORT[it.courseId] ?? it.courseId, count: 0, due: 0 }
    g.count += 1
    if (it.due) g.due += 1
    m.set(it.courseId, g)
  }
  return [...m.values()].sort((a, b) => b.count - a.count)
}

/** أخطاء المتعلم المفتوحة — من الحساب أو الجهاز */
export function useMistakes() {
  const local = useLocalMistakesStore((s) => s.mistakes)
  const query = useQuery({
    queryKey: MISTAKES_QUERY_KEY,
    queryFn: fetchServerMistakes,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    retry: 1,
  })

  const data: MistakesData | undefined = useMemo(() => {
    if (!query.data) return undefined
    if (query.data.kind === 'guest') {
      const now = Date.now()
      const items = enrich(
        local.map((m) => ({ ...m, due: !m.nextReview || new Date(m.nextReview).getTime() <= now }))
      ).sort((a, b) => Number(b.due) - Number(a.due) || b.mistakeCount - a.mistakeCount)
      return {
        items,
        refresh: [],
        byCourse: groupByCourse(items),
        stats: { open: items.length, due: items.filter((i) => i.due).length, mastered: null },
        isGuest: true,
      }
    }
    const items = enrich(query.data.items)
    return {
      items,
      refresh: enrich(query.data.refresh),
      byCourse: groupByCourse(items),
      stats: { open: items.length, due: items.filter((i) => i.due).length, mastered: query.data.mastered },
      isGuest: false,
    }
  }, [query.data, local])

  return {
    data,
    isLoading: query.isLoading && !query.data,
    isError: query.isError && !query.data,
    refetch: query.refetch,
  }
}

async function postReview(body: Record<string, unknown>): Promise<{ reason?: string } | null> {
  try {
    const res = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return await res.json().catch(() => null)
  } catch {
    return null
  }
}

/** إجابة خاطئة في أي تدريب: الضيف يحفظها على جهازه */
export async function recordMistake(questionId: string, userAnswer: string, queryClient?: QueryClient) {
  const result = await postReview({ questionId, rating: 'again', userAnswer, source: 'practice' })
  if (!result || result.reason === 'not_authenticated') {
    useLocalMistakesStore.getState().addMistake(questionId, userAnswer)
  }
  queryClient?.invalidateQueries({ queryKey: MISTAKES_QUERY_KEY })
}

/** نتيجة مراجعة خطأ مفتوح */
export async function recordReviewResult(questionId: string, correct: boolean, userAnswer: string, isGuest: boolean) {
  if (isGuest) {
    const store = useLocalMistakesStore.getState()
    if (correct) store.markCorrect(questionId)
    else store.addMistake(questionId, userAnswer)
    return
  }
  await postReview({ questionId, rating: correct ? 'good' : 'again', userAnswer, source: 'review' })
}

/** ترتيب جلسة مراجعة: المستحق أولًا، ثم الأكثر تكرارًا، ثم تثبيت المُصلَح */
export function buildReviewQids(data: MistakesData, courseId: string | null = null, size = REVIEW_SESSION_SIZE): string[] {
  const pool = data.items.filter((i) => !courseId || i.courseId === courseId)
  const ordered = [...pool].sort((a, b) => Number(b.due) - Number(a.due) || b.mistakeCount - a.mistakeCount)
  const refresh = courseId ? [] : data.refresh.slice(0, 3)
  const list = [...ordered.filter((i) => i.due), ...refresh, ...ordered.filter((i) => !i.due)]
  return [...new Set(list.map((i) => i.question.id))].slice(0, size)
}
