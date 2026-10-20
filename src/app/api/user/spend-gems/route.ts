import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { GEM_RULES, MAX_STREAK_FREEZES } from '@/lib/gems-rules'

// POST /api/user/spend-gems — صرف جواهر على تلميح أو تجميد سلسلة (منقول من أوريندو)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUser()
    if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    const rl = checkRateLimit(`spend-gems:${userId}`, RATE_LIMITS.PROGRESS_SAVE)
    if (!rl.allowed) return rateLimitResponse(rl)

    const body = await request.json()
    const { reason, idempotencyKey } = body as { reason?: string; idempotencyKey?: string }
    if (body.amount !== undefined) return NextResponse.json({ error: 'amount is server-determined' }, { status: 400 })
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length > 100) {
      return NextResponse.json({ error: 'valid idempotencyKey required' }, { status: 400 })
    }
    const rule = reason ? GEM_RULES[reason as keyof typeof GEM_RULES] : undefined
    if (!rule || rule.type !== 'spend') return NextResponse.json({ error: 'invalid_reason' }, { status: 400 })

    const key = `spend_${userId}_${idempotencyKey}`
    const existing = await db.gemTransaction.findUnique({ where: { idempotencyKey: key } })
    if (existing) return NextResponse.json({ newBalance: existing.balanceAfter, spent: -existing.amount, idempotentReplay: true })

    const newBalance = await db.$transaction(async (tx) => {
      const isFreeze = reason === 'streak_freeze'
      // شرط الرصيد والخصم في عبارة واحدة: طلبان متزامنان لا ينزلان بالرصيد تحت الصفر
      const { count } = await tx.user.updateMany({
        where: { id: userId, gems: { gte: rule.amount }, ...(isFreeze && { streakFreeze: { lt: MAX_STREAK_FREEZES } }) },
        data: { gems: { decrement: rule.amount }, ...(isFreeze && { streakFreeze: { increment: 1 } }) },
      })
      if (count === 0) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { streakFreeze: true } })
        if (!user) throw new Error('user_not_found')
        if (isFreeze && user.streakFreeze >= MAX_STREAK_FREEZES) throw new Error('max_streak_freezes')
        throw new Error('insufficient_gems')
      }
      const updated = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { gems: true } })
      await tx.gemTransaction.create({
        data: { userId, amount: -rule.amount, type: 'spend', reason: reason!, idempotencyKey: key, balanceAfter: updated.gems },
      })
      return updated.gems
    })
    return NextResponse.json({ newBalance, spent: rule.amount })
  } catch (error: any) {
    const known = ['insufficient_gems', 'max_streak_freezes', 'user_not_found']
    if (known.includes(error?.message)) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'user_not_found' ? 404 : 400 })
    }
    console.error('POST /api/user/spend-gems error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
