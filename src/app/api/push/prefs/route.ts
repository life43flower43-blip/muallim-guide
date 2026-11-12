// /api/push/prefs — وقت التذكير المفضل لهذا الجهاز: morning | noon | evening
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
const SLOTS = ['morning', 'noon', 'evening']

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const endpoint = typeof body?.endpoint === 'string' && body.endpoint.startsWith('https://') ? body.endpoint : ''
  const slot = SLOTS.includes(body?.slot) ? body.slot : ''
  if (!endpoint || !slot) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const r = await db.pushSubscription.updateMany({ where: { endpoint }, data: { slot } })
  return NextResponse.json({ ok: r.count > 0 })
}
