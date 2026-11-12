// المفتاح العام للإشعارات، مشتق من المفتاح الخاص على الخادم
import { NextResponse } from 'next/server'
import { vapidPublicKey } from '@/lib/push'

export const dynamic = 'force-dynamic'

export function GET() {
  const key = vapidPublicKey()
  return key ? NextResponse.json({ key }) : NextResponse.json({ error: 'push_not_configured' }, { status: 503 })
}
