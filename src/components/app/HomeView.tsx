"use client";

// الرئيسية — شاشة قرار سريع (إعادة توزيع بطلب المستخدم):
// تحية + صف واحد مضغوط لهدف اليوم والسلسلة برقم ← بطاقة «ابدأ الاختبار» مصغّرة
// ← أداتان مميزتان كحد أقصى بشارة «جديد» موحدة تختفي بعد سبعة أيام ← رحلتك إلى الاحتراف
// قواعد التصميم الموحدة: نصف قطر واحد rounded-3xl، ظل واحد shadow-soft، أيقونة واحدة داخل مربع ١١،
// لونان أساسيان (بنفسجي + برتقالي) فقط، أوصاف سطر واحد، بلا رقائق زخرفية، تباين ثانوي على الداكن بنسبة AA.
// قواعد صارمة: صفر أرقام لاتينية ولا لاتيني ولا إيموجي في النصوص، والتنصيص ب«».

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Sprout,
  Presentation,
  School,
  Brain,
  Play,
  User,
  CircleCheck,
  Flame,
  ChevronLeft,
  Route,
  Target,
  ClipboardList,
  Backpack,
  UserRound,
} from "lucide-react";
import { CONCEPTS, QUESTIONS, conceptById } from "@/lib/qbank";
import { orderUnseenFirst } from "@/lib/srs";
import { DAILY_GOAL_XP, useApp, xpToday } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { NewBadge } from "./shared";

// ---------- حركات الدخول المتدرجة ----------
const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const STAGE_WORDS = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة"];

// نص السلسلة بصيغه العربية الصحيحة مع الرقم المشرقي
const streakText = (n: number) => {
  if (n <= 0) return "٠ — ابدأ اليوم";
  if (n === 1) return "يوم واحد متواصل";
  if (n === 2) return "يومان متواصلان";
  if (n <= 10) return `${ad(n)} أيام متواصلة`;
  return `${ad(n)} يومًا متواصلًا`;
};

