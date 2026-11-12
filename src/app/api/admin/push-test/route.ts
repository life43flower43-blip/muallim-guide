// إشعار تجريبي لصاحب الموقع: يرسل إلى كل أجهزة حساب ببريده، ويبيّن عدد الأجهزة المشتركة
// محمي بمفتاح المشرف (كوكي /connect أو ترويسة Authorization بـ CRON_SECRET)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/admin'
import { pushConfigured, sendPush, lastPushError } from '@/lib/push'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const bearer = !!secret && req.headers.get('authorization') === `Bearer ${secret}`
  if (!bearer && !(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!pushConfigured()) return NextResponse.json({ error: 'push_not_configured' }, { status: 503 })
  const isForm = (req.headers.get('content-type') ?? '').includes('form')
  const body = isForm ? Object.fromEntries((await req.formData().catch(() => new FormData())).entries()) : ((await req.json().catch(() => ({}))) as { email?: string; recent?: boolean })
  const email = String(body.email ?? '').trim().toLowerCase()
  const back = (q: string) => NextResponse.redirect(new URL(`/connect?${q}`, req.url), 303)
  // recent: إلى آخر جهاز اشترك (لاختبار جوال لم يُربط بحساب بعد)
  if ((body as { recent?: unknown }).recent) {
    const s = await db.pushSubscription.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!s) return NextResponse.json({ devices: 0 })
    const r = await sendPush(s, { title: 'إشعار تجريبي من تربوي', body: 'إن وصلك هذا الإشعار فالإشعارات تعمل على جهازك ✅', url: '/app', tag: 'test' })
    if (r === 'gone') await db.pushSubscription.delete({ where: { id: s.id } })
    return NextResponse.json({ devices: 1, linked: !!s.userId, createdAt: s.createdAt, results: [r], error: r === 'error' ? lastPushError : undefined })
  }
  const user = email ? await db.user.findUnique({ where: { email }, select: { id: true } }) : null
  const totalSubs = await db.pushSubscription.count()
  if (!user) return isForm ? back('push=nouser') : NextResponse.json({ user: false, totalSubs })
  const subs = await db.pushSubscription.findMany({ where: { userId: user.id } })
  const results: string[] = []
  for (const s of subs) {
    const r = await sendPush(s, { title: 'إشعار تجريبي من تربوي', body: 'إن وصلك هذا الإشعار فالإشعارات تعمل على جهازك ✅', url: '/app', tag: 'test' })
    if (r === 'gone') await db.pushSubscription.delete({ where: { id: s.id } })
    results.push(r)
  }
  if (isForm) {
    const ok = results.filter((r) => r === 'ok').length
    return back(!subs.length ? 'push=none' : ok ? `push=sent&n=${ok}` : 'push=fail')
  }
  return NextResponse.json({ user: true, devices: subs.length, results, totalSubs })
}
