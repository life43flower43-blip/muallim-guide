// /api/auth/logout-all — الخروج من كل الأجهزة: يبطل كل الجلسات ثم يُبقي هذا الجهاز داخلًا
import { NextResponse } from 'next/server'
import { getCurrentUser, revokeAllSessions, setAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  await revokeAllSessions(userId)
  await setAuthCookie(userId)
  return NextResponse.json({ ok: true })
}
