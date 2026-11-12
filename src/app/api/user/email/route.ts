// طلب تغيير البريد: يحتاج كلمة المرور الحالية، ولا يتغير البريد إلا بعد تأكيد الرابط المرسل إلى البريد الجديد
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'
import { checkRateLimitShared, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { sendVerifyLink } from '@/lib/email-verify'

export const dynamic = 'force-dynamic'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'سجّل الدخول أولًا' }, { status: 401 })
  const rl = await checkRateLimitShared(`email-change:${userId}`, RATE_LIMITS.AUTH_FORGOT)
  if (!rl.allowed) return rateLimitResponse(rl, 'محاولات كثيرة. حاول بعد ساعة.')
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 120)
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 })
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
  if (email === user.email) return NextResponse.json({ error: 'هذا بريدك الحالي' }, { status: 400 })
  if (user.password && !(await verifyPassword(String(body.password ?? ''), user.password)))
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 400 })
  if (await db.user.findUnique({ where: { email } })) return NextResponse.json({ error: 'هذا البريد مستخدم في حساب آخر' }, { status: 409 })
  const ok = await sendVerifyLink(user, 'change', email)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'تعذّر إرسال الرسالة الآن، حاول لاحقًا' }, { status: 502 })
}
