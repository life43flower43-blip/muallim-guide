// ============================================================================
// POST /api/practice/complete — نهاية جلسة تدريب أو مراجعة لمستخدم مسجَّل
// ============================================================================
// الواجهة ترسل الإجابات نفسها، والخادم يصححها من البنك ثم:
//   - يحدّث النقاط والسلسلة اليومية
//   - يمنح جواهر الجلسة مرة واحدة (مفتاح الجلسة فريد)، بسقف يومي
// الضيف يحفظ ذلك على جهازه ولا يصل إلى هنا.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { serverQuestions, isCorrectAnswer } from '@/lib/server-bank'
import { gemsForSession, DAILY_SESSION_AWARD_LIMIT, MIN_SESSION_QUESTIONS } from '@/lib/gems-rules'
import { applyActivity, clampTzOffset, localDayNumber } from '@/lib/streak'

const MAX_ANSWERS = 120
const XP_PER_CORRECT = 10

export async function POST(request: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  const rl = checkRateLimit(`practice:${userId}`, RATE_LIMITS.PROGRESS_SAVE)
  if (!rl.allowed) return rateLimitResponse(rl)

  try {
    const body = await request.json()
    const { sessionId, kind, answers, tz } = body as {
      sessionId?: string
      kind?: string
      answers?: { qid?: unknown; answer?: unknown }[]
      tz?: number
    }
    if (typeof sessionId !== 'string' || sessionId.length < 8 || sessionId.length > 80) {
      return NextResponse.json({ error: 'invalid_session' }, { status: 400 })
    }
    if (kind !== 'practice' && kind !== 'review') return NextResponse.json({ error: 'invalid_kind' }, { status: 400 })
    if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) {
      return NextResponse.json({ error: 'invalid_answers' }, { status: 400 })
    }

    // تصحيح الإجابات من البنك؛ السؤال المكرر يُحتسب مرة واحدة
    const bank = await serverQuestions()
    const seen = new Set<string>()
    let total = 0
    let correct = 0
    for (const a of answers) {
      if (typeof a?.qid !== 'string' || typeof a?.answer !== 'string' || seen.has(a.qid)) continue
      const q = bank.get(a.qid)
      if (!q) continue
      seen.add(a.qid)
      total += 1
      if (isCorrectAnswer(q, a.answer)) correct += 1
    }
    if (total === 0) return NextResponse.json({ error: 'no_valid_answers' }, { status: 400 })

    const idempotencyKey = `session_${userId}_${sessionId}`
    const replay = await db.gemTransaction.findUnique({ where: { idempotencyKey } })
    if (replay) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { gems: true, xp: true, streak: true } })
      return NextResponse.json({ replay: true, gemsAwarded: replay.amount, total, correct, ...user })
    }

    const tzOffset = clampTzOffset(tz)
    const now = new Date()
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
      const streak = total >= MIN_SESSION_QUESTIONS || kind === 'review'
        ? applyActivity({ streak: user.streak, streakFreeze: user.streakFreeze, lastActive: user.lastActive }, now, tzOffset)
        : { streak: user.streak, streakFreeze: user.streakFreeze, lastActive: user.lastActive }

      // سقف يومي بتقويم المستخدم
      const startOfDay = new Date((localDayNumber(now, tzOffset) * 86_400_000) + tzOffset * 60_000)
      const awardedToday = await tx.gemTransaction.count({
        where: { userId, reason: { in: ['session_complete', 'review_complete'] }, amount: { gt: 0 }, createdAt: { gte: startOfDay } },
      })
      const gems = awardedToday < DAILY_SESSION_AWARD_LIMIT ? gemsForSession(kind, total, correct) : 0

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: correct * XP_PER_CORRECT },
          gems: { increment: gems },
          streak: streak.streak,
          streakFreeze: streak.streakFreeze,
          lastActive: streak.lastActive,
        },
        select: { gems: true, xp: true, streak: true },
      })
      // يُكتب السطر حتى بلا جواهر: هو ما يمنع احتساب الجلسة نفسها مرتين
      await tx.gemTransaction.create({
        data: {
          userId,
          amount: gems,
          type: 'award',
          reason: kind === 'review' ? 'review_complete' : 'session_complete',
          idempotencyKey,
          balanceAfter: updated.gems,
        },
      })
      return { ...updated, gemsAwarded: gems }
    })

    return NextResponse.json({ total, correct, ...result })
  } catch (error) {
    console.error('POST /api/practice/complete error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
