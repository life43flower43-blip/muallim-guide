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

// ---------- جدول المواصفات: توزيع الأسئلة على الموضوعات ومستويات الأهداف ----------

/** يوزّع العدد الكلي على الخانات بحسب أوزانها، ويجبر الكسور بطريقة أكبر الباقي فيبقى المجموع صحيحًا */
export function blueprintOf(total: number, topicWeights: number[], levelPcts: number[]): number[][] | null {
  const tw = topicWeights.reduce((a, b) => a + b, 0);
  const lw = levelPcts.reduce((a, b) => a + b, 0);
  if (total <= 0 || tw <= 0 || lw <= 0 || topicWeights.some((w) => w < 0) || levelPcts.some((w) => w < 0)) return null;
  const cells: { r: number; c: number; exact: number; n: number }[] = [];
  topicWeights.forEach((w, r) =>
    levelPcts.forEach((p, c) => {
      const exact = (total * (w / tw) * p) / lw;
      cells.push({ r, c, exact, n: Math.floor(exact) });
    }),
  );
  let left = total - cells.reduce((a, x) => a + x.n, 0);
  for (const x of [...cells].sort((a, b) => b.exact - b.n - (a.exact - a.n))) {
    if (left <= 0) break;
    x.n += 1;
    left -= 1;
  }
  const out = topicWeights.map(() => levelPcts.map(() => 0));
  for (const x of cells) out[x.r][x.c] = x.n;
  return out;
}

// ---------- الدرجة المعيارية ----------

export function meanSd(xs: number[]): { mean: number; sd: number } | null {
  if (xs.length < 2) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length);
  return { mean, sd };
}

/** التوزيع الاعتدالي التراكمي — تقريب أبراموفيتز وستيغن */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z >= 0 ? 1 - p : p;
}

export interface ZResult {
  mean: number;
  sd: number;
  z: number;
  t: number; // الدرجة التائية: ٥٠ + ١٠ × الزائية
  percentile: number; // نسبة من يقل عنه تقريبًا
}

export function zScoreOf(scores: number[], score: number): ZResult | null {
  const ms = meanSd(scores);
  if (!ms || ms.sd === 0) return null;
  const z = (score - ms.mean) / ms.sd;
  return { ...ms, z, t: 50 + 10 * z, percentile: normalCdf(z) };
}

// ---------- تحليل البدائل ----------

export type DistractorVerdict = "key-good" | "key-weak" | "key-neg" | "dead" | "reverse" | "good";

export interface DistractorResult {
  p: number;
  d: number;
  rows: { upper: number; lower: number; verdict: DistractorVerdict }[];
}

export function distractorsOf(correct: number, upper: number[], lower: number[]): DistractorResult | null {
  const nu = upper.reduce((a, b) => a + b, 0);
  const nl = lower.reduce((a, b) => a + b, 0);
  if (nu <= 0 || nl <= 0 || [...upper, ...lower].some((x) => x < 0)) return null;
  const d = upper[correct] / nu - lower[correct] / nl;
  const rows = upper.map((u, i) => {
    const l = lower[i];
    let verdict: DistractorVerdict;
    if (i === correct) verdict = d >= 0.3 ? "key-good" : d >= 0 ? "key-weak" : "key-neg";
    else if (u + l === 0) verdict = "dead";
    else if (u / nu > l / nl) verdict = "reverse";
    else verdict = "good";
    return { upper: u, lower: l, verdict };
  });
  return { p: (upper[correct] + lower[correct]) / (nu + nl), d, rows };
}

// ---------- ثبات الاختبار: معادلة كودر ريتشاردسون ٢١ ----------

export interface ReliabilityResult {
  r: number;
  mean: number;
  variance: number;
  word: string;
  tone: "good" | "fair" | "weak";
  note: string;
}

export function kr21Of(items: number, scores: number[]): ReliabilityResult | null {
  if (items < 2 || scores.length < 3 || scores.some((s) => s < 0 || s > items)) return null;
  const ms = meanSd(scores);
  if (!ms || ms.sd === 0) return null;
  const variance = ms.sd ** 2;
  const r = (items / (items - 1)) * (1 - (ms.mean * (items - ms.mean)) / (items * variance));
  if (r >= 0.8)
    return { r, mean: ms.mean, variance, word: "ثبات مرتفع", tone: "good", note: "نتائج الاختبار متسقة؛ يمكن الاعتماد عليه في قرارات مهمة إذا كان صادقًا في قياس أهدافه." };
  if (r >= 0.7)
    return { r, mean: ms.mean, variance, word: "ثبات جيد", tone: "good", note: "مستوى مناسب لاختبار صفي. زيادة عدد الأسئلة الجيدة ترفعه أكثر." };
  if (r >= 0.5)
    return { r, mean: ms.mean, variance, word: "ثبات مقبول", tone: "fair", note: "مقبول لاختبار قصير، لكن لا تبنِ عليه وحده قرارًا مهمًا. راجع الأسئلة ضعيفة التمييز وأضف أسئلة جيدة." };
  return { r, mean: ms.mean, variance, word: "ثبات ضعيف", tone: "weak", note: "الدرجات تتأثر كثيرًا بالصدفة. ابحث عن الأسئلة الغامضة أو السالبة التمييز، وزد عدد الأسئلة." };
}
