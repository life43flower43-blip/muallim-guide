// ============================================================================
// auth.ts — نظام المصادقة (JWT، والدخول بحساب Google وحده)، منقول من أوريندو
// 🛡️ أمني: JWT_SECRET يجب أن يُضبط كمتغيّر بيئة (>= 32 حرفًا) في الإنتاج
// ============================================================================

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export const COOKIE_NAME = 'turbawy_token'
/** كوكي state قصيرة العمر لتسجيل الدخول بـ Google (حماية CSRF) */
export const STATE_COOKIE_NAME = 'turbawy_oauth_state'
const TOKEN_EXPIRY = '30d'
export const TOKEN_MAX_AGE = 30 * 24 * 60 * 60

declare global {
  var __TURBAWY_FALLBACK_JWT_SECRET: string | undefined
}

const rawSecret = process.env.JWT_SECRET
const isProduction = process.env.NODE_ENV === 'production'

// في الإنتاج بلا JWT_SECRET: سرّ عشوائي مؤقت يتجدد مع كل تشغيل.
// يُخرج المستخدمين عند إعادة التشغيل، لكنه لا يستعمل سرًّا ثابتًا معروفًا يمكن تزوير الجلسات به.
function getJwtSecret(): string {
  if (rawSecret && rawSecret.length >= 32) return rawSecret
  if (isProduction) {
    if (!globalThis.__TURBAWY_FALLBACK_JWT_SECRET) {
      globalThis.__TURBAWY_FALLBACK_JWT_SECRET = Array.from(
        crypto.getRandomValues(new Uint8Array(48)),
        (b) => b.toString(16).padStart(2, '0')
      ).join('')
      console.error('🚨 JWT_SECRET غير مضبوط: يُستعمل سرّ مؤقت. اضبطه في متغيرات البيئة.')
    }
    return globalThis.__TURBAWY_FALLBACK_JWT_SECRET
  }
  return 'turbawy-dev-secret-not-for-production-use-only-32chars'
}

const secretKey = new TextEncoder().encode(getJwtSecret())

export async function createToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secretKey)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return typeof payload.userId === 'string' ? { userId: payload.userId } : null
  } catch {
    return null
  }
}

/** معرّف المستخدم الحالي من كوكي الجلسة، أو null للضيف */
export async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  return payload?.userId || null
}

export async function setAuthCookie(userId: string) {
  const token = await createToken(userId)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/** جواهر الترحيب لكل حساب جديد */
export const WELCOME_GEMS = 50
