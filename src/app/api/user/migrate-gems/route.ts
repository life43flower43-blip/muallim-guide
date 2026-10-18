// ============================================================================
// POST /api/user/migrate-gems — جواهر الجهاز إلى الحساب بعد تسجيل الدخول (من أوريندو)
// ============================================================================
// فرق صغير (٥٠ فأقل): يأخذ الحساب الأكبر من الرقمين. فرق أكبر: يُسجَّل للمراجعة
// ولا يُدمج، فلا تُنفخ الجواهر بتعديل التخزين المحلي.

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

const DIFF_THRESHOLD = 50

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUser()
    if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    const { localGems } = (await request.json()) as { localGems?: unknown }
    if (typeof localGems !== 'number' || !Number.isInteger(localGems) || localGems < 0 || localGems > 100000) {
      return NextResponse.json({ error: 'invalid_local_gems' }, { status: 400 })
    }

    const already = await db.gemTransaction.findUnique({ where: { idempotencyKey: `migration_${userId}` } })
    const flagged = await db.gemMigrationFlag.findFirst({ where: { userId } })
    if (already || flagged) return NextResponse.json({ migrated: false, alreadyMigrated: true })

    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { gems: true } })
    const diff = localGems - user.gems
    if (Math.abs(diff) > DIFF_THRESHOLD) {
      await db.gemMigrationFlag.create({ data: { userId, dbGems: user.gems, localStorageGems: localGems, diff } })
      return NextResponse.json({ migrated: false, flagged: true, finalGems: user.gems })
    }
    const finalGems = Math.max(user.gems, localGems)
    await db.$transaction([
      db.user.update({ where: { id: userId }, data: { gems: finalGems } }),
      db.gemTransaction.create({
        data: {
          userId,
          amount: finalGems - user.gems,
          type: 'award',
          reason: 'device_gems',
          idempotencyKey: `migration_${userId}`,
          balanceAfter: finalGems,
        },
      }),
    ])
    return NextResponse.json({ migrated: finalGems !== user.gems, finalGems })
  } catch (error) {
    console.error('POST /api/user/migrate-gems error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
