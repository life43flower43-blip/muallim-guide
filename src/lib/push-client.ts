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
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) }))
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), tzOffset: new Date().getTimezoneOffset() }),
    })
    if (!res.ok) return false
    localStorage.setItem(KEY, sub.endpoint)
    emit()
    return true
  } catch {
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
