// ============================================================================
// rate-limit.ts — تحديد معدل الطلبات في الذاكرة (منقول من أوريندو)
// يكفي لخادم واحد؛ كل نسخة خادم تحتفظ بعدّاداتها.
// ============================================================================

import { NextResponse } from 'next/server'

type RateLimitEntry = { count: number; resetTime: number }
type RateLimitConfig = { limit: number; windowMs: number }
export type RateLimitResult = { allowed: boolean; remaining: number; resetTime: number; limit: number }

const rateLimitMap = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) rateLimitMap.delete(key)
  }
}

export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  cleanup()
  const now = Date.now()
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs
  const key = `${identifier}:${windowStart}`
  const resetTime = windowStart + config.windowMs
  const entry = rateLimitMap.get(key)
  if (!entry) {
    rateLimitMap.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: config.limit - 1, resetTime, limit: config.limit }
  }
  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime, limit: config.limit }
  }
  entry.count += 1
  return { allowed: true, remaining: config.limit - entry.count, resetTime: entry.resetTime, limit: config.limit }
}

export const RATE_LIMITS = {
  /** تسجيل الدخول: 10 محاولات في الدقيقة لكل عنوان (منع التخمين) */
  AUTH_LOGIN: { limit: 10, windowMs: 60_000 },
  /** إنشاء حساب: 5 في الساعة لكل عنوان */
  AUTH_REGISTER: { limit: 5, windowMs: 60 * 60_000 },
  /** حفظ التقدم والجواهر والأخطاء: 60 في الدقيقة لكل مستخدم */
  PROGRESS_SAVE: { limit: 60, windowMs: 60_000 },
} as const

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export function rateLimitResponse(result: RateLimitResult, message = 'طلبات كثيرة. حاول بعد قليل.') {
  const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000))
  return NextResponse.json({ error: message }, { status: 429, headers: { 'Retry-After': String(retryAfter) } })
}
