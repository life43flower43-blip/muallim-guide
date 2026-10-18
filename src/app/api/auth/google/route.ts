// ============================================================================
// /api/auth/google — يبدأ تسجيل الدخول عبر Google (من الخادم)
// 🛡️ state عشوائي في كوكي قصيرة العمر لمنع CSRF، ويُطابَق عند العودة
// ============================================================================

import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requestOrigin } from '@/lib/request-origin'
import { STATE_COOKIE_NAME } from '@/lib/auth'

const STATE_TTL_SECONDS = 10 * 60

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const origin = requestOrigin(request)
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/?login=error&reason=no_config`, { status: 302 })
  }

  const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')

  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_TTL_SECONDS,
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
