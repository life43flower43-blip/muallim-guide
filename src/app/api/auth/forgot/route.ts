// ============================================================================
// /api/auth/forgot — إرسال رابط استعادة كلمة المرور إلى البريد (عبر Resend)
// 🛡️ الرد نفسه دائمًا، سواء وُجد البريد أم لا، حتى لا يُكشف من سجّل
// ============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { SITE_URL } from '@/lib/public-bank'

export const dynamic = 'force-dynamic'

const resetConfigured = () => !!process.env.RESEND_API_KEY

export async function POST(request: NextRequest) {
  if (!resetConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  const body = (await request.json().catch(() => ({}))) as { email?: string }
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 120)
  try {
    const user = email ? await db.user.findUnique({ where: { email } }) : null
    if (user) {
      const token = randomBytes(24).toString('hex')
      await db.passwordReset.deleteMany({ where: { userId: user.id } })
      await db.passwordReset.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + 3600_000) } })
      const link = `${SITE_URL}/reset-password?token=${token}`
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'تربوي <onboarding@resend.dev>',
          to: [user.email],
          subject: 'استعادة كلمة المرور في تربوي',
          html: `<div dir="rtl" style="font-family:Tahoma,Arial;font-size:16px;line-height:1.8">
            <p>مرحبًا ${user.name.replace(/[<>&]/g, '')}،</p>
            <p>اسمك في التطبيق: <b>${user.name.replace(/[<>&]/g, '')}</b></p>
            <p>اضغط الرابط لتعيين كلمة مرور جديدة، وهو صالح ساعة واحدة:</p>
            <p><a href="${link}">تعيين كلمة مرور جديدة</a></p>
            <p>إن لم تطلب ذلك فتجاهل هذه الرسالة.</p></div>`,
        }),
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('forgot error:', err)
    return NextResponse.json({ ok: true })
  }
}
