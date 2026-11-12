// ============================================================================
// email-verify.ts — روابط تأكيد البريد وتغييره، ورسائل الأمان (تغيير كلمة المرور والبريد)
// الرابط صالح ٢٤ ساعة ويُستعمل مرة واحدة
// ============================================================================
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { sendMail } from '@/lib/mailer'
import { SITE_URL } from '@/lib/public-bank'

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!)
const wrap = (inner: string) => `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:1.8;color:#14302A">${inner}<p style="font-size:12px;color:#8A9A93">تربوي · ${SITE_URL.replace('https://', '')}</p></div>`

/** ينشئ رابط تأكيد ويرسله. kind=verify لبريد الحساب، وchange لبريد جديد */
export async function sendVerifyLink(user: { id: string; name: string; email: string }, kind: 'verify' | 'change' = 'verify', newEmail?: string) {
  const token = randomBytes(24).toString('hex')
  await db.emailToken.deleteMany({ where: { userId: user.id, kind } })
  await db.emailToken.create({ data: { token, userId: user.id, kind, newEmail: newEmail ?? null, expiresAt: new Date(Date.now() + 24 * 3600_000) } })
  const link = `${SITE_URL}/api/auth/verify?token=${token}`
  const to = kind === 'change' ? newEmail! : user.email
  const subject = kind === 'change' ? 'تأكيد بريدك الجديد في تربوي' : 'تأكيد بريدك في تربوي'
  const body =
    kind === 'change'
      ? `<p>مرحبًا ${esc(user.name)}،</p><p>طلبت تغيير بريد حسابك إلى هذا البريد. اضغط الرابط لاعتماده، وهو صالح ٢٤ ساعة:</p>`
      : `<p>مرحبًا ${esc(user.name)}، أهلًا بك في تربوي.</p><p>اضغط الرابط لتأكيد أن هذا البريد بريدك، وهو صالح ٢٤ ساعة:</p>`
  return sendMail(to, subject, wrap(`${body}<p><a href="${link}" style="display:inline-block;background:#136F5C;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold">تأكيد البريد</a></p><p style="font-size:13px;color:#6B8077">إن لم تطلب ذلك فتجاهل هذه الرسالة.</p>`))
}

/** رسالة أمان: تغيّرت كلمة المرور أو البريد */
export function sendSecurityNotice(email: string, name: string, what: 'password' | 'email', newEmail?: string) {
  const line =
    what === 'password'
      ? 'تغيّرت كلمة مرور حسابك في تربوي، وخرجت الأجهزة الأخرى من حسابك.'
      : `تغيّر بريد حسابك في تربوي إلى: <b dir="ltr">${esc(newEmail ?? '')}</b>`
  return sendMail(email, what === 'password' ? 'تغيّرت كلمة مرورك في تربوي' : 'تغيّر بريد حسابك في تربوي', wrap(`<p>مرحبًا ${esc(name)}،</p><p>${line}</p><p>إن لم تكن أنت من فعل ذلك فاستعد حسابك فورًا من «نسيت كلمة المرور» في التطبيق، وتواصل معنا: ${SITE_URL}/contact</p>`))
}
