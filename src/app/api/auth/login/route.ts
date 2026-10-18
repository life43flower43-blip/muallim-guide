import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 🛡️ 10 محاولات في الدقيقة لكل عنوان (منع التخمين)
    const rateLimit = checkRateLimit(`login:${getClientIP(request)}`, RATE_LIMITS.AUTH_LOGIN)
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, 'محاولات كثيرة. حاول بعد دقيقة.')

    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 })
    }
    if (typeof email !== 'string' || email.length > 254) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length > 128) {
      return NextResponse.json({ error: 'كلمة مرور غير صالحة' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!user || !user.password || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'البريد أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    await setAuthCookie(user.id)
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'تعذّر تسجيل الدخول' }, { status: 500 })
  }
}
