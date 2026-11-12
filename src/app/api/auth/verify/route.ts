// تأكيد البريد من الرابط: يؤكد بريد الحساب، أو يعتمد البريد الجديد عند طلب تغييره
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { checkRateLimitShared, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { sendSecurityNotice, sendVerifyLink } from '@/lib/email-verify'

export const dynamic = 'force-dynamic'

const go = (req: NextRequest, q: string) => NextResponse.redirect(new URL(`/app?tab=profile&${q}`, req.url), 303)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const row = token ? await db.emailToken.findUnique({ where: { token } }).catch(() => null) : null
  if (!row || row.expiresAt < new Date()) return go(req, 'verify=expired')
  await db.emailToken.delete({ where: { token } }).catch(() => {})
  const user = await db.user.findUnique({ where: { id: row.userId } })
  if (!user) return go(req, 'verify=expired')
  if (row.kind === 'change' && row.newEmail) {
    const taken = await db.user.findUnique({ where: { email: row.newEmail } })
    if (taken && taken.id !== user.id) return go(req, 'verify=taken')
    await db.user.update({ where: { id: user.id }, data: { email: row.newEmail, emailVerified: new Date() } })
    await sendSecurityNotice(user.email, user.name, 'email', row.newEmail)
    return go(req, 'verify=changed')
  }
  await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
  return go(req, 'verify=ok')
}

/** إعادة إرسال رابط التأكيد للمسجّل */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'سجّل الدخول أولًا' }, { status: 401 })
  const rl = await checkRateLimitShared(`verify:${userId}:${getClientIP(req)}`, RATE_LIMITS.AUTH_FORGOT)
  if (!rl.allowed) return rateLimitResponse(rl, 'أرسلنا رسائل كثيرة. حاول بعد قليل.')
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
  if (user.emailVerified) return NextResponse.json({ ok: true, already: true })
  const ok = await sendVerifyLink(user)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'تعذّر إرسال الرسالة الآن، حاول لاحقًا' }, { status: 502 })
}
