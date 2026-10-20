// ============================================================================
// /api/user/progress — نسخة التقدم على الحساب (المحاولات والجلسات وأفضل النتائج)
// GET: آخر نسخة محفوظة. PUT: حفظ نسخة الجهاز بعد دمجها في الواجهة.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 2_000_000

export async function GET() {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  const row = await db.userProgress.findUnique({ where: { userId } })
  if (!row) return NextResponse.json({ data: null })
  try {
    return NextResponse.json({ data: JSON.parse(row.data), updatedAt: row.updatedAt })
  } catch {
    return NextResponse.json({ data: null })
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  const rl = checkRateLimit(`progress:${userId}`, RATE_LIMITS.PROGRESS_SAVE)
  if (!rl.allowed) return rateLimitResponse(rl)

  const text = await request.text()
  if (text.length > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 })
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return NextResponse.json({ error: 'invalid_progress' }, { status: 400 })
  }
  await db.userProgress.upsert({
    where: { userId },
    create: { userId, data: text },
    update: { data: text },
  })
  return NextResponse.json({ saved: true })
}
