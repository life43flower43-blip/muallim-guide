// /api/auth/reset — تعيين كلمة مرور جديدة برمز الاستعادة، ثم الدخول مباشرة
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setAuthCookie } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { token?: string; password?: string }
  const token = String(body.token ?? '').slice(0, 100)
  const password = String(body.password ?? '').slice(0, 128)
  if (password.length < 8) return NextResponse.json({ error: 'كلمة المرور ٨ أحرف على الأقل' }, { status: 400 })
  const row = token ? await db.passwordReset.findUnique({ where: { token } }) : null
  if (!row || row.expiresAt < new Date()) return NextResponse.json({ error: 'الرابط منتهي أو غير صالح، اطلب رابطًا جديدًا' }, { status: 400 })
  await db.user.update({ where: { id: row.userId }, data: { password: await hashPassword(password) } })
  await db.passwordReset.deleteMany({ where: { userId: row.userId } })
  await setAuthCookie(row.userId)
  return NextResponse.json({ ok: true })
}
