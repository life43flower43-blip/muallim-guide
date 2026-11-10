// /api/report — بلاغ «خطأ في السؤال»: يصل إلى صاحب الموقع في صفحة /connect
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { serverQuestions } from '@/lib/server-bank'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  const rl = checkRateLimit(`report:${ip}`, RATE_LIMITS.REPORT)
  if (!rl.allowed) return rateLimitResponse(rl)
  const body = await request.json().catch(() => null)
  const qid = typeof body?.qid === 'string' ? body.qid.slice(0, 60) : ''
  if (!qid || !(await serverQuestions()).has(qid)) return NextResponse.json({ error: 'invalid_question' }, { status: 400 })
  const userId = await getCurrentUser()
  const reporter = userId ?? `ip:${createHash('sha256').update(`turbawy-report:${ip}`).digest('hex').slice(0, 32)}`
  await db.questionReport
    .upsert({ where: { questionId_reporter: { questionId: qid, reporter } }, create: { questionId: qid, reporter }, update: {} })
    .catch(() => {})
  return NextResponse.json({ ok: true })
}
