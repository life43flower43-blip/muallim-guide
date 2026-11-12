// ============================================================================
// /api/push/cron?slot=morning|noon|evening — الإشعارات التحفيزية، يستدعيها مجدول Vercel ثلاث مرات يوميًا
// كل جهاز يتلقى تذكيرًا واحدًا على الأكثر في اليوم، في الوقت الذي اختاره صاحبه،
// ولا يُذكَّر من درس اليوم. ومن طال غيابه تقل التذكيرات تدريجيًا حتى لا تزعجه:
//   حتى ٧ أيام: يوميًا · حتى ٣٠ يومًا: كل ثلاثة أيام · بعدها: مرة في الأسبوع
// محمي بـ CRON_SECRET (يرسله Vercel في ترويسة Authorization تلقائيًّا).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { localDay, pushConfigured, sendPush, type PushPayload } from '@/lib/push'
import { MASTERED_REPETITIONS } from '@/lib/spaced-repetition'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const NUDGES: PushPayload[] = [
  { title: 'اشتقنا إليك!', body: 'افتح تربوي واكتشف شيئًا جديدًا اليوم.' },
  { title: 'حان وقت التعلم', body: 'لنكمل رحلتنا معًا، خمس دقائق تكفي.' },
  { title: 'هناك المزيد بانتظارك', body: 'عد إلينا اليوم، أسئلة ومفاهيم جديدة تنتظرك.' },
  { title: 'خمس دقائق تكفي اليوم', body: 'سؤالان أو ثلاثة يثبّتان ما تعلّمته.' },
  { title: 'درسك اليوم ينتظرك', body: 'مفهوم واحد جديد اليوم أفضل من عشرة في آخر الأسبوع.' },
]
const ON_TRACK: PushPayload = { title: 'لا تتوقف الآن!', body: 'أنت تحقق تقدمًا رائعًا، أكمل سلسلة أيامك اليوم.' }

const SLOTS = ['morning', 'noon', 'evening'] as const
const dayDiff = (a: string, b: string) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000)

/** هل يحين التذكير اليوم بحسب مدة الغياب؟ */
function dueToday(today: string, lastStudy: string | null, lastSent: string | null, createdDay: string) {
  if (lastSent === today) return false
  const away = dayDiff(today, lastStudy ?? createdDay)
  const sinceSent = lastSent ? dayDiff(today, lastSent) : 99
  if (away <= 7) return true
  if (away <= 30) return sinceSent >= 3
  return sinceSent >= 7
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!pushConfigured()) return NextResponse.json({ error: 'push_not_configured' }, { status: 503 })
  const raw = request.nextUrl.searchParams.get('slot') ?? 'evening'
  const slot = (SLOTS as readonly string[]).includes(raw) ? raw : 'evening'

  const now = new Date()
  const subs = await db.pushSubscription.findMany({ where: { slot } })
  let sent = 0
  let removed = 0
  let skipped = 0
  for (const s of subs) {
    const today = localDay(s.tzOffset, now)
    if (s.lastStudyDay === today || !dueToday(today, s.lastStudyDay, s.lastSentDay, localDay(s.tzOffset, s.createdAt))) {
      skipped++
      continue
    }
    let payload: PushPayload = NUDGES[(now.getUTCDate() + s.endpoint.length) % NUDGES.length]
    let url = '/app'
    if (s.userId) {
      const due = await db.reviewItem.count({
        where: { userId: s.userId, mistakeCount: { gt: 0 }, nextReview: { lte: now }, NOT: { isCorrect: true, repetitions: { gte: MASTERED_REPETITIONS } } },
      })
      if (due > 0) {
        const n = due.toLocaleString('ar-u-nu-arab')
        payload = { title: 'حان موعد مراجعة أخطائك', body: due === 1 ? 'خطأ واحد ينتظر المراجعة قبل أن يُنسى.' : `${n} أخطاء تنتظر المراجعة قبل أن تُنسى.` }
        url = '/app?tab=mistakes'
      } else if (s.lastStudyDay && dayDiff(today, s.lastStudyDay) === 1) {
        payload = ON_TRACK // درس أمس: تشجيع على إكمال السلسلة
      }
    }
    const res = await sendPush(s, { tag: 'daily', url, ...payload })
    if (res === 'gone') {
      await db.pushSubscription.delete({ where: { id: s.id } })
      removed++
    } else if (res === 'ok') {
      await db.pushSubscription.update({ where: { id: s.id }, data: { lastSentDay: today } })
      sent++
    }
  }
  return NextResponse.json({ ok: true, slot, sent, removed, skipped, total: subs.length })
}
