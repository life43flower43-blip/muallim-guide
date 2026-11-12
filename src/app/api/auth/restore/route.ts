// /api/auth/restore — استعادة الدخول من النسخة الاحتياطية المحفوظة على الجهاز
// بعض الجوالات والمتصفحات تمسح الكوكي عند إغلاق التطبيق؛ الرمز موقَّع ويبطل بالخروج وتغيير كلمة المرور
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setAuthCookie, verifyToken } from '@/lib/auth'
import { checkRateLimitShared, rateLimitResponse, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const r = await checkRateLimitShared(`restore-ip:${getClientIP(req)}`, RATE_LIMITS.AUTH_LOGIN)
  if (!r.allowed) return rateLimitResponse(r, 'محاولات كثيرة')
  const body = (await req.json().catch(() => ({}))) as { token?: string }
  const payload = await verifyToken(String(body.token ?? '').slice(0, 2000))
  if (!payload) return NextResponse.json({ ok: false }, { status: 401 })
  const u = await db.user.findUnique({ where: { id: payload.userId }, select: { tokenVersion: true } })
  if (!u || u.tokenVersion !== payload.tv) return NextResponse.json({ ok: false }, { status: 401 })
  await setAuthCookie(payload.userId)
  return NextResponse.json({ ok: true })
}
