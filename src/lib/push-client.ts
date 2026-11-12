'use client'

// الإشعارات من جهة الجهاز: التفعيل والإلغاء، وإخبار الخادم أن الطالب درس اليوم
import { useSyncExternalStore } from 'react'

const KEY = 'turbawy-push-endpoint'
const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

export type PushState = 'unsupported' | 'denied' | 'on' | 'off'

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function read(): PushState {
  if (typeof window === 'undefined' || !VAPID || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return localStorage.getItem(KEY) && Notification.permission === 'granted' ? 'on' : 'off'
  } catch {
    return 'off'
  }
}

export function usePushState(): PushState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => 'unsupported'
  )
}

// المفتاح من الخادم (مشتق من المفتاح الخاص) وليس من إعدادات البناء، فلا يختلفان أبدًا
let serverKey: Promise<string> | null = null
function vapidKey(): Promise<string> {
  serverKey ??= fetch('/api/push/key', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : {}))
    .then((j: { key?: string }) => j.key || VAPID)
    .catch(() => VAPID)
  return serverKey
}

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** اشتراك الجهاز بالمفتاح الصحيح: القديم بمفتاح مختلف يُلغى ويُنشأ بدله */
async function currentSub(reg: ServiceWorkerRegistration, create: boolean): Promise<PushSubscription | null> {
  let sub = await reg.pushManager.getSubscription()
  const want = keyBytes(await vapidKey())
  const have = sub?.options?.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null
  if (sub && have && (have.length !== want.length || have.some((b, i) => b !== want[i]))) {
    await sub.unsubscribe()
    sub = null
  }
  if (!sub && create) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: want })
  return sub
}

/** يطلب الإذن ويشترك. يعيد true عند النجاح */
export async function enablePush(): Promise<boolean> {
  if (read() === 'unsupported') return false
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    emit()
    return false
  }
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await currentSub(reg, true)
    if (!sub) return false
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), tzOffset: new Date().getTimezoneOffset(), slot: getPushSlot() }),
    })
    if (!res.ok) return false
    localStorage.setItem(KEY, sub.endpoint)
    emit()
    return true
  } catch (e) {
    fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `push enable failed: ${String((e as Error)?.message ?? e).slice(0, 200)}`, url: '/app' }), keepalive: true }).catch(() => {})
    return false
  }
}

export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    const endpoint = sub?.endpoint ?? localStorage.getItem(KEY)
    await sub?.unsubscribe()
    if (endpoint) await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint }) })
  } catch {}
  try {
    localStorage.removeItem(KEY)
  } catch {}
  emit()
}

/** بعد كل جلسة: لا تذكير الليلة لمن درس اليوم */
export function pingStudied() {
  try {
    const endpoint = localStorage.getItem(KEY)
    if (!endpoint) return
    fetch('/api/push/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint, day: today() }), keepalive: true }).catch(() => {})
  } catch {}
}

/** عند فتح التطبيق: إن كان الإذن ممنوحًا فأعد تسجيل اشتراك الجهاز على الخادم،
 *  وإن كان الاشتراك القديم بمفتاح مختلف فأنشئ اشتراكًا جديدًا. فلا يبقى «مفعّل» في الواجهة وهو غير مسجل على الخادم. */
export async function syncPush(): Promise<void> {
  try {
    if (read() === 'unsupported' || Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    const sub = await currentSub(reg, !!localStorage.getItem(KEY)) // لا ننشئ اشتراكًا لمن لم يفعّلها
    if (!sub) return
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), tzOffset: new Date().getTimezoneOffset(), slot: getPushSlot() }),
    })
    if (res.ok) {
      localStorage.setItem(KEY, sub.endpoint)
      emit()
    }
  } catch (e) {
    fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `push sync failed: ${String((e as Error)?.message ?? e).slice(0, 200)}`, url: '/app' }), keepalive: true }).catch(() => {})
  }
}

const SLOT_KEY = 'turbawy-push-slot'
export type PushSlot = 'morning' | 'noon' | 'evening'
export function getPushSlot(): PushSlot {
  try {
    const v = localStorage.getItem(SLOT_KEY)
    if (v === 'morning' || v === 'noon' || v === 'evening') return v
  } catch {}
  return 'evening'
}
/** يغيّر وقت التذكير لهذا الجهاز على الخادم */
export async function setPushSlot(slot: PushSlot): Promise<boolean> {
  try {
    localStorage.setItem(SLOT_KEY, slot)
    const endpoint = localStorage.getItem(KEY)
    if (!endpoint) return false
    const r = await fetch('/api/push/prefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint, slot }) })
    return r.ok
  } catch {
    return false
  }
}
