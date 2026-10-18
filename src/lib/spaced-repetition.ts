// ============================================================================
// spaced-repetition.ts — خوارزمية SM-2 لمراجعة الأخطاء (منقولة من أوريندو)
// ============================================================================
// الإجابة الخاطئة تعيد البطاقة إلى البداية، والصحيحة تباعد موعدها:
// يوم، ثم ستة أيام، ثم الفاصل السابق مضروبًا في معامل السهولة.

export type ReviewRating = 'again' | 'good'

export type ReviewState = {
  easeFactor: number
  interval: number
  repetitions: number
  mistakeCount: number
}

export type ReviewUpdate = ReviewState & { nextReview: Date; lastReview: Date; isCorrect: boolean }

/** يُعدّ الخطأ «مُصلَحًا» بعد إجابتين صحيحتين متباعدتين متتاليتين، فيخرج من القائمة */
export const MASTERED_REPETITIONS = 2
/** بعد الإصلاح يعود مرتين للتثبيت (قرابة ٦ ثم ١٥ يومًا) ثم يُطوى */
export const RETIRED_REPETITIONS = 4

export function computeNextReview(item: ReviewState, rating: ReviewRating, now = new Date()): ReviewUpdate {
  const q = rating === 'good' ? 4 : 1
  let easeFactor = (item.easeFactor || 2.5) + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  if (easeFactor < 1.3) easeFactor = 1.3
  let interval = item.interval || 1
  let repetitions = item.repetitions || 0
  let mistakeCount = item.mistakeCount || 0

  if (q >= 3) {
    interval = repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(interval * easeFactor)
    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
    mistakeCount += 1
  }
  if (interval > 250) interval = 250

  // الخطأ الجديد يُتدرَّب عليه فورًا (أثر الاسترجاع)، والتباعد يبدأ بعد أول إجابة صحيحة
  const nextReview = new Date(now)
  if (q >= 3) nextReview.setDate(nextReview.getDate() + interval)

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    mistakeCount,
    nextReview,
    lastReview: now,
    isCorrect: q >= 3,
  }
}
