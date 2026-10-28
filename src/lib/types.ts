// أنواع بيانات تطبيق تربوي
export type QType = "mcq" | "tf";
export type Difficulty = "سهل" | "متوسط" | "صعب";

export interface QOption {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  conceptId: string;
  type: QType;
  difficulty: Difficulty;
  question: string;
  options: QOption[];
  correct: string;
  reason: string;
  /** الشرح يشير إلى الخيارات بترتيبها (الأول/الثاني…) — لا يُخلط ترتيبها عند العرض */
  fixedOrder?: boolean;
}

export interface Concept {
  id: string;
  courseId: string;
  chapter: string;
  title: string;
  explanation: string;
  example: string;
  /** قاعدة المفهوم في جملة واحدة — تظهر في «دفتري» */
  rule?: string;
  /** أمثلة واقعية متعددة (٥ لكل مفهوم) — تُولَّد من ميدان المدرسة وتغطي زوايا مختلفة للمفهوم */
  examples?: string[];
}

export interface Course {
  id: string;
  name: string;
}

// ---------- مجتمع الطلاب: أمثلة يضيفها الطلاب من واقع تخصصاتهم ----------
export interface StudentExample {
  id: string;
  text: string;
  specialty: string; // هندسة / طب / إنسانيات / تربية / أخرى
  ts: number;
}

// ---------- تقدم المستخدم ----------
export interface Attempt {
  qid: string;
  correct: boolean;
  answer?: string; // نص إجابة المستخدم — لعرضه في صفحة أخطائي
  ts: number; // وقت المحاولة
  box: number; // صندوق ليتم 1-5 للمراجعة المتباعدة
  conf?: "sure" | "unsure" | "guess"; // ثقة المتعلم بإجابته قبل التحقق
}

export interface SessionRecord {
  id: string;
  mode:
    | "training"
    | "exam"
    | "quick"
    | "review"
    | "redo"
    | "scenarios"
    | "intensive"
    | "challenges"
    | "proficiency" // اختبار الكفاءة الشامل الموقوت — من بحث مشاكل الطلبة
    | "peer" // تحدّي الأقران عبر الرابط
    | "stage" // مِسرح الإلقاء — شرح صوتي موقوت
    | "study" // مدرسة المذاكرة — درس مكتمل
    | "examsim" // محاكي الرخصة والمسابقات — اختبار موقوت بأقسام ومحك
    | "placement" // اختبار تحديد المستوى — تشخيص خفيف بلا توجيه
    | "match" // لعبة المطابقة — مصطلح مقابل شرحه المصغّر
    | "speed"; // سباق السرعة — مؤقت لكل سؤال وكونبو
  label: string;
  total: number;
  correctCount: number;
  xp: number;
  durationSec: number;
  ts: number;
}

export interface Badge {
  id: string;
  title: string;
  desc: string;
}
