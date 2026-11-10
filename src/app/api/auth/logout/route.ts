import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie, getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// الخروج: يمسح الكوكي، ويفصل إشعارات هذا الجهاز عن الحساب (تبقى تذكيرًا عامًا بلا بيانات الحساب)
export async function POST(request: NextRequest) {
  const userId = await getCurrentUser()
  const body = await request.json().catch(() => null)
  const endpoint = typeof body?.endpoint === 'string' && body.endpoint.length < 1000 ? body.endpoint : null
  if (userId && endpoint) {
    await db.pushSubscription.updateMany({ where: { endpoint, userId }, data: { userId: null } }).catch(() => {})
  }
  await clearAuthCookie()
  return NextResponse.json({ ok: true })
}
