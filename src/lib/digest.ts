// ============================================================================
// digest.ts — الملخص الأسبوعي بالبريد: مقالات الأسبوع، ومعلومة، ورابط اختبار الأسبوع
// لا يصل إلا لمن وافق (emailOptIn)، وفي كل رسالة رابط إلغاء موقّع
// ============================================================================
import { createHmac, timingSafeEqual } from 'crypto'
import { allArticles, todayISO } from '@/lib/articles'
import { SITE_URL } from '@/lib/public-bank'

const key = () => `${process.env.JWT_SECRET || process.env.CRON_SECRET || ''}:unsubscribe`
export const unsubToken = (userId: string) => createHmac('sha256', key()).update(userId).digest('hex').slice(0, 32)
export function unsubValid(userId: string, t: string) {
  const want = Buffer.from(unsubToken(userId))
  const got = Buffer.from(String(t || ''))
  return got.length === want.length && timingSafeEqual(got, want)
}
export const unsubLink = (userId: string) => `${SITE_URL}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubToken(userId)}`

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!)

/** مقالات آخر سبعة أيام، وإن لم توجد فأحدث ثلاث */
export function weekArticles() {
  const today = todayISO()
  const from = new Date(new Date(today + 'T12:00:00Z').getTime() - 7 * 86400000).toISOString().slice(0, 10)
  const all = allArticles()
  const week = all.filter((a) => a.date > from)
  return (week.length ? week : all).slice(0, 5)
}

export function digestHtml(name: string, userId: string) {
  const items = weekArticles()
    .map(
      (a) => `<tr><td style="padding:12px 0;border-bottom:1px solid #E6EFEA">
        <a href="${SITE_URL}/articles/${a.slug}?utm_source=email&utm_medium=digest" style="font-size:17px;font-weight:bold;color:#136F5C;text-decoration:none">${esc(a.title)}</a>
        <div style="font-size:14px;color:#4A5F57;margin-top:4px">${esc(a.description.slice(0, 160))}</div></td></tr>`
    )
    .join('')
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#F6F8F7;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:24px">
    <div style="font-size:22px;font-weight:bold;color:#14302A">تربوي · ملخص الأسبوع</div>
    <p style="font-size:15px;color:#3A5249;line-height:1.8">مرحبًا ${esc(name)}، هذه أبرز مقالات الأسبوع في التدريس والتعلم:</p>
    <table style="width:100%;border-collapse:collapse">${items}</table>
    <p style="margin-top:20px"><a href="${SITE_URL}/weekly-test?utm_source=email&utm_medium=digest" style="display:inline-block;background:#136F5C;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">اختبر نفسك في اختبار الأسبوع</a></p>
    <p style="font-size:12px;color:#8A9A93;margin-top:24px;line-height:1.7">وصلتك هذه الرسالة لأنك وافقت على الملخص الأسبوعي من تربوي.<br>
    <a href="${unsubLink(userId)}" style="color:#8A9A93">إلغاء الاشتراك بضغطة واحدة</a></p>
  </div></div>`
}
