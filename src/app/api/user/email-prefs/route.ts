// تفعيل الملخص الأسبوعي بالبريد أو إيقافه من «حسابي»
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { emailOptIn?: boolean }
  const user = await db.user.update({ where: { id: userId }, data: { emailOptIn: body.emailOptIn === true }, select: { emailOptIn: true } })
  return NextResponse.json(user)
}
