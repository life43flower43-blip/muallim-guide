// ============================================================================
// mailer.ts — إرسال البريد: Gmail مجانًا إن ضُبط، وإلا Resend
// GMAIL_USER + GMAIL_APP_PASSWORD (كلمة مرور تطبيق من حساب Google) ← يصل لأي بريد
// RESEND_API_KEY بلا نطاق موثّق ← يصل فقط لبريد صاحب حساب Resend
// كل فشل يُسجَّل في جدول الأعطال فيظهر في /connect
// ============================================================================
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

export const mailConfigured = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) || !!process.env.RESEND_API_KEY

async function logFailure(provider: string, detail: string) {
  const id = `mail:${provider}:${detail.slice(0, 60)}`
  await db.clientError
    .upsert({
      where: { id },
      create: { id, message: `فشل إرسال البريد (${provider}): ${detail}`.slice(0, 500), url: '/api/auth/forgot', version: 'server' },
      update: { count: { increment: 1 }, lastAt: new Date() },
    })
    .catch(() => {})
}

export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const gUser = process.env.GMAIL_USER
  const gPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')
  if (gUser && gPass) {
    try {
      const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: gUser, pass: gPass } })
      await t.sendMail({ from: `تربوي <${gUser}>`, to, subject, html })
      return true
    } catch (e) {
      await logFailure('gmail', String((e as Error)?.message ?? e))
      if (!process.env.RESEND_API_KEY) return false
    }
  }
  if (process.env.RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: process.env.RESEND_FROM || 'تربوي <onboarding@resend.dev>', to: [to], subject, html }),
      })
      if (r.ok) return true
      const j = (await r.json().catch(() => ({}))) as { message?: string }
      await logFailure('resend', `${r.status} ${j.message ?? ''}`)
    } catch (e) {
      await logFailure('resend', String((e as Error)?.message ?? e))
    }
  }
  return false
}
