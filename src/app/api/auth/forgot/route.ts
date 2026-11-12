// ============================================================================
// /api/auth/forgot — إرسال رابط استعادة كلمة المرور إلى البريد (Gmail أو Resend)
// 🛡️ الرد نفسه دائمًا، سواء وُجد البريد أم لا، حتى لا يُكشف من سجّل
// ============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { checkRateLimitShared, rateLimitResponse, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { SITE_URL } from '@/lib/public-bank'
import { mailConfigured, sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!mailConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const body = (await request.json().catch(() => ({}))) as { email?: string }
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 120)
  // حد للرسائل، حتى لا يُستعمل الموقع لإغراق بريد أحد
  const rIp = await checkRateLimitShared(`forgot-ip:${getClientIP(request)}`, RATE_LIMITS.AUTH_FORGOT_IP)
  const rEm = await checkRateLimitShared(`forgot-email:${email}`, RATE_LIMITS.AUTH_FORGOT)
  if (!rIp.allowed || !rEm.allowed) return NextResponse.json({ ok: true })
  try {
    const user = email ? await db.user.findUnique({ where: { email } }) : null
    if (user) {
      const token = randomBytes(24).toString('hex')
      await db.passwordReset.deleteMany({ where: { userId: user.id } })
      await db.passwordReset.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) } })
      const link = `${SITE_URL}/reset-password?token=${token}`
      const name = user.name.replace(/[<>&]/g, '')
      await sendMail(user.email, 'استعادة كلمة المرور في تربوي', `<div dir="rtl" style="font-family:Tahoma,Arial;font-size:16px;line-height:1.8">
            <p>مرحبًا ${name}،</p>
            <p>اسمك في التطبيق: <b>${name}</b></p>
            <p>اضغط الرابط لتعيين كلمة مرور جديدة، وهو صالح ساعة واحدة:</p>
            <p><a href="${link}">تعيين كلمة مرور جديدة</a></p>
            <p>إن لم تطلب ذلك فتجاهل هذه الرسالة.</p></div>`)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('forgot error:', err)
    return NextResponse.json({ ok: true })
  }
}
