// ============================================================================
// /api/push/subscribe — تفعيل الإشعارات لهذا الجهاز أو إلغاؤها
// POST: { subscription, tzOffset } — DELETE: { endpoint }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const isUrl = (s: unknown): s is string => typeof s === 'string' && s.startsWith('https://') && s.length < 1000
const isKey = (s: unknown): s is string => typeof s === 'string' && s.length > 10 && s.length < 300

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`push:${getClientIP(request)}`, RATE_LIMITS.PROGRESS_SAVE)
  if (!rl.allowed) return rateLimitResponse(rl)
  const body = await request.json().catch(() => null)
  const sub = body?.subscription
  if (!sub || !isUrl(sub.endpoint) || !isKey(sub.keys?.p256dh) || !isKey(sub.keys?.auth)) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 })
  }
  const tzOffset = Number.isFinite(body.tzOffset) ? Math.max(-840, Math.min(840, Math.round(body.tzOffset))) : 0
  const userId = await getCurrentUser()
  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, tzOffset, userId },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, tzOffset, ...(userId ? { userId } : {}) },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!isUrl(body?.endpoint)) return NextResponse.json({ error: 'invalid_endpoint' }, { status: 400 })
  await db.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } })
  return NextResponse.json({ ok: true })
}