// محيط حلقة الهدف — هندسة داخلية لا تظهر نصًا
const RING_R = 13;
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
  const { name, xp, attempts, sessions, conceptReads, scenarioChoices } = useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const openCourseTab = useUi((s) => s.openCourseTab);
  const startScenarios = useUi((s) => s.startScenarios);
  const startStudio = useUi((s) => s.startStudio);
  const startField = useUi((s) => s.startField);

  // ---- موضع التقدم على المسار: أول محور لم تُنجز مهامه بعد ----
  const courseOfQid = useMemo(() => {
    const cmap = new Map(CONCEPTS.map((c) => [c.id, c.courseId]));
    return new Map(QUESTIONS.map((q) => [q.conceptId, cmap.get(q.conceptId)]));
  }, []);

  const currentWorldIdx = useMemo(() => {
    const att = Object.keys(attempts);
    const done = [
      att.some((qid) => courseOfQid.get(qid) && courseOfQid.get(qid) !== "G1"),
      Object.keys(conceptReads).some((cid) => conceptById(cid)?.courseId === "G1"),
      att.some((qid) => courseOfQid.get(qid) === "M5"),
      Object.keys(scenarioChoices).length > 0,
      sessions.some((s) => s.mode === "review" || s.mode === "redo"),
      xp >= 300,
    ];
    const i = done.findIndex((d) => !d);
    return i === -1 ? 5 : i;
  }, [attempts, conceptReads, scenarioChoices, sessions, xp, courseOfQid]);

  const worlds: World[] = [
    {
      id: "base",
      name: "الأساس",
      icon: Sprout,
      color: "#4C1D95",
      hint: "ابدأ بأساسيات التربية من دليل المعلم",
      action: () => {
        openCourseTab("M1");
        onGoTab("concepts");
      },
    },
    {
      id: "know",
      name: "أعرف",
      icon: Brain,
      color: "#5B21B6",
      hint: "اتسع معرفتك في الثقافة التربوية العامة",
      action: () => {
        openCourseTab("G1");
        onGoTab("concepts");
      },
    },
    {
      id: "teach",
      name: "أُدرّس",
      icon: Presentation,
      color: "#6D28D9",
      hint: "تدرّب على أسئلة التدريس والمواد",
      action: () => onGoTab("quiz"),
    },
    {
      id: "face",
      name: "أواجه",
      icon: School,
      color: "#7C3AED",
      hint: "واجه مواقف الصف واتخذ قرارك",
      action: startScenarios,
    },
    {
      id: "train",
      name: "أتدرّب",
      icon: ClipboardList,
      color: "#8B5CF6",
      hint: "ادخل مختبر المعلّم وأدوات الممارسة",
      action: () => onGoTab("quiz"),
    },
    {
      id: "become",
      name: "أصبح معلّمًا",
      icon: UserRound,
      color: "#F59E0B",
      hint: "أكمل رحلتك حتى بلوغ الاحتراف",
      action: () => onGoTab("account"),
    },
  ];

  // ---- هدف اليوم وسلسلة المواصلة ----
  const todayXp = useMemo(() => xpToday(sessions), [sessions]);
  const goalPct = Math.min(todayXp / DAILY_GOAL_XP, 1);
  const goalDone = todayXp >= DAILY_GOAL_XP;

  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => dayKey(s.ts)));
    const d = new Date();
    if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
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

  // ---- الاختبار المكثف: جميع أسئلة البنك — الجديد أولًا ----
  const startIntensiveSession = () => {
    startQuiz({
      mode: "intensive",
      label: "الاختبار المكثف — جميع الأسئلة",
      qids: orderUnseenFirst(QUESTIONS.map((q) => q.id), attempts),
    });
  };

  const initial = name.trim().charAt(0);
  const fillPct = (currentWorldIdx / (worlds.length - 1)) * 100;

  return (
    <div className="pb-8">
      {/* ============ الهيرو البنفسجي — تحية وصف حالة واحد مضغوط ============ */}
      <header className="relative overflow-hidden bg-gradient-to-bl from-[#2A1058] via-[#4C1D95] to-[#6D28D9] px-5 pb-16 pt-[calc(max(env(safe-area-inset-top),6px)+14px)]">
        <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-amber-400/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full bg-violet-300/10 blur-3xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <School className="h-5 w-5 text-white" />
              </span>
              <div>
                <h2 className="text-base font-black leading-5 text-white">تربوي</h2>
                <p className="text-[10px] font-bold text-white/85">مساعد إعداد المعلم</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onGoTab("account")}
              aria-label="حسابي"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-2 ring-white/25 backdrop-blur transition hover:bg-white/25"
            >
              {initial ? (
                <span className="text-lg font-black text-white">{initial}</span>
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </motion.button>
          </div>

          {/* التحية */}
          <motion.div initial="hidden" animate="show" variants={stagger} className="mt-6">
            <motion.h1 variants={rise} className="text-[25px] font-black leading-9 text-white">
              {greetLine}
            </motion.h1>
            <motion.p variants={rise} className="mt-1 text-[13px] font-bold leading-6 text-white/85">
              كل جلسة اليوم تصنع صفك غدًا — واصل البناء
            </motion.p>

            {/* صف واحد مضغوط: هدف اليوم + السلسلة برقمها */}
            <motion.div variants={rise} className="mt-4 flex items-stretch gap-2.5">
              <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur">
                <span className="relative flex h-10 w-10 items-center justify-center">
                  <svg viewBox="0 0 32 32" className="h-10 w-10 -rotate-90" aria-hidden>
                    <circle cx="16" cy="16" r={RING_R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3.5" />
                    <circle
                      cx="16"
                      cy="16"
                      r={RING_R}
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.max(goalPct * RING_C, 2)} ${RING_C}`}
                      className="ring-transition"
                    />
                  </svg>
                  <span className="absolute">
                    {goalDone ? (
                      <CircleCheck className="h-4 w-4 text-amber-300" />
                    ) : (
                      <Target className="h-4 w-4 text-amber-300" />
                    )}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-white/85">هدف اليوم</span>
                  <span className="block text-xs font-black text-white">
                    {goalDone ? "اكتمل بامتياز" : "قيد الإنجاز"}
                  </span>
                </span>
              </div>

              <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20">
                  <Flame className={`h-5 w-5 ${streak > 0 ? "text-amber-300" : "text-white/60"}`} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold text-white/85">سلسلة المواصلة</span>
                  <span className="block text-xs font-black text-white">{streakText(streak)}</span>
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ============ المحتوى — تسحب فوق الهيرو ============ */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="relative z-10 -mt-8 space-y-3 px-4"
      >
        {/* ١. بطاقة الاختبار — مصغّرة، صف واحد */}
        <motion.section variants={rise} aria-label="ابدأ الاختبار">
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={startIntensiveSession}
            className="flex w-full items-center gap-3 rounded-3xl border border-border bg-white p-4 text-right shadow-soft"
          >
            <span className="relative flex h-13 w-13 shrink-0 items-center justify-center">
              <motion.span
                aria-hidden
                className="absolute h-13 w-13 rounded-full bg-amber-400/25"
                animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
              />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/30">
                <Play className="h-5.5 w-5.5 text-white" fill="currentColor" />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black text-gray-900">ابدأ الاختبار</span>
              <span className="mt-0.5 block truncate text-[11px] font-bold text-gray-500">
                أسئلة لا تنتهي من كل الدليل — جديدك يظهر أولًا
              </span>
            </span>
            <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
          </motion.button>
        </motion.section>

        {/* ٢. أداتان مميزتان كحد أقصى */}
        <motion.section variants={rise} aria-label="أداتان مميزتان" className="space-y-3">
          <button
            onClick={startStudio}
            className="flex w-full items-center gap-3 rounded-3xl border border-border bg-white p-4 text-right shadow-soft"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-sm">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-black text-gray-900">استوديو خطط الدروس</span>
                <NewBadge tone="violet" />
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-bold text-gray-500">
                اصنع خطة درس موجهة وقيّمها قبل الحصة
              </span>
            </span>
            <ChevronLeft className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={startField}
            className="flex w-full items-center gap-3 rounded-3xl border border-border bg-white p-4 text-right shadow-soft"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
              <Backpack className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-black text-gray-900">سجل التدريب الميداني</span>
                <NewBadge tone="amber" />
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-bold text-gray-500">
                وثّق زياراتك الميدانية وتأملها بعد الحصة
              </span>
            </span>
            <ChevronLeft className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          </button>
        </motion.section>

        {/* ٣. رحلتك إلى الاحتراف */}
        <motion.section
          variants={rise}
          aria-label="رحلتك إلى الاحتراف"
          className="rounded-3xl border border-border bg-white p-5 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent">
                <Route className="h-4.5 w-4.5 text-primary" />
              </span>
              <h3 className="text-sm font-black text-gray-900">رحلتك إلى الاحتراف</h3>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">
              المرحلة {STAGE_WORDS[currentWorldIdx]}
            </span>
          </div>

          <div className="relative mt-5">
            <div aria-hidden className="absolute right-[7%] left-[7%] top-[17px] h-1 rounded-full bg-muted" />
            <div
              aria-hidden
              className="absolute right-[7%] top-[17px] h-1 rounded-full bg-gradient-to-l from-[#4C1D95] to-[#8B5CF6] transition-all duration-700"
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
                        isCurrent ? "text-white" : isDone ? "text-white" : "bg-muted text-muted-foreground"
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

          {/* خطوتك الآن + رابط مختصر إلى لوحة التقدم في حسابي */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
            />
            <p className="flex-1 text-[11px] font-bold leading-5 text-gray-700">
              خطوتك الآن: {worlds[currentWorldIdx].hint}
            </p>
          </div>
          <button
            onClick={() => onGoTab("account")}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-[11px] font-black text-primary transition-colors hover:bg-accent"
          >
            لوحة التقدم التفصيلية في حسابي
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </motion.section>
      </motion.div>
    </div>
  );
}
