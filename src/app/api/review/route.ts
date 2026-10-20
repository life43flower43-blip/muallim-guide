// ============================================================================
// POST /api/review — تسجيل خطأ أو نتيجة مراجعته لمستخدم مسجَّل (منقول من أوريندو)
// ============================================================================
// body: { questionId, rating: 'again' | 'good', userAnswer?, source? }
//   again: إجابة خاطئة — يُنشأ الخطأ إن لم يوجد، ويعود للمراجعة فورًا
//   good:  إجابة صحيحة على خطأ موجود — يتباعد موعده (SM-2)
// الضيف يحصل على reason: 'not_authenticated' ويحفظ أخطاءه على جهازه.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { computeNextReview, type ReviewRating } from '@/lib/spaced-repetition'
import { serverQuestions } from '@/lib/server-bank'

const MAX_TEXT_LENGTH = 2000

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUser()
    if (!userId) return NextResponse.json({ recorded: false, reason: 'not_authenticated' })
    const rl = checkRateLimit(`review:${userId}`, RATE_LIMITS.PROGRESS_SAVE)
    if (!rl.allowed) return rateLimitResponse(rl)

    const { questionId, rating, userAnswer, source } = (await request.json()) as {
      questionId?: unknown
      rating?: unknown
      userAnswer?: unknown
      source?: unknown
    }
    if (rating !== 'again' && rating !== 'good') return NextResponse.json({ error: 'invalid_rating' }, { status: 400 })
    if (typeof questionId !== 'string' || questionId.length === 0 || questionId.length > 40) {
      return NextResponse.json({ error: 'invalid_question' }, { status: 400 })
    }
    if (!(await serverQuestions()).has(questionId)) return NextResponse.json({ error: 'unknown_question' }, { status: 404 })
    const src = typeof source === 'string' && source.length <= 20 ? source : 'practice'
    const answer = typeof userAnswer === 'string' ? userAnswer.slice(0, MAX_TEXT_LENGTH) : undefined

    let item = await db.reviewItem.findUnique({ where: { userId_questionId: { userId, questionId } } })
    if (!item) {
      // إجابة صحيحة عن سؤال لم يكن خطأً: لا شيء يُتابَع
      if (rating === 'good') return NextResponse.json({ recorded: false, reason: 'not_a_mistake' })
      item = await db.reviewItem.create({ data: { userId, questionId, interval: 0, source: src } })
    }

    const update = computeNextReview(item, rating as ReviewRating)
    const updated = await db.reviewItem.update({
      where: { id: item.id },
      data: {
        easeFactor: update.easeFactor,
        interval: update.interval,
        repetitions: update.repetitions,
        mistakeCount: update.mistakeCount,
        nextReview: update.nextReview,
        lastReview: update.lastReview,
        isCorrect: update.isCorrect,
        ...(rating === 'again' && answer !== undefined ? { userAnswer: answer } : {}),
      },
    })
    return NextResponse.json({
      recorded: true,
      item: { id: updated.id, mistakeCount: updated.mistakeCount, repetitions: updated.repetitions, nextReview: updated.nextReview },
    })
  } catch (error) {
    console.error('POST /api/review error:', error)
    return NextResponse.json({ recorded: false, reason: 'server_error' }, { status: 500 })
  }
}
