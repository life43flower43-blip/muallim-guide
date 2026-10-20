// ============================================================================
// GET /api/my-mistakes — أخطاء المستخدم المسجَّل المفتوحة (منقول من أوريندو)
// ============================================================================
// الخطأ مفتوح ما دام لم يُصلَح (إجابتان صحيحتان متباعدتان متتاليتان).
// نص السؤال وخياراته في البنك لدى الواجهة، فيرجع هنا المعرّف وحالة المراجعة فقط.
//   ?summary=1  → { stats: { dueCount, totalQuestions } } للشارات
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { MASTERED_REPETITIONS, RETIRED_REPETITIONS } from '@/lib/spaced-repetition'

export const dynamic = 'force-dynamic'

const MAX_ITEMS = 300
const MAX_REFRESH = 5

const SELECT = {
  id: true,
  questionId: true,
  mistakeCount: true,
  lastReview: true,
  nextReview: true,
  userAnswer: true,
  repetitions: true,
} as const

export async function GET(request: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ reason: 'not_authenticated' })

  const now = new Date()
  const open = { userId, mistakeCount: { gt: 0 }, NOT: { isCorrect: true, repetitions: { gte: MASTERED_REPETITIONS } } }
  try {
    if (request.nextUrl.searchParams.get('summary') === '1') {
      const [dueCount, totalQuestions] = await Promise.all([
        db.reviewItem.count({ where: { ...open, nextReview: { lte: now } } }),
        db.reviewItem.count({ where: open }),
      ])
      return NextResponse.json({ stats: { dueCount, totalQuestions } })
    }

    const [items, masteredCount, refresh] = await Promise.all([
      db.reviewItem.findMany({ where: open, take: MAX_ITEMS, orderBy: [{ nextReview: 'asc' }, { mistakeCount: 'desc' }], select: SELECT }),
      db.reviewItem.count({ where: { userId, mistakeCount: { gt: 0 }, isCorrect: true, repetitions: { gte: MASTERED_REPETITIONS } } }),
      // أخطاء مُصلَحة حان موعد تثبيتها (لا تظهر في القائمة، تدخل جلسة المراجعة)
      db.reviewItem.findMany({
        where: { userId, mistakeCount: { gt: 0 }, isCorrect: true, repetitions: { gte: MASTERED_REPETITIONS, lt: RETIRED_REPETITIONS }, nextReview: { lte: now } },
        take: MAX_REFRESH,
        orderBy: { nextReview: 'asc' },
        select: SELECT,
      }),
    ])
    const shape = (i: (typeof items)[number], due: boolean) => ({
      id: i.id,
      questionId: i.questionId,
      mistakeCount: i.mistakeCount,
      lastReview: i.lastReview?.toISOString() ?? null,
      nextReview: i.nextReview.toISOString(),
      userAnswer: i.userAnswer,
      due,
    })
    return NextResponse.json({
      items: items.map((i) => shape(i, i.nextReview <= now)),
      refresh: refresh.map((i) => shape(i, true)),
      masteredCount,
    })
  } catch (error) {
    console.error('GET /api/my-mistakes error:', error)
    return NextResponse.json({ reason: 'server_error' }, { status: 500 })
  }
}
