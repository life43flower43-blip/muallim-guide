// ============================================================================
// /api/auth/register — إنشاء حساب بالبريد وكلمة المرور، ثم تسجيل الدخول مباشرة
// ============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit, rateLimitResponse, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { setAuthCookie } from '@/lib/auth'
import { createUserWithWelcome } from '@/lib/accounts'
import { hashPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`register:${getClientIP(request)}`, RATE_LIMITS.AUTH_REGISTER)
  if (!rl.allowed) return rateLimitResponse(rl, 'حسابات كثيرة من هذا الجهاز. حاول لاحقًا.')
  const body = (await request.json().catch(() => ({}))) as { name?: string; email?: string; password?: string }
  const name = String(body.name ?? '').trim().slice(0, 60)
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 120)
  const password = String(body.password ?? '')

  if (name.length < 2) return NextResponse.json({ error: 'اكتب اسمك (حرفان على الأقل)' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 })
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: 'كلمة المرور ٨ أحرف على الأقل' }, { status: 400 })

  try {
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: existing.password ? 'هذا البريد مسجل من قبل. اختر «دخول»' : 'هذا البريد مسجل بحساب Google. ادخل بزر Google' },
        { status: 409 }
      )
    }
    const user = await createUserWithWelcome({ email, name, password: await hashPassword(password) })
    await setAuthCookie(user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('register error:', err)
    return NextResponse.json({ error: 'تعذّر إنشاء الحساب، حاول مرة أخرى' }, { status: 500 })
  }
}
