'use client'

// ============================================================================
// الحساب على الواجهة: المستخدم الحالي، الدخول والتسجيل والخروج، والجواهر
// ============================================================================
// الضيف يعمل كاملًا على جهازه (جواهره وأخطاؤه وتقدمه محلية). بعد الدخول
// ينتقل ذلك كله إلى الحساب تلقائيًا، ويصبح الخادم مرجع الجواهر والسلسلة.
// ============================================================================

import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useApp } from './store'
import { migrateLocalMistakesToServer } from './local-mistakes-store'
import { startProgressSync, stopProgressSync } from './progress-sync'
import { GEM_RULES, gemsForSession, type GemReason } from './gems-rules'
import { displayedStreak } from './streak'
import { currentStreak } from './store'

export type AccountUser = {
  id: string
  email: string
  name: string
  avatar: string | null
  xp: number
  streak: number
  streakFreeze: number
  gems: number
  lastActive: string
  createdAt: string
}

export const USER_QUERY_KEY = ['user'] as const

async function fetchUser(): Promise<AccountUser | null> {
  const res = await fetch('/api/user')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.user ?? null
}

/** المستخدم الحالي: null للضيف، undefined أثناء التحميل الأول */
export function useAccount() {
  const q = useQuery({ queryKey: USER_QUERY_KEY, queryFn: fetchUser, staleTime: 60_000, retry: 1 })
  return { user: q.data, isLoading: q.isLoading, isGuest: q.data === null, refetch: q.refetch }
}

/** بعد أي دخول ناجح: نقل جواهر الجهاز وأخطائه ثم مزامنة التقدم */
export async function afterSignIn(queryClient: QueryClient) {
  const localGems = useApp.getState().gems
  if (localGems > 0) {
    try {
      const res = await fetch('/api/user/migrate-gems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localGems }),
      })
      if (res.ok) useApp.setState({ gems: 0 })
    } catch { /* يُعاد في الدخول التالي */ }
  }
  await migrateLocalMistakesToServer()
  await startProgressSync()
  await queryClient.invalidateQueries()
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    return res.ok ? { ok: true } : { ok: false, error: json.error || 'تعذّر الاتصال، حاول مرة أخرى' }
  } catch {
    return { ok: false, error: 'لا يوجد اتصال بالإنترنت' }
  }
}

export const signIn = (email: string, password: string) => postJson('/api/auth/login', { email, password })
export const register = (name: string, email: string, password: string) => postJson('/api/auth/register', { name, email, password })

export async function signOut(queryClient: QueryClient) {
  stopProgressSync()
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  queryClient.setQueryData(USER_QUERY_KEY, null)
  await queryClient.invalidateQueries()
}

export async function deleteAccount(queryClient: QueryClient): Promise<boolean> {
  stopProgressSync()
  const res = await fetch('/api/user', { method: 'DELETE' }).catch(() => null)
  if (!res?.ok) return false
  queryClient.setQueryData(USER_QUERY_KEY, null)
  await queryClient.invalidateQueries()
  return true
}

// ---------- الجواهر والسلسلة ----------

/** رصيد الجواهر والسلسلة المعروضان: من الحساب للمسجَّل، ومن الجهاز للضيف */
export function useWallet() {
  const { user } = useAccount()
  const localGems = useApp((s) => s.gems)
  const sessions = useApp((s) => s.sessions)
  if (user) {
    const streak = displayedStreak(
      { streak: user.streak, streakFreeze: user.streakFreeze, lastActive: new Date(user.lastActive) },
      new Date(),
      new Date().getTimezoneOffset()
    )
    return { gems: user.gems, streak, streakFreeze: user.streakFreeze, signedIn: true }
  }
  return { gems: localGems, streak: currentStreak(sessions), streakFreeze: 0, signedIn: false }
}

export type SessionAnswer = { qid: string; answer: string }

/**
 * نهاية جلسة: المسجَّل يرسل إجاباته للخادم ليصححها ويمنح الجواهر،
 * والضيف تُحسب جواهره على جهازه بالقاعدة نفسها.
 */
export async function completeSession(
  queryClient: QueryClient,
  kind: 'practice' | 'review',
  sessionId: string,
  answers: SessionAnswer[],
  correct: number
): Promise<number> {
  const user = queryClient.getQueryData<AccountUser | null>(USER_QUERY_KEY)
  if (!user) {
    const gems = gemsForSession(kind, answers.length, correct)
    useApp.getState().addLocalGems(gems)
    return gems
  }
  try {
    const res = await fetch('/api/practice/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, kind, answers, tz: new Date().getTimezoneOffset() }),
    })
    const json = await res.json()
    if (!res.ok) return 0
    queryClient.setQueryData<AccountUser | null>(USER_QUERY_KEY, (u) =>
      u ? { ...u, gems: json.gems, xp: json.xp, streak: json.streak, lastActive: new Date().toISOString() } : u
    )
    return Number(json.gemsAwarded) || 0
  } catch {
    return 0
  }
}

/** صرف جواهر (تلميح أو تجميد سلسلة) — يرجع رسالة خطأ أو null عند النجاح */
export async function spendGems(queryClient: QueryClient, reason: GemReason): Promise<string | null> {
  const rule = GEM_RULES[reason]
  const user = queryClient.getQueryData<AccountUser | null>(USER_QUERY_KEY)
  if (!user) {
    if (reason === 'streak_freeze') return 'سجّل الدخول لتحفظ سلسلتك بالتجميد'
    return useApp.getState().spendLocalGems(rule.amount) ? null : 'رصيد الجواهر لا يكفي'
  }
  try {
    const res = await fetch('/api/user/spend-gems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, idempotencyKey: crypto.randomUUID() }),
    })
    const json = await res.json()
    if (!res.ok) {
      return json.error === 'insufficient_gems'
        ? 'رصيد الجواهر لا يكفي'
        : json.error === 'max_streak_freezes'
          ? 'لديك أقصى عدد من التجميدات'
          : 'تعذّر الصرف، حاول مرة أخرى'
    }
    await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY })
    return null
  } catch {
    return 'لا يوجد اتصال بالإنترنت'
  }
}

export const GEM_REASON_LABELS: Record<string, string> = {
  welcome_bonus: 'هدية الترحيب',
  session_complete: 'جلسة تدريب مكتملة',
  review_complete: 'مراجعة أخطاء مكتملة',
  device_gems: 'جواهر من جهازك',
  hint_basic: 'تلميح',
  streak_freeze: 'تجميد السلسلة',
}
