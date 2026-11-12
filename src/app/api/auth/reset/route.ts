// /api/auth/reset — تعيين كلمة مرور جديدة برمز الاستعادة، ثم الدخول مباشرة
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimitShared, rateLimitResponse, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { revokeAllSessions, setAuthCookie } from '@/lib/auth'
import { sendSecurityNotice } from '@/lib/email-verify'
import { hashPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimitShared(`reset:${getClientIP(request)}`, RATE_LIMITS.AUTH_REGISTER)
  if (!rl.allowed) return rateLimitResponse(rl)
  const body = (await request.json().catch(() => ({}))) as { token?: string; password?: string }
  const token = String(body.token ?? '').slice(0, 100)
  const password = String(body.password ?? '').slice(0, 128)
  if (password.length < 8) return NextResponse.json({ error: 'كلمة المرور ٨ أحرف على الأقل' }, { status: 400 })
  const row = token ? await db.passwordReset.findUnique({ where: { token } }) : null
  if (!row || row.expiresAt < new Date()) return NextResponse.json({ error: 'الرابط منتهي أو غير صالح، اطلب رابطًا جديدًا' }, { status: 400 })
  // فتح رابط الاستعادة يثبت ملكية البريد
  const u = await db.user.update({ where: { id: row.userId }, data: { password: await hashPassword(password), emailVerified: new Date() } })
  await db.passwordReset.deleteMany({ where: { userId: row.userId } })
  // من كان داخل الحساب بكلمة المرور القديمة يخرج
  await revokeAllSessions(row.userId)
  await setAuthCookie(row.userId)
  await sendSecurityNotice(u.email, u.name, 'password').catch(() => false)
  return NextResponse.json({ ok: true })
}
