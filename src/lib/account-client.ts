'use client'

// ============================================================================
// الحساب على الواجهة: المستخدم الحالي، الدخول والتسجيل والخروج، والجواهر
// ============================================================================
// الضيف يعمل كاملًا على جهازه (جواهره وأخطاؤه وتقدمه محلية). بعد الدخول
// ينتقل ذلك كله إلى الحساب تلقائيًا، ويصبح الخادم مرجع الجواهر والسلسلة.
// ============================================================================

import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useApp } from './store'
import { migrateLocalMistakesToServer, useLocalMistakesStore } from './local-mistakes-store'
import { flushProgress, startProgressSync, stopProgressSync } from './progress-sync'
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
  emailOptIn?: boolean
  lastActive: string
  createdAt: string
}

export const USER_QUERY_KEY = ['user'] as const

// آخر مستخدم معروف على الجهاز: إن تعثّر الاتصال لحظة فتح التطبيق لا يظهر كأنه خرج
const LAST_USER_KEY = 'turbawy-last-user'
function readLastUser(): AccountUser | undefined {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY)
    return raw ? (JSON.parse(raw) as AccountUser) : undefined
  } catch {
    return undefined
  }
}
function writeLastUser(u: AccountUser | null) {
  try {
    if (u) localStorage.setItem(LAST_USER_KEY, JSON.stringify(u))
    else localStorage.removeItem(LAST_USER_KEY)
  } catch {}
}

async function fetchUser(): Promise<AccountUser | null> {
  const res = await fetch('/api/user', { cache: 'no-store', credentials: 'same-origin' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const user = (json.user ?? null) as AccountUser | null
  writeLastUser(user)
  return user
}

/** المستخدم الحالي: null للضيف، undefined أثناء التحميل الأول */
export function useAccount() {
  const q = useQuery({ queryKey: USER_QUERY_KEY, queryFn: fetchUser, staleTime: 60_000, retry: 3, retryDelay: (n) => Math.min(1000 * 2 ** n, 8000) })
  // تعثّر الشبكة لا يعني الخروج: نعرض آخر مستخدم معروف حتى ينجح الطلب
  const user = q.data !== undefined ? q.data : q.isError || q.isLoading ? readLastUser() : undefined
  return { user, isLoading: q.isLoading && user === undefined, isGuest: q.data === null, refetch: q.refetch }
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

/** عنوان اشتراك الإشعارات لهذا الجهاز، إن وُجد */
async function pushEndpoint(): Promise<string | undefined> {
  try {
    if (!('serviceWorker' in navigator)) return undefined
    const reg = await navigator.serviceWorker.getRegistration()
    return (await reg?.pushManager.getSubscription())?.endpoint
  } catch {
    return undefined
  }
}

/** بعد الخروج: لا يبقى تقدم الحساب على الجهاز (بعد التأكد أنه محفوظ في الحساب) */
function clearLocalAccountData() {
  const st = useApp.getState()
  const keep = { goal: st.goal, onboarded: st.onboarded }
  st.resetAll()
  useApp.setState(keep)
  useLocalMistakesStore.getState().clearAll()
}

export async function signOut(queryClient: QueryClient) {
  const saved = await flushProgress()
  stopProgressSync()
  const endpoint = await pushEndpoint()
  await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint }) }).catch(() => {})
  if (saved) clearLocalAccountData()
  writeLastUser(null)
  queryClient.setQueryData(USER_QUERY_KEY, null)
  await queryClient.invalidateQueries()
}

export async function deleteAccount(queryClient: QueryClient): Promise<boolean> {
  stopProgressSync()
  const res = await fetch('/api/user', { method: 'DELETE' }).catch(() => null)
  if (!res?.ok) return false
  clearLocalAccountData()
  writeLastUser(null)
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
