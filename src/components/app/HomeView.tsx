"use client";

// الرئيسية — إعادة تصميم عالمية:
// هيرو ترحيبي داكن بتحية حسب الوقت وحلقة هدف اليوم وسلسلة المواصلة (كلها نوعية بلا أرقام)
// ← بطاقة الاختبار الجوهرية بالزر الدائري المتوهج (هوية المستخدم المحفوظة)
// ← بطاقة مختبر المعلّم الرائدة بشارة «جديد»
// ← بطاقة رحلة المحاور الستة بخط تقدم وخطوة تالية ديناميكية
// قواعد صارمة: صفر أرقام ولا لاتيني ولا إيموجي في النصوص المعروضة، والتنصيص ب«»، وبلا تكرار.

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Sprout,
  Presentation,
  School,
  Dumbbell,
  Rocket,
  Brain,
  Play,
  User,
  CircleCheck,
  FlaskConical,
  Sparkles,
  Flame,
  ChevronLeft,
  Route,
  Target,
  ClipboardList,
} from "lucide-react";
import { CONCEPTS, QUESTIONS, conceptById } from "@/lib/qbank";
import { orderUnseenFirst } from "@/lib/srs";
import { DAILY_GOAL_XP, useApp, xpToday } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

// ---------- حركات الدخول المتدرجة ----------
const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// ---------- أدوات محلية ----------
const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// كلمة السلسلة — نوعية كليًا، لا أرقام
const streakWord = (n: number) => {
  if (n <= 0) return "ابدأ سلسلتك";
  if (n < 3) return "سلسلة بدأت";
  if (n < 7) return "مواصلة رائعة";
  if (n < 14) return "أسبوع متواصل";
  return "أسابيع متواصلة";
};

const STAGE_WORDS = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة"];

// محيط حلقة الهدف — هندسة داخلية لا تظهر نصًا
const RING_R = 15.5;
const RING_C = 2 * Math.PI * RING_R;

// ---------- المحاور: رحلة ست مراحل ----------
interface World {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  hint: string;
  action: () => void;
}

