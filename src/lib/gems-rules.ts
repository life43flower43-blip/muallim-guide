// قواعد الجواهر — الخادم وحده يحدد المقادير (منقولة من أوريندو ومكيّفة للتدريب التربوي)
export const GEM_RULES = {
  /** جلسة تدريب مكتملة (خمسة أسئلة فأكثر) */
  session_complete: { amount: 5, type: 'award' },
  /** إضافة لجلسة بلا أي خطأ */
  session_perfect: { amount: 5, type: 'award' },
  /** جلسة مراجعة أخطاء مكتملة */
  review_complete: { amount: 10, type: 'award' },
  /** تلميح: حذف خيارين خاطئين */
  hint_basic: { amount: 5, type: 'spend' },
  /** تجميد السلسلة: يحمي يومًا فائتًا */
  streak_freeze: { amount: 20, type: 'spend' },
} as const

export type GemReason = keyof typeof GEM_RULES

export const MIN_SESSION_QUESTIONS = 5
/** سقف الجلسات المكافأة يوميًا — يمنع جمع الجواهر بالتكرار الآلي */
export const DAILY_SESSION_AWARD_LIMIT = 20
export const MAX_STREAK_FREEZES = 2

/** جواهر جلسة واحدة حسب عدد أسئلتها وصحيحها */
export function gemsForSession(kind: 'practice' | 'review', total: number, correct: number): number {
  if (total < MIN_SESSION_QUESTIONS) return 0
  if (kind === 'review') return GEM_RULES.review_complete.amount
  return GEM_RULES.session_complete.amount + (correct === total ? GEM_RULES.session_perfect.amount : 0)
}
