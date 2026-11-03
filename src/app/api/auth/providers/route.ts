// /api/auth/providers — هل الدخول بحساب Google مفعّل؟ (حتى لا يظهر زر لا يعمل)
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET, email: true })
}
