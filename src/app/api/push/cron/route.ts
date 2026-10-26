// ============================================================================
// /api/push/cron — التذكير اليومي، يستدعيه مجدول Vercel مرة في المساء
// يُذكَّر من لم يدرس اليوم بتوقيت جهازه: بأخطائه المستحقة إن وُجدت، وإلا بسلسلة أيامه.
// محمي بـ CRON_SECRET (يرسله Vercel في ترويسة Authorization تلقائيًّا).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { localDay, pushConfigured, sendPush, type PushPayload } from '@/lib/push'
import { MASTERED_REPETITIONS } from '@/lib/spaced-repetition'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const NUDGES: PushPayload[] = [
  { title: 'خمس دقائق تكفي اليوم', body: 'سؤالان أو ثلاثة يحفظان سلسلة أيامك ويثبّتان ما تعلّمته.' },
  { title: 'درسك اليوم ينتظرك', body: 'مفهوم واحد جديد اليوم أفضل من عشرة في آخر الأسبوع.' },
  { title: 'لا تكسر سلسلتك', body: 'افتح تربوي وأجب عن أسئلة قليلة قبل نهاية اليوم.' },
]

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!pushConfigured()) return NextResponse.json({ error: 'push_not_configured' }, { status: 503 })

  const now = new Date()
  const subs = await db.pushSubscription.findMany()
  let sent = 0
  let removed = 0
  for (const s of subs) {
    const today = localDay(s.tzOffset, now)
    if (s.lastStudyDay === today || s.lastSentDay === today) continue

    let payload = NUDGES[(now.getUTCDate() + s.endpoint.length) % NUDGES.length]
    if (s.userId) {
      const due = await db.reviewItem.count({
        where: { userId: s.userId, mistakeCount: { gt: 0 }, nextReview: { lte: now }, NOT: { isCorrect: true, repetitions: { gte: MASTERED_REPETITIONS } } },
      })
      if (due > 0) {
        const n = due.toLocaleString('ar-u-nu-arab')
        payload = { title: 'حان موعد مراجعة أخطائك', body: due === 1 ? 'خطأ واحد ينتظر المراجعة قبل أن يُنسى.' : `${n} أخطاء تنتظر المراجعة قبل أن تُنسى.`, url: '/?tab=mistakes' }
      }
    }
    const res = await sendPush(s, { tag: 'daily', url: '/', ...payload })
    if (res === 'gone') {
      await db.pushSubscription.delete({ where: { id: s.id } })
      removed++
    } else if (res === 'ok') {
      await db.pushSubscription.update({ where: { id: s.id }, data: { lastSentDay: today } })
      sent++
    }
  }
  return NextResponse.json({ ok: true, sent, removed, total: subs.length })
}
