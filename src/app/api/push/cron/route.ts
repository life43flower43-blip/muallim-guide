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
import { publicBank } from '@/lib/public-bank'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// رسائل متنوعة: لا تتكرر الرسالة نفسها قبل أن تمر على القائمة كلها
const NUDGES: PushPayload[] = [
  { title: 'اشتقنا إليك! 👋', body: 'افتح تربوي واكتشف شيئًا جديدًا اليوم.' },
  { title: 'حان وقت التعلم 📚', body: 'لنكمل رحلتنا معًا، خمس دقائق تكفي.' },
  { title: 'هناك المزيد بانتظارك ✨', body: 'عد إلينا اليوم، أسئلة ومفاهيم جديدة تنتظرك.' },
  { title: 'خمس دقائق تكفي اليوم ⏱️', body: 'سؤالان أو ثلاثة يثبّتان ما تعلّمته.' },
  { title: 'درسك اليوم ينتظرك', body: 'مفهوم واحد جديد اليوم أفضل من عشرة في آخر الأسبوع.' },
  { title: 'تحدٍّ صغير لك 🎯', body: 'هل تستطيع الإجابة عن ٥ أسئلة متتالية دون خطأ؟' },
  { title: 'المعلم المتميز يتعلم كل يوم 🌱', body: 'خطوة صغيرة اليوم تصنع فرقًا كبيرًا في صفك.' },
  { title: 'سؤال سريع؟ 🤔', body: 'سؤال واحد فقط، وشرح إجابته في ثوانٍ.' },
  { title: 'ذاكرتك تحتاج تنشيطًا 🧠', body: 'المراجعة المتباعدة تثبّت المعلومة أضعاف القراءة المتواصلة.' },
  { title: 'أكمل دراستك 📖', body: 'توقفت في منتصف الطريق، لنكمل من حيث انتهيت.' },
  { title: 'خطط لاختبارك 🗓️', body: 'حدد موعد اختبارك، ونرتب لك ما تراجعه كل يوم.' },
  { title: 'اقترب موعد اختبارك؟ ⏳', body: 'المراجعة اليومية القصيرة أنفع من سهر ليلة الاختبار.' },
  { title: 'راجع ما درسته 🔁', body: 'مراجعة سريعة اليوم تثبّت ما تعلمته أمس.' },
  { title: 'تعلّم مفهومًا جديدًا 💡', body: 'مفهوم واحد اليوم بأمثلة من داخل الصف.' },
  { title: 'استراحة قهوة مفيدة ☕', body: 'دقيقتان مع تربوي بين حصة وأخرى.' },
  { title: 'لا تدع ما تعلمته يتلاشى', body: 'نراجع معك ما درسته في دقائق قليلة.' },
  { title: 'جاهز لاختبار نفسك؟ 📝', body: 'جرّب محاكي الاختبار وقِس مستواك اليوم.' },
  { title: 'قليل دائم خير من كثير منقطع', body: 'افتح تربوي الآن وحافظ على عادتك اليومية.' },
  { title: 'طلابك يستحقون الأفضل 🍎', body: 'وأنت تستحق أن تكون أفضل معلم لهم. لنتعلم اليوم.' },
  { title: 'مرّ وقت منذ آخر زيارة', body: 'عد إلى حيث توقفت، تقدّمك محفوظ.' },
]
const MORNING: PushPayload[] = [
  { title: 'صباح الخير ☀️', body: 'ابدأ يومك بسؤال واحد يوقظ عقلك.' },
  { title: 'صباح التعلم 🌤️', body: 'أفضل وقت للتعلم هو أول اليوم، خمس دقائق فقط.' },
]
const NOON: PushPayload[] = [
  { title: 'استراحة الظهيرة 🕐', body: 'دقائق قليلة مع تربوي تجدد نشاطك.' },
  { title: 'منتصف اليوم 🌿', body: 'راجع مفهومًا واحدًا قبل أن يمضي اليوم.' },
]
const EVENING: PushPayload[] = [
  { title: 'مساء الخير 🌙', body: 'اختم يومك بمراجعة سريعة قبل النوم.' },
  { title: 'قبل أن ينتهي اليوم ✨', body: 'خمس دقائق الآن تحفظ سلسلة أيامك.' },
]
const ON_TRACK: PushPayload[] = [
  { title: 'لا تتوقف الآن! 🔥', body: 'أنت تحقق تقدمًا رائعًا، أكمل سلسلة أيامك اليوم.' },
  { title: 'سلسلتك مشتعلة 🔥', body: 'درست أمس، فلا تقطعها اليوم.' },
  { title: 'أداء رائع أمس 👏', body: 'استمر، يوم آخر يقرّبك من هدفك.' },
]
const MISTAKES = (n: string, one: boolean): PushPayload[] => [
  { title: 'حان موعد مراجعة أخطائك', body: one ? 'خطأ واحد ينتظر المراجعة قبل أن يُنسى.' : `${n} أخطاء تنتظر المراجعة قبل أن تُنسى.` },
  { title: 'أخطاؤك فرصتك 💪', body: one ? 'راجع خطأك الآن وحوّله إلى إجابة صحيحة.' : `${n} أخطاء تنتظرك، صحّحها اليوم ولن تتكرر.` },
]
/** معلومة اليوم: عنوان مفهوم حقيقي من البنك، فتختلف الرسالة كل يوم */
function conceptNudge(seed: number): { payload: PushPayload; url: string } | null {
  const list = publicBank().concepts.filter((c) => c.rule)
  if (!list.length) return null
  const c = list[(seed * 389) % list.length]
  return { payload: { title: 'معلومة اليوم 💡', body: `${c.title}: اقرأها في دقيقة.` }, url: `/learn/${c.courseId}/${c.id}` }
}
const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length]

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
    // بذرة تتغير كل يوم ولكل جهاز: رسالة مختلفة يوميًا، ولا يتلقى الجميع الرسالة نفسها
    const dayNum = Math.floor(Date.parse(today + 'T00:00:00Z') / 86400000)
    const seed = dayNum + (s.endpoint.length * 7 + s.endpoint.charCodeAt(s.endpoint.length - 1))
    const bySlot = slot === 'morning' ? MORNING : slot === 'noon' ? NOON : EVENING
    let payload: PushPayload = seed % 5 === 0 ? pick(bySlot, seed) : pick(NUDGES, seed)
    let url = '/app'
    if (seed % 3 === 0) {
      const c = conceptNudge(seed)
      if (c) ({ payload, url } = c)
    }
    if (s.userId) {
      const due = await db.reviewItem.count({
        where: { userId: s.userId, mistakeCount: { gt: 0 }, nextReview: { lte: now }, NOT: { isCorrect: true, repetitions: { gte: MASTERED_REPETITIONS } } },
      })
      if (due > 0 && seed % 2 === 0) {
        payload = pick(MISTAKES(due.toLocaleString('ar-u-nu-arab'), due === 1), seed)
        url = '/app?tab=mistakes'
      } else if (s.lastStudyDay && dayDiff(today, s.lastStudyDay) === 1) {
        payload = pick(ON_TRACK, seed) // درس أمس: تشجيع على إكمال السلسلة
        url = '/app'
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
