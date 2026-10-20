// ============================================================================
// /api/auth/google/callback — عودة المستخدم من Google
// 🛡️ يطابق state مع الكوكي (CSRF)، ويقبل البريد المؤكَّد فقط
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createToken, COOKIE_NAME, STATE_COOKIE_NAME, TOKEN_MAX_AGE } from '@/lib/auth'
import { db } from '@/lib/db'
import { createUserWithWelcome } from '@/lib/accounts'
import { requestOrigin } from '@/lib/request-origin'

async function signedInRedirect(url: string, userId: string) {
  const response = NextResponse.redirect(url, { status: 302 })
  response.cookies.set(COOKIE_NAME, await createToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  })
  response.cookies.delete(STATE_COOKIE_NAME)
  return response
}

export async function GET(request: NextRequest) {
  const APP_URL = requestOrigin(request)
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')
  const stateFromUrl = request.nextUrl.searchParams.get('state')

  const cookieStore = await cookies()
  const stateFromCookie = cookieStore.get(STATE_COOKIE_NAME)?.value
  if (!stateFromUrl || !stateFromCookie || stateFromUrl !== stateFromCookie) {
    return NextResponse.redirect(`${APP_URL}/?login=error&reason=state_mismatch`, { status: 302 })
  }
  cookieStore.delete(STATE_COOKIE_NAME)

  if (error || !code) return NextResponse.redirect(`${APP_URL}/?login=cancelled`, { status: 302 })

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${APP_URL}/?login=error&reason=no_config`, { status: 302 })
  }

  try {
    // ١. استبدال الرمز بمفتاح وصول
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    })
    if (!tokenResponse.ok) {
      console.error('Google token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${APP_URL}/?login=error&reason=token_failed`, { status: 302 })
    }
    const tokens = await tokenResponse.json()
    if (!tokens.access_token) return NextResponse.redirect(`${APP_URL}/?login=error`, { status: 302 })

    // ٢. بيانات المستخدم
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!userResponse.ok) return NextResponse.redirect(`${APP_URL}/?login=error`, { status: 302 })
    const info = await userResponse.json()
    const googleId: string | undefined = info.id
    const email = String(info.email || '').toLowerCase()
    const name: string = info.name || email.split('@')[0] || 'مستخدم'
    const picture: string | undefined = info.picture
    if (!googleId || !email) return NextResponse.redirect(`${APP_URL}/?login=error`, { status: 302 })
    if (info.verified_email !== true) {
      return NextResponse.redirect(`${APP_URL}/?login=error&reason=email_not_verified`, { status: 302 })
    }

    // ٣. حساب Google مربوط من قبل
    const linked = await db.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: googleId } },
    })
    if (linked) return signedInRedirect(`${APP_URL}/?login=success`, linked.userId)

    // ٤. مستخدم بالبريد نفسه: يُربط به حساب Google، أو يُنشأ حساب جديد
    const user = (await db.user.findUnique({ where: { email } })) ??
      (await createUserWithWelcome({ email, name, avatar: picture }))
    await db.oAuthAccount.create({
      data: { userId: user.id, provider: 'google', providerAccountId: googleId, email, name, picture },
    })
    return signedInRedirect(`${APP_URL}/?login=success`, user.id)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(`${APP_URL}/?login=error`, { status: 302 })
  }
}
