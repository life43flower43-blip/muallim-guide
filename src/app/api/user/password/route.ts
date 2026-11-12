// /api/user/password — تغيير كلمة المرور من داخل الحساب، ويخرج كل الأجهزة الأخرى
import { sendSecurityNotice } from '@/lib/email-verify'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, revokeAllSessions, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { checkRateLimitShared, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'سجّل الدخول أولًا' }, { status: 401 })
  const rl = await checkRateLimitShared(`pwchange:${userId}`, RATE_LIMITS.AUTH_LOGIN)
  if (!rl.allowed) return rateLimitResponse(rl)
  const body = (await request.json().catch(() => ({}))) as { current?: string; password?: string }
  const current = String(body.current ?? '').slice(0, 128)
  const password = String(body.password ?? '').slice(0, 128)
  if (password.length < 8) return NextResponse.json({ error: 'كلمة المرور الجديدة ٨ أحرف على الأقل' }, { status: 400 })
  const user = await db.user.findUnique({ where: { id: userId }, select: { password: true, email: true, name: true } })
  if (!user) return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
  // حساب Google بلا كلمة مرور: يضع كلمة مرور أول مرة دون الحالية
  if (user.password && !(await verifyPassword(current, user.password))) {
    return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
  }
  await db.user.update({ where: { id: userId }, data: { password: await hashPassword(password) } })
  await revokeAllSessions(userId)
  await setAuthCookie(userId)
  await sendSecurityNotice(user.email, user.name, 'password').catch(() => false)
  return NextResponse.json({ ok: true })
}