export default function HomeView({ onGoTab }: { onGoTab: (t: string) => void }) {
  const { name, xp, attempts, sessions, conceptReads, scenarioChoices } =
    useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const openCourseTab = useUi((s) => s.openCourseTab);
  const startScenarios = useUi((s) => s.startScenarios);
  const startLab = useUi((s) => s.startLab);
  const startStudio = useUi((s) => s.startStudio);

  // ---- موضع التقدم على المسار: أول محور لم تُنجز مهامه بعد (من المحاولات والجلسات) ----
  const courseOfQid = useMemo(() => {
    const cmap = new Map(CONCEPTS.map((c) => [c.id, c.courseId]));
    return new Map(QUESTIONS.map((q) => [q.conceptId, cmap.get(q.conceptId)]));
  }, []);

  const currentWorldIdx = useMemo(() => {
    const att = Object.keys(attempts);
    const done = [
      att.some((qid) => courseOfQid.get(qid) && courseOfQid.get(qid) !== "G1"), // الأساس
      Object.keys(conceptReads).some((cid) => conceptById(cid)?.courseId === "G1"), // أعرف
      att.some((qid) => courseOfQid.get(qid) === "M5"), // أُدرّس
      Object.keys(scenarioChoices).length > 0, // أواجه
      sessions.some((s) => s.mode === "review" || s.mode === "redo"), // أتدرّب
      xp >= 300, // أصبح معلّمًا: بلوغ المستوى الثاني
    ];
    const i = done.findIndex((d) => !d);
    return i === -1 ? 5 : i;
  }, [attempts, conceptReads, scenarioChoices, sessions, xp, courseOfQid]);

  const worlds: World[] = [
    {
      id: "base",
      name: "الأساس",
      icon: Sprout,
      color: "#2D6A4F",
      hint: "ابدأ بأساسيات التربية من المكتبة",
      action: () => {
        openCourseTab("M1");
        onGoTab("concepts");
      },
    },
    {
      id: "know",
      name: "أعرف",
      icon: Brain,
      color: "#7C3AED",
      hint: "اتسع معرفتك في مكتبة التربية العامة",
      action: () => {
        openCourseTab("G1");
        onGoTab("concepts");
      },
    },
    {
      id: "teach",
      name: "أُدرّس",
      icon: Presentation,
      color: "#0E7490",
      hint: "تدرّب على أسئلة التدريس والمواد",
      action: () => onGoTab("quiz"),
    },
    {
      id: "face",
      name: "أواجه",
      icon: School,
      color: "#EA580C",
      hint: "واجه مواقف الصف واتخذ قرارك",
      action: startScenarios,
    },
    {
      id: "train",
      name: "أتدرّب",
      icon: Dumbbell,
      color: "#F59E0B",
      hint: "اصقل مهاراتك في مختبر المعلّم",
      action: startLab, // توحيد الوجهة مع زر «تدريب» في شريط التنقل
    },
    {
      id: "become",
      name: "أصبح معلّمًا",
      icon: Rocket,
      color: "#B45309",
      hint: "أكمل رحلتك حتى بلوغ الاحتراف",
      action: () => onGoTab("account"),
    },
  ];

  // ---- هدف اليوم وسلسلة المواصلة (نوعية بلا أرقام) ----
  const todayXp = useMemo(() => xpToday(sessions), [sessions]);
  const goalPct = Math.min(todayXp / DAILY_GOAL_XP, 1);
  const goalDone = todayXp >= DAILY_GOAL_XP;

  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => dayKey(s.ts)));
    const d = new Date();
    if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1); // يوم لم يُختم بعد — السلسلة تنطلق من الأمس
    let n = 0;
    while (days.has(dayKey(d.getTime()))) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [sessions]);

  // ---- التحية حسب وقت اليوم ----
  const hour = new Date().getHours();
  const greet = hour < 12 ? "صباح الخير" : hour < 17 ? "طاب نهارك" : "مساء الخير";
  const greetLine = name.trim() ? `${greet}، ${name.trim()}` : `${greet} يا معلم المستقبل`;

  // ---- الاختبار المكثف: جميع أسئلة البنك — الجديد أولاً ثم ما وُاجه سابقاً ----
  const startIntensiveSession = () => {
    startQuiz({
      mode: "intensive",
      label: "الاختبار المكثف — جميع الأسئلة",
      qids: orderUnseenFirst(
        QUESTIONS.map((q) => q.id),
        attempts
      ),
    });
  };

  const initial = name.trim().charAt(0);
  const fillPct = (currentWorldIdx / (worlds.length - 1)) * 100;

  return (
    <div className="pb-8">
      {/* ============ الهيرو — تدرج زمردي عميق بتوهجات وهالة نقاط ============ */}
      <header className="relative overflow-hidden bg-gradient-to-bl from-[#0B2018] via-[#1B4332] to-[#2D6A4F] px-5 pb-24 pt-[calc(max(env(safe-area-inset-top),6px)+14px)]">
        {/* توهجات زخرفية */}
        <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-amber-400/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
        {/* هالة نقاط خفيفة */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative">
          {/* الصف العلوي: الهوية والأفاتار */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <School className="h-5.5 w-5.5 text-white" />
              </span>
              <div>
                <h2 className="text-base font-black leading-5 text-white">تربوي</h2>
                <p className="text-[10px] font-bold text-emerald-100/75">مساعد إعداد المعلم</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onGoTab("account")}
              aria-label="حسابي"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-2 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              {initial ? (
                <span className="text-lg font-black text-white">{initial}</span>
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </motion.button>
          </div>

          {/* التحية */}
          <motion.div initial="hidden" animate="show" variants={stagger} className="mt-7">
            <motion.h1 variants={rise} className="text-[26px] font-black leading-9 text-white">
              {greetLine}
            </motion.h1>
            <motion.p variants={rise} className="mt-1.5 text-[13px] font-bold leading-6 text-emerald-100/85">
              كل جلسة اليوم تصنع صفك غدًا — واصل البناء
            </motion.p>

            {/* مؤشرا الحالة: هدف اليوم وسلسلة المواصلة */}
            <motion.div variants={rise} className="mt-5 flex flex-wrap items-stretch gap-2.5">
              {/* حلقة هدف اليوم */}
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2.5 backdrop-blur">
                <span className="relative flex h-11 w-11 items-center justify-center">
                  <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90" aria-hidden>
                    <circle cx="18" cy="18" r={RING_R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r={RING_R}
                      fill="none"
                      stroke={goalDone ? "#34D399" : "#FBBF24"}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.max(goalPct * RING_C, 2)} ${RING_C}`}
                      className="ring-transition"
                    />
                  </svg>
                  <span className="absolute">
                    {goalDone ? (
                      <CircleCheck className="h-4.5 w-4.5 text-emerald-300" />
                    ) : (
                      <Target className="h-4 w-4 text-amber-300" />
                    )}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-emerald-100/70">هدف اليوم</span>
                  <span className={`block text-xs font-black ${goalDone ? "text-emerald-300" : "text-white"}`}>
                    {goalDone ? "اكتمل بامتياز" : "قيد الإنجاز"}
                  </span>
                </span>
              </div>

              {/* شارة السلسلة */}
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2.5 backdrop-blur">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20">
                  <Flame className={`h-5.5 w-5.5 ${streak > 0 ? "text-amber-300" : "text-white/50"}`} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-emerald-100/70">سلسلة المواصلة</span>
                  <span className="block text-xs font-black text-white">{streakWord(streak)}</span>
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ============ البطاقات — تسحب فوق الهيرو ============ */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="relative z-10 -mt-14 space-y-4 px-4"
      >
        {/* ١. بطاقة الاختبار — الزر الدائري الجوهري بهويته المتوهجة */}
        <motion.section
          variants={rise}
          aria-label="ابدأ الاختبار"
          className="rounded-[2rem] border border-border bg-white p-6 pt-7 shadow-lift"
        >
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* توهج الحرارة المتنفس */}
              <motion.div
                aria-hidden
                className="absolute h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.45),rgba(249,115,22,0.18)_55%,transparent_72%)] blur-xl"
                animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.95, 1.06, 0.95] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* الأمواج البطيئة المتتالية */}
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute h-40 w-40 rounded-full border-2 border-amber-400/70"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ duration: 3.6, delay: i * 1.2, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
              {/* نواة الزر */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={startIntensiveSession}
                aria-label="ابدأ الاختبار"
                className="relative flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 shadow-xl shadow-amber-400/50 ring-4 ring-white/60"
              >
                <motion.span
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Play className="h-14 w-14 text-white drop-shadow-md" fill="currentColor" />
                </motion.span>
              </motion.button>
            </div>

            <h3 className="mt-5 text-xl font-black text-gray-900">ابدأ الاختبار</h3>
            <p className="mt-1 text-center text-xs font-bold leading-5 text-gray-600">
              أسئلة لا تنتهي من كل المكتبة — جديدك يظهر أولًا
            </p>
          </div>
        </motion.section>

        {/* ٢. مختبر المعلّم — البطاقة الرائدة */}
        <motion.section variants={rise} aria-label="مختبر المعلّم">
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={startLab}
            className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-bl from-[#0B2018] via-[#14532D] to-[#1B4332] p-5 text-right shadow-lift"
          >
            {/* قارورة زخرفية عملاقة باهتة */}
            <FlaskConical
              aria-hidden
              className="pointer-events-none absolute -bottom-7 -left-5 h-32 w-32 text-white/5"
            />
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
                    <FlaskConical className="h-6 w-6 text-amber-300" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white">مختبر المعلّم</h3>
                    <p className="mt-0.5 text-[11px] font-bold leading-5 text-emerald-100/80">
                      مواقف صفّية قراراتها تغيّر الموقف — تدرّب كأنك في الصف
                    </p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black text-amber-950">
                  <Sparkles className="h-3 w-3" /> جديد
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {["مواقف متفرعة", "خريطة كفاءات", "مرآة المعلّم"].map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black text-emerald-100/90 backdrop-blur"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <ChevronLeft className="h-4.5 w-4.5 text-white" />
                </span>
              </div>
            </div>
          </motion.button>
        </motion.section>

        {/* ٣. استوديو خطط الدروس — أداة المعلم للبناء قبل الحصة */}
        <motion.section variants={rise} aria-label="استوديو خطط الدروس">
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={startStudio}
            className="relative w-full overflow-hidden rounded-[2rem] border border-border bg-white p-5 text-right shadow-lift"
          >
            {/* ورقة زخرفية باهتة */}
            <ClipboardList
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -left-4 h-28 w-28 text-primary/5"
            />
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-teal-200/20 blur-2xl" />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md shadow-teal-600/25">
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-gray-900">استوديو خطط الدروس</h3>
                    <p className="mt-0.5 text-[11px] font-bold leading-5 text-gray-600">
                      اصنع خطة درس بخطوات موجهة وقيّمها قبل أن تصعد المنصة
                    </p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-700">
                  <Sparkles className="h-3 w-3" /> أداة المعلم
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {["قالب موجه", "تقييم الخطة", "خططي"].map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-black text-gray-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                  <ChevronLeft className="h-4.5 w-4.5 text-primary" />
                </span>
              </div>
            </div>
          </motion.button>
        </motion.section>

        {/* ٤. رحلة المحاور — خط تقدم وخطوة تالية */}
        <motion.section
          variants={rise}
          aria-label="رحلتك إلى الاحتراف"
          className="rounded-[2rem] border border-border bg-white p-5 card-soft"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
                <Route className="h-4.5 w-4.5 text-primary" />
              </span>
              <h3 className="text-sm font-black text-gray-900">رحلتك إلى الاحتراف</h3>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">
              المرحلة {STAGE_WORDS[currentWorldIdx]}
            </span>
          </div>

          {/* المسار: خط خلفي + خط تقدم + ست محطات — الخط بين مركزي أول وآخر أيقونة */}
          <div className="relative mt-5">
            <div aria-hidden className="absolute right-[7%] left-[7%] top-[17px] h-1 rounded-full bg-muted" />
            <div
              aria-hidden
              className="absolute right-[7%] top-[17px] h-1 rounded-full bg-gradient-to-l from-[#2D6A4F] to-[#52B788] transition-all duration-700"
              style={{ width: `calc(${fillPct} * 0.86%)` }}
            />
            <div className="relative flex items-start justify-between">
              {worlds.map((w, i) => {
                const Icon = w.icon;
                const isCurrent = i === currentWorldIdx;
                const isDone = i < currentWorldIdx;
                return (
                  <motion.button
                    key={w.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={w.action}
                    aria-label={w.name}
                    aria-current={isCurrent ? "step" : undefined}
                    className="flex w-[14%] flex-col items-center gap-1.5"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                        isCurrent
                          ? "text-white ring-4 ring-offset-0"
                          : isDone
                            ? "text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                      style={
                        isCurrent
                          ? { background: w.color, boxShadow: `0 0 0 4px ${w.color}30` }
                          : isDone
                            ? { background: w.color }
                            : undefined
                      }
                    >
                      {isDone ? (
                        <CircleCheck className="h-5 w-5" />
                      ) : (
                        <Icon className={isCurrent ? "h-5 w-5" : "h-4.5 w-4.5"} />
                      )}
                    </span>
                    <span
                      className={`text-center text-[9px] font-black leading-3 ${
                        isCurrent ? "text-gray-900" : isDone ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {w.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* خطوتك الآن — ديناميكية بلون المحور الحالي */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: worlds[currentWorldIdx].color }}
            />
            <p className="text-[11px] font-bold leading-5 text-gray-700">
              خطوتك الآن: {worlds[currentWorldIdx].hint}
            </p>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
