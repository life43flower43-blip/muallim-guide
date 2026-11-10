// /api/client-error — تسجيل أعطال الواجهة عند المستخدمين (بلا بيانات شخصية)، وتظهر لصاحب الموقع في /connect
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : null)

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`cerr:${getClientIP(request)}`, RATE_LIMITS.REPORT)
  if (!rl.allowed) return rateLimitResponse(rl)
  const b = await request.json().catch(() => null)
  const message = clip(b?.message, 500)
  if (!message) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  // المسار فقط، بلا معاملات الرابط (قد تحمل رموزًا خاصة)
  let url: string | null = null
  try { url = b?.url ? new URL(String(b.url)).pathname.slice(0, 200) : null } catch {}
  const version = clip(b?.version, 20)
  const stack = clip(b?.stack, 2000)
  const id = createHash('sha256').update(`${message}|${url}|${version}`).digest('hex').slice(0, 32)
  await db.clientError
    .upsert({
      where: { id },
      create: { id, message, stack, url, version, ua: clip(request.headers.get('user-agent'), 200) },
      update: { count: { increment: 1 }, lastAt: new Date() },
    })
    .catch(() => {})
  return NextResponse.json({ ok: true })
}
