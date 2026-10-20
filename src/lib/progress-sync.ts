'use client'

// ============================================================================
// مزامنة التقدم بين الأجهزة للمستخدم المسجَّل
// ============================================================================
// الجهاز يبقى مصدر العمل (يعمل دون اتصال)، والحساب يحفظ نسخة منه.
// عند الدخول: تُجلب نسخة الحساب وتُدمج مع الجهاز (لا يضيع شيء من الطرفين)،
// ثم تُرفع النسخة المدموجة. بعدها يُرفع كل تغيير بعد ثوانٍ من هدوئه.
// ============================================================================

import { useApp } from './store'

const SYNC_KEYS = [
  'attempts', 'sessions', 'conceptReads', 'best', 'scenarioChoices', 'notes', 'mindMaps', 'lessonPlans', 'fieldVisits',
  'labAttempts', 'simAttempts', 'challengeStats', 'studentExamples', 'reportedQuestions', 'goal', 'examDate',
  'lastStudy', 'xp', 'onboarded',
] as const
type SyncKey = (typeof SYNC_KEYS)[number]
type AppSnapshot = ReturnType<typeof useApp.getState>
type Progress = Partial<Pick<AppSnapshot, SyncKey>>

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function snapshot(): Progress {
  const st = useApp.getState()
  const out: Record<string, unknown> = {}
  for (const k of SYNC_KEYS) out[k] = st[k]
  return out as Progress
}

function unionBy<T>(a: T[], b: T[], key: (x: T) => string): T[] {
  const m = new Map<string, T>()
  for (const x of b) m.set(key(x), x)
  for (const x of a) m.set(key(x), x) // نسخة الجهاز تغلب عند التساوي
  return [...m.values()]
}

function mergeRecordBy<T>(a: unknown, b: unknown, pick: (x: T, y: T) => T): Record<string, T> {
  const out: Record<string, T> = { ...(isObj(b) ? b : {}) }
  for (const [k, v] of Object.entries(isObj(a) ? a : {})) out[k] = k in out ? pick(v as T, out[k]) : (v as T)
  return out
}

/** دمج نسخة الجهاز (local) مع نسخة الحساب (remote) */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const byTs = <T extends { ts: number }>(x: T, y: T) => ((x?.ts ?? 0) >= (y?.ts ?? 0) ? x : y)
  const max = (x: number, y: number) => Math.max(Number(x) || 0, Number(y) || 0)
  const listsById = (a: unknown, b: unknown) => mergeRecordBy<any[]>(a, b, (x, y) => unionBy(arr(x), arr(y), (n: any) => String(n?.id)))
  return {
    attempts: mergeRecordBy(local.attempts, remote.attempts, byTs),
    sessions: unionBy(arr<any>(local.sessions), arr<any>(remote.sessions), (s) => String(s?.id))
      .sort((x, y) => (y?.ts ?? 0) - (x?.ts ?? 0))
      .slice(0, 100),
    conceptReads: mergeRecordBy(local.conceptReads, remote.conceptReads, max),
    best: mergeRecordBy(local.best, remote.best, max),
    scenarioChoices: mergeRecordBy(local.scenarioChoices, remote.scenarioChoices, byTs),
    notes: listsById(local.notes, remote.notes),
    mindMaps: unionBy(arr<any>(local.mindMaps), arr<any>(remote.mindMaps), (m) => String(m?.id)).sort((x, y) => (y?.ts ?? 0) - (x?.ts ?? 0)),
    studentExamples: listsById(local.studentExamples, remote.studentExamples),
    lessonPlans: unionBy(arr<any>(local.lessonPlans), arr<any>(remote.lessonPlans), (p) => String(p?.id)),
    fieldVisits: unionBy(arr<any>(local.fieldVisits), arr<any>(remote.fieldVisits), (v) => String(v?.id)),
    labAttempts: unionBy(arr<any>(local.labAttempts), arr<any>(remote.labAttempts), (x) => JSON.stringify(x)),
    simAttempts: unionBy(arr<any>(local.simAttempts), arr<any>(remote.simAttempts), (x) => JSON.stringify(x)),
    challengeStats: mergeRecordBy(local.challengeStats, remote.challengeStats, (x: any, y: any) => ((x?.total ?? 0) >= (y?.total ?? 0) ? x : y)),
    reportedQuestions: [...new Set([...arr<string>(local.reportedQuestions), ...arr<string>(remote.reportedQuestions)])],
    goal: local.goal ?? remote.goal ?? null,
    examDate: local.examDate ?? remote.examDate ?? null,
    lastStudy: (local.lastStudy?.ts ?? 0) >= (remote.lastStudy?.ts ?? 0) ? local.lastStudy ?? null : remote.lastStudy ?? null,
    xp: max(local.xp ?? 0, remote.xp ?? 0),
    onboarded: !!(local.onboarded || remote.onboarded),
  } as Progress
}

async function push(data: Progress) {
  await fetch('/api/user/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
}

let unsubscribe: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

/** يبدأ المزامنة لمستخدم مسجَّل: يجلب ويدمج ويرفع، ثم يتابع التغييرات */
export async function startProgressSync() {
  if (unsubscribe) return
  try {
    const res = await fetch('/api/user/progress')
    if (!res.ok) return
    const { data } = (await res.json()) as { data: Progress | null }
    if (data && isObj(data)) useApp.setState(mergeProgress(snapshot(), data) as Partial<AppSnapshot>)
    await push(snapshot())
  } catch {
    return // دون اتصال: نعيد المحاولة في الفتح التالي
  }
  let last = JSON.stringify(snapshot())
  unsubscribe = useApp.subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const now = JSON.stringify(snapshot())
      if (now === last) return
      last = now
      push(JSON.parse(now)).catch(() => {})
    }, 4000)
  })
}

export function stopProgressSync() {
  unsubscribe?.()
  unsubscribe = null
  if (timer) clearTimeout(timer)
  timer = null
}
