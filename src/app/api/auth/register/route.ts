import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, setAuthCookie } from '@/lib/auth'
import { db } from '@/lib/db'
import { createUserWithWelcome } from '@/lib/accounts'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 🛡️ 5 تسجيلات في الساعة لكل عنوان (منع الحسابات المزعجة)
    const rateLimit = checkRateLimit(`register:${getClientIP(request)}`, RATE_LIMITS.AUTH_REGISTER)
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit, 'محاولات تسجيل كثيرة. حاول بعد ساعة.')

    const { email, password, name } = await request.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 })
    }
    if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'كلمة المرور من 8 أحرف على الأقل' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > 80) {
      return NextResponse.json({ error: 'الاسم غير صالح' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    const existing = await db.user.findUnique({ where: { email: normalized } })
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد مسجّل من قبل' }, { status: 409 })
    }

    const user = await createUserWithWelcome({
      email: normalized,
      name: name.trim(),
      password: await hashPassword(password),
    })

    await setAuthCookie(user.id)
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'تعذّر إنشاء الحساب' }, { status: 500 })
  }
}
