// /api/push/ping — يسجل أن صاحب هذا الجهاز درس اليوم، فلا يُذكَّر الليلة
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const day = typeof body?.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.day) ? body.day : null
  if (typeof body?.endpoint !== 'string' || !day) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  await db.pushSubscription.updateMany({ where: { endpoint: body.endpoint }, data: { lastStudyDay: day } })
  return NextResponse.json({ ok: true })
}
