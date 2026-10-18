// ============================================================================
// streak.ts — قواعد السلسلة اليومية مع التجميد (منقولة من أوريندو)
// ============================================================================
// - يُحتسب اليوم بأول جلسة مكتملة فيه، بتقويم المستخدم نفسه (فرق توقيته).
// - فوات يوم يعيد السلسلة إلى ١ في النشاط التالي، إلا إن كان لديه تجميد:
//   كل تجميد يغطي يومًا فائتًا واحدًا.

const DAY_MS = 24 * 60 * 60 * 1000
export const MAX_TZ_OFFSET_MINUTES = 14 * 60

export function localDayNumber(date: Date, tzOffsetMinutes: number): number {
  return Math.floor((date.getTime() - tzOffsetMinutes * 60_000) / DAY_MS)
}

export type StreakState = { streak: number; streakFreeze: number; lastActive: Date }

export function applyActivity(state: StreakState, now: Date, tzOffsetMinutes: number): StreakState {
  const gap = localDayNumber(now, tzOffsetMinutes) - localDayNumber(state.lastActive, tzOffsetMinutes)
  if (gap <= 0) {
    return { streak: Math.max(state.streak, 1), streakFreeze: state.streakFreeze, lastActive: now }
  }
  const missedDays = gap - 1
  if (state.streak > 0 && missedDays <= state.streakFreeze) {
    return { streak: state.streak + 1, streakFreeze: state.streakFreeze - missedDays, lastActive: now }
  }
  return { streak: 1, streakFreeze: state.streakFreeze, lastActive: now }
}

/** السلسلة المعروضة الآن: صفر إن فاتته أيام أكثر مما يغطيه التجميد */
export function displayedStreak(state: StreakState, now: Date, tzOffsetMinutes: number): number {
  const missedDays = localDayNumber(now, tzOffsetMinutes) - localDayNumber(state.lastActive, tzOffsetMinutes) - 1
  return missedDays > state.streakFreeze ? 0 : state.streak
}

export function clampTzOffset(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(-MAX_TZ_OFFSET_MINUTES, Math.min(MAX_TZ_OFFSET_MINUTES, Math.round(n)))
}
