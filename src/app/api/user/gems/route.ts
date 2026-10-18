import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/user/gems — سجل الجواهر (آخر ٣٠ حركة)
export async function GET() {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  const items = await db.gemTransaction.findMany({
    where: { userId, amount: { not: 0 } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: { id: true, amount: true, reason: true, balanceAfter: true, createdAt: true },
  })
  return NextResponse.json({ items })
}
