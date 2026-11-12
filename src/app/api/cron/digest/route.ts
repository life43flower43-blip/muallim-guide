// /api/cron/digest — الملخص الأسبوعي بالبريد، يستدعيه مجدول Vercel مرة في الأسبوع
// محمي بـ CRON_SECRET. حد Gmail المجاني نحو ٥٠٠ رسالة يوميًا، فنرسل ٣٠٠ في كل تشغيل على الأكثر.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mailConfigured, sendMail } from '@/lib/mailer'
import { digestHtml, unsubLink } from '@/lib/digest'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!mailConfigured()) return NextResponse.json({ error: 'mail_not_configured' }, { status: 503 })
  const since = new Date(Date.now() - 6 * 86400000)
  const users = await db.user.findMany({
    where: { emailOptIn: true, OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: since } }] },
    select: { id: true, email: true, name: true },
    take: 300,
  })
  const dry = request.nextUrl.searchParams.get('dry') === '1'
  if (dry) return NextResponse.json({ recipients: users.length })
  let sent = 0
  const started = Date.now()
  for (const u of users) {
    if (Date.now() - started > 50000) break // نبقى ضمن مهلة الدالة، والباقي في التشغيل القادم
    const link = unsubLink(u.id)
    const ok = await sendMail(u.email, 'ملخص الأسبوع من تربوي', digestHtml(u.name, u.id), {
      'List-Unsubscribe': `<${link}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })
    if (ok) {
      sent++
      await db.user.update({ where: { id: u.id }, data: { lastDigestAt: new Date() } }).catch(() => {})
    }
  }
  return NextResponse.json({ recipients: users.length, sent })
}
