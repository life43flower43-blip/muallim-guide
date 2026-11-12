// ============================================================================
// /api/auth/login — الدخول بالبريد وكلمة المرور
// 🛡️ رسالة خطأ واحدة للبريد غير الموجود وكلمة المرور الخاطئة، وتأخير بسيط ضد التخمين
// ============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimitShared, rateLimitResponse, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { setAuthCookie } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string }
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 120)
  const password = String(body.password ?? '').slice(0, 128)
  // حد للمحاولات لكل عنوان ولكل حساب، ضد تخمين كلمات المرور
  const rIp = await checkRateLimitShared(`login-ip:${getClientIP(request)}`, RATE_LIMITS.AUTH_LOGIN)
  if (!rIp.allowed) return rateLimitResponse(rIp, 'محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.')
  const rEm = await checkRateLimitShared(`login-email:${email}`, RATE_LIMITS.AUTH_EMAIL)
  if (!rEm.allowed) return rateLimitResponse(rEm, 'محاولات كثيرة على هذا الحساب. انتظر ربع ساعة.')
  try {
    const user = email ? await db.user.findUnique({ where: { email } }) : null
    const ok = await verifyPassword(password, user?.password)
    if (!user || !ok) {
      await new Promise((r) => setTimeout(r, 600))
      return NextResponse.json({ error: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 })
    }
    await setAuthCookie(user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('login error:', err)
    return NextResponse.json({ error: 'تعذّر الدخول، حاول مرة أخرى' }, { status: 500 })
  }
}
