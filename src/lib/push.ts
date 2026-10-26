// إرسال الإشعارات من الخادم بمفاتيح VAPID — تعمل حين تُضبط متغيرات البيئة فقط
import webpush from 'web-push'

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''

export const pushConfigured = () => Boolean(PUBLIC && PRIVATE)

let ready = false
function setup() {
  if (ready || !pushConfigured()) return
  webpush.setVapidDetails(`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@turbawy.app'}`, PUBLIC, PRIVATE)
  ready = true
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string }

/** يرسل إشعارًا واحدًا، ويعيد «gone» إذا لم يعد الاشتراك صالحًا فيُحذف */
export async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload): Promise<'ok' | 'gone' | 'error'> {
  setup()
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal' })
    return 'ok'
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode
    return code === 404 || code === 410 ? 'gone' : 'error'
  }
}

/** اليوم المحلي لجهاز بفرق توقيته (بالدقائق كما يعطيها getTimezoneOffset) */
export function localDay(tzOffset: number, now = new Date()): string {
  return new Date(now.getTime() - tzOffset * 60_000).toISOString().slice(0, 10)
}
