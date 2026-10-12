// معدة القياس والتقويم — من ميزة «ز» في بحث مشاكل الطلبة:
// صعوبة القياس والإحصاء التربوي (مساق التقويم من الأصعب على الطلبة).
// أربع حاسبات تفاعلية بشرح تربوي لكل نتيجة — الدوال هنا نقية والعرض بأرقام مشرقية في المكوّن.
// قواعد صارمة: النص المعروض بلا حروف لاتينية، التنصيص بعلامات «»، والأرقام عبر ad().

// ---------- قراءة مدخلات المستخدم: يقبل المشرقية والفواصل العربية والإنجليزية ----------

export function parseScores(raw: string): number[] {
  return raw
    .split(/[\s،,؛;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const latin = s
        .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
        .replace(/[٫]/g, ".")
        .replace(/[^\d.\-]/g, "");
      return Number(latin);
    })
    .filter((n) => Number.isFinite(n));
}

export function parseSingle(raw: string): number | null {
  const arr = parseScores(raw);
  return arr.length === 1 ? arr[0] : null;
}

// ---------- الحاسبة الأولى: مؤشرات مركز البيانات ----------

export interface StatsResult {
  count: number;
  mean: number;
  median: number;
  range: number;
  note: string; // قراءة تربوية للنتيجة
}

export function statsOf(scores: number[]): StatsResult | null {
  if (scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const mid = Math.floor(n / 2);
  const median = n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const range = sorted[n - 1] - sorted[0];

  let note: string;
  if (n === 1) {
    note = "درجة واحدة لا تكفي لقراءة نمو أهداف — أدخل درجات مجموعة لتظهر لك الصورة الكاملة.";
  } else if (range === 0) {
    note = "الدرجات متطابقة تمامًا — المقياس لم يميّز بين المتعلمين هذه المرة، وقد تحتاج أسئلة أوسع المدى.";
  } else if (mean > median) {
    note = "الوسط أعلى من الوسيط — درجات مرتفعة قليلة تسحب المتوسط صعودًا، والوسيط أصدق تمثيلًا لأغلب المجموعة هنا.";
  } else if (mean < median) {
    note = "الوسط أدنى من الوسيط — درجات منخفضة قليلة تسحب المتوسط هبوطًا، وانتبه: قد يكون هؤلاء القليل بحاجة إلى دعم عاجل.";
  } else {
    note = "الوسط والوسيط متقاربان — توزيع متوازن تصف درجته الوسطية الوضع بصدق.";
  }
  return { count: n, mean, median, range, note };
}

// ---------- الحاسبة الثانية: صعوبة السؤال ----------

export interface DifficultyResult {
  p: number; // نسبة المجيبين إجابة صحيحة
  word: string;
  tone: "easy" | "mid" | "hard" | "vhard";
  note: string;
}

export function difficultyOf(correct: number, total: number): DifficultyResult | null {
  if (total <= 0 || correct < 0 || correct > total) return null;
  const p = correct / total;
  if (p >= 0.8)
    return {
      p,
      word: "سهل جدًا",
      tone: "easy",
      note: "أغلب المتعلمين أجابوا عنه — يصلح بدايةً مطمئنة للاختبار أو تشخيصًا سريعًا، لكنه لا يكشف الفروق وحده.",
    };
  if (p >= 0.7)
    return {
      p,
      word: "سهل",
      tone: "easy",
      note: "نسبة صحيحة جيدة تدل على فهم واضح للمفهوم — موقعه المناسب أول الاختبار وبين الأسئلة الصعبة.",
    };
  if (p >= 0.3)
    return {
      p,
      word: "متوسط",
      tone: "mid",
      note: "هذه المنطقة الذهبية للسؤال الجيد: يميّز بين من فهم ومن لم يفهم دون أن يحبط أحدًا.",
    };
  if (p >= 0.2)
    return {
      p,
      word: "صعب",
      tone: "hard",
      note: "القليل فقط أجاب عنه — ضعه في آخر الاختبار وراجع تدريس المفهوم قبل إعادة التجربة.",
    };
  return {
    p,
    word: "صعب جدًا",
    tone: "vhard",
    note: "نادرًا من أجاب عنه — راجع صياغته ومشتتاته أولًا: قد يكون السؤال غامضًا لا المفهوم صعبًا.",
  };
}

// ---------- الحاسبة الثالثة: تمييز السؤال ----------

export interface DiscrimResult {
  d: number;
  word: string;
  tone: "great" | "good" | "fair" | "weak" | "neg";
  note: string;
}

export function discriminationOf(
  topTotal: number,
  topCorrect: number,
  bottomTotal: number,
  bottomCorrect: number
): DiscrimResult | null {
  if (topTotal <= 0 || bottomTotal <= 0) return null;
  if (topCorrect < 0 || bottomCorrect < 0 || topCorrect > topTotal || bottomCorrect > bottomTotal)
    return null;
  const d = topCorrect / topTotal - bottomCorrect / bottomTotal;
  if (d >= 0.4)
    return {
      d,
      word: "تمييز ممتاز",
      tone: "great",
      note: "المجموعة العليا تفوقت بفارق واضح — السؤال يلتقط الفهم بدقة ويثبت مكانه في الاختبار.",
    };
  if (d >= 0.3)
    return {
      d,
      word: "تمييز جيد",
      tone: "good",
      note: "فارق صحي بين المجموعتين — السؤال يؤدي عمله ويمكن تحسين صياغته ليصبح ممتازًا.",
    };
  if (d >= 0.2)
    return {
      d,
      word: "تمييز مقبول",
      tone: "fair",
      note: "الفارق موجود لكنه هزيل — راجع المشتتات: غالبًا مشتت واحد شبه واضح يخدع الأقوياء مع الضعاف.",
    };
  if (d >= 0)
    return {
      d,
      word: "تمييز ضعيف",
      tone: "weak",
      note: "المجموعتان متقاربتان — السؤال لا يميّز من يعرف ممن لا يعرف، ويحتاج إعادة صياغة.",
    };
  return {
    d,
    word: "تمييز سالب",
    tone: "neg",
    note: "الضعاف تفوقوا على الأقوياء! هذا مؤشر عطل في السؤال: غموض في الصياغة أو مشتت يجذب المتفهمين — يستبعد أو يُعاد بناؤه.",
  };
}

// ---------- الحاسبة الرابعة: وزن الدرجة ----------

export interface WeightResult {
  pct: number; // وزن السؤال من الدرجة الكلية
  note: string;
}

export function weightOf(score: number, total: number): WeightResult | null {
  if (total <= 0 || score <= 0 || score > total) return null;
  const pct = (score / total) * 100;
  let note: string;
  if (pct >= 25)
    note = "سؤال واحد يزن ربع الدرجة أو أكثر — خطأ فيه يهدم نتيجة متعلم كاملًا، تأكد أن مهارته جوهرية فعلًا لا تفصيلًا هامشيًا.";
  else if (pct >= 10)
    note = "وزن كبير لمفهوم واحد — يبرر ذلك إن كان المفهوم محوريًا في الوحدة، وإلا وزّع الدرجات على مهارات أكثر.";
  else if (pct >= 3)
    note = "وزن متوازن: خطأ واحد لا يسقط المتعلم، والمجموع يغطي مهارات متعددة — هكذا تبني اختبارات عادلة.";
  else
    note = "وزن دقيق جدًا — كثير من الأسئلة الصغيرة يشعر المتعلم بالسحق بالتفاصيل؛ اجمع التفاصيل الصغرى في سؤال واحد موزون.";
  return { pct, note };
}
