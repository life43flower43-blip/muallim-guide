'use client'

// ============================================================================
// أخطاء الضيف على جهازه (منقول من أوريندو)
// ============================================================================
// الضيف لا يُكتب له شيء في قاعدة البيانات: أخطاؤه هنا، وتنتقل إلى حسابه
// تلقائيًا بعد تسجيل الدخول. القاعدة نفسها كالخادم: يُصلَح الخطأ بإجابتين
// صحيحتين متتاليتين يفصل بينهما يوم.
// ============================================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LocalMistake = {
  id: string
  questionId: string
  userAnswer?: string
  mistakeCount: number
  lastReview: string
  createdAt: string
  /** إجابات صحيحة متتالية في المراجعة؛ اثنتان تُصلحان الخطأ */
  correctStreak?: number
  /** موعد المراجعة التالية؛ غيابه = مستحق الآن */
  nextReview?: string
}

type MistakesState = {
  mistakes: LocalMistake[]
  addMistake: (questionId: string, userAnswer?: string) => void
  markCorrect: (questionId: string) => void
  clearAll: () => void
}

export const LOCAL_MASTERED_STREAK = 2
const MAX_LOCAL_MISTAKES = 300

export const useLocalMistakesStore = create<MistakesState>()(
  persist(
    (set, get) => ({
      mistakes: [],

      addMistake: (questionId, userAnswer) => {
        const now = new Date().toISOString()
        const existing = get().mistakes.find((m) => m.questionId === questionId)
        if (existing) {
          set({
            mistakes: get().mistakes.map((m) =>
              m.id === existing.id
                ? { ...m, mistakeCount: m.mistakeCount + 1, lastReview: now, userAnswer: userAnswer || m.userAnswer, correctStreak: 0, nextReview: now }
                : m
            ),
          })
          return
        }
        const created: LocalMistake = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          questionId,
          userAnswer,
          mistakeCount: 1,
          lastReview: now,
          createdAt: now,
        }
        set({ mistakes: [created, ...get().mistakes].slice(0, MAX_LOCAL_MISTAKES) })
      },

      markCorrect: (questionId) => {
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        set({
          mistakes: get()
            .mistakes.map((m) =>
              m.questionId === questionId
                ? { ...m, correctStreak: (m.correctStreak ?? 0) + 1, lastReview: now.toISOString(), nextReview: tomorrow.toISOString() }
                : m
            )
            .filter((m) => (m.correctStreak ?? 0) < LOCAL_MASTERED_STREAK),
        })
      },

      clearAll: () => set({ mistakes: [] }),
    }),
    { name: 'turbawy-local-mistakes' }
  )
)

let migrating: Promise<void> | null = null

/** ينقل أخطاء الجهاز إلى الحساب بعد تسجيل الدخول — مرة واحدة في كل وقت */
export function migrateLocalMistakesToServer(): Promise<void> {
  migrating ??= doMigrate().finally(() => {
    migrating = null
  })
  return migrating
}

async function doMigrate() {
  // الخادم يقبل ٦٠ كتابة في الدقيقة لكل مستخدم: نبقى دونها بكثير
  const batch = useLocalMistakesStore.getState().mistakes.slice(0, 40)
  for (const mistake of batch) {
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: mistake.questionId, rating: 'again', userAnswer: mistake.userAnswer, source: 'device' }),
      })
      if (!res.ok && res.status !== 404) return // يبقى الباقي على الجهاز ويُعاد لاحقًا
      useLocalMistakesStore.setState((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== mistake.id) }))
    } catch {
      return
    }
  }
}
