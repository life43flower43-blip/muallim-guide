"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  BookOpen,
  Target,
  ArrowLeft,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  School,
  Presentation,
  Dumbbell,
  Rocket,
  BadgeCheck,
} from "lucide-react";
import {
  CONCEPTS,
  QUESTIONS,
  conceptsOfCourse,
  questionsOfCourse,
  shuffle,
  levelFromXp,
  levelTitle,
  xpInLevel,
  LEVEL_XP,
} from "@/lib/qbank";
import { SCENARIOS } from "@/lib/scenarios";
import { buildReviewSet, buildRedoSet } from "@/lib/srs";
import { DAILY_GOAL_XP, useApp, xpToday } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

function DailyTip({ onOpen }: { onOpen: (id: string) => void }) {
  const conceptReads = useApp((s) => s.conceptReads);
  const tip = useMemo(() => {
    // مفهوم اليوم: مفهوم لم يقرأه المستخدم بعد (ثابت خلال اليوم)
    const read = new Set(Object.keys(conceptReads));
    const unread = CONCEPTS.filter((c) => !read.has(c.id));
    const pool = unread.length > 0 ? unread : CONCEPTS;
    const day = Math.floor(Date.now() / 86400000);
    return pool[day % pool.length];
  }, [conceptReads]);

  return (
    <div className="card-soft rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 to-orange-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
          <Lightbulb className="h-4 w-4 text-amber-950" />
        </span>
        <p className="text-sm font-black text-amber-900">مفهوم اليوم</p>
      </div>
      <p className="font-extrabold text-foreground">{tip.title}</p>
      <p className="mt-1 text-xs leading-6 text-amber-950/80">{tip.explanation}</p>
      <button
        onClick={() => onOpen(tip.id)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-400 py-2.5 text-xs font-black text-amber-950 transition-transform active:scale-[0.98]"
      >
        افتح البطاقة الكاملة ودرّب نفسك <ArrowLeft className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------- رحلة المعلم: العوالم الستة ----------
interface World {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  tagline: string;
  chip: string;
  badge?: string;
  hint?: string;
  action: () => void;
}

function WorldRow({ world, index, isLast }: { world: World; index: number; isLast: boolean }) {
  const Icon = world.icon;
  return (
    <div className="flex items-stretch gap-3">
      {/* عمود المسار: رقم العالم وخط الرحلة */}
      <div className="flex flex-col items-center">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-sm"
          style={{ background: world.color }}
        >
          {index + 1}
        </span>
        {!isLast && <span className="w-0.5 flex-1 rounded-full bg-border" />}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={world.action}
        className={`card-soft mb-3 flex flex-1 items-center gap-3 rounded-3xl border border-border bg-white p-4 text-right ${
          isLast ? "" : "mb-3"
        }`}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{ background: world.color }}
        >
          <Icon className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-black">{world.name}</span>
            {world.badge && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                {world.badge}
              </span>
            )}
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black text-primary">
              {world.chip}
            </span>
          </span>
          <span className="mt-1 block text-xs leading-6 text-muted-foreground">{world.tagline}</span>
          {world.hint && (
            <span className="mt-1 block text-[10px] font-bold text-amber-600">{world.hint}</span>
          )}
        </span>
        <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
      </motion.button>
    </div>
  );
}

export default function HomeView({ onGoTab }: { onGoTab: (t: string) => void }) {
  const { name, xp, attempts, sessions } = useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const openConcept = useUi((s) => s.openConcept);
  const openCourseTab = useUi((s) => s.openCourseTab);
  const startScenarios = useUi((s) => s.startScenarios);

  const handleOpenConcept = (id: string) => {
    openConcept(id);
    onGoTab("concepts");
  };

  const reviewSet = useMemo(() => buildReviewSet(attempts), [attempts]);
  const redoSet = useMemo(() => buildRedoSet(attempts), [attempts]);
  const todayXp = useMemo(() => xpToday(sessions), [sessions]);
  const level = levelFromXp(xp);
  const answered = Object.keys(attempts).length;
  const started = answered > 0;

  const accuracy = useMemo(() => {
    const vals = Object.values(attempts);
    if (vals.length === 0) return null;
    return Math.round((vals.filter((a) => a.correct).length / vals.length) * 100);
  }, [attempts]);

  const goalPct = Math.min(100, (todayXp / DAILY_GOAL_XP) * 100);
  const goalDone = todayXp >= DAILY_GOAL_XP;
  const bankPct = Math.round((answered / QUESTIONS.length) * 100);
  const xpToNext = LEVEL_XP - xpInLevel(xp);

  const g1Count = conceptsOfCourse("G1").length;
  const m5Count = questionsOfCourse("M5").length;

  const worlds: World[] = [
    {
      id: "university",
      name: "الجامعة",
      icon: GraduationCap,
      color: "#2D6A4F",
      tagline: "مساقاتك الجامعية: علم النفس التربوي، النمو، التعلم، القياس والتقويم، طرق التدريس",
      chip: `${CONCEPTS.length - g1Count} مفهوماً`,
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
      tagline: "المكتبة التربوية: مفاهيم ونظريات حديثة تقرأها ببطاقات وأمثلة تطبيقية",
      chip: `${g1Count} مفهوماً`,
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
      tagline: "استراتيجيات التدريس وطرقه وتدريب عملي على أسئلتها",
      chip: `${m5Count} سؤالاً`,
      hint: "منشئ خطط الدروس: قريباً",
      action: () =>
        startQuiz({
          mode: "training",
          label: "تدريب أُدرّس: استراتيجيات وطرق التدريس",
          qids: shuffle(questionsOfCourse("M5")).slice(0, 15).map((q) => q.id),
        }),
    },
    {
      id: "face",
      name: "أواجه",
      icon: School,
      color: "#EA580C",
      tagline: "محاكاة الصف: موقف حقيقي وقرار بيدك — فترى نتيجته وتفسيره التربوي",
      chip: `${SCENARIOS.length} مواقف`,
      badge: "جديد",
      action: startScenarios,
    },
    {
      id: "train",
      name: "أتدرّب",
      icon: Dumbbell,
      color: "#F59E0B",
      tagline: "مراجعة ذكية متباعدة وإعادة أخطائك حتى تثبت في ذاكرتك",
      chip: reviewSet.length > 0 ? `${reviewSet.length} سؤال مستحق` : "المراجعة",
      action: () => onGoTab("quiz"),
    },
    {
      id: "become",
      name: "أصبح معلّمًا",
      icon: Rocket,
      color: "#B45309",
      tagline: "مستواك وإنجازاتك ولوحة تقدمك نحو «معلم جاهز»",
      chip: `المستوى ${level}`,
      action: () => onGoTab("account"),
    },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "صباح المعرفة";
    if (h < 17) return "نهار موفق";
    return "مساء الخير";
  })();

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* ١. بطاقة الترحيب: تحية + حلقة الهدف الوحيدة */}
      <div className="card-soft rounded-3xl border border-border bg-gradient-to-l from-[#1B4332] to-[#2D6A4F] p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-emerald-100">{greeting}</p>
            <h2 className="mt-0.5 truncate text-xl font-black">{name || "طالب التربية"}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
                المستوى {level} • {levelTitle(level)}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
                <Zap className="h-3 w-3 text-amber-300" /> {xp} نقطة
              </span>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-emerald-200">
              باقي {xpToNext} نقطة للمستوى {level + 1}
            </p>
          </div>
          <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center">
            <svg width="76" height="76" className="-rotate-90">
              <circle cx="38" cy="38" r="32" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
              <motion.circle
                cx="38"
                cy="38"
                r="32"
                stroke="#FBBF24"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - goalPct / 100) }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-sm font-black leading-none" dir="ltr">
                {todayXp}/{DAILY_GOAL_XP}
              </p>
              <p className="mt-0.5 text-[9px] font-bold text-emerald-100">
                {goalDone ? "أُنجز الهدف" : "هدف اليوم"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ٢. الإجراء الرئيسي فوق الطية */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onGoTab("quiz")}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg"
      >
        <Target className="h-5 w-5" /> ابدأ جلسة اليوم
      </motion.button>

      {/* ٣. رحلتك إلى الاحتراف: العوالم الستة */}
      <div className="pt-1">
        <p className="mb-0.5 flex items-center gap-2 text-sm font-black">
          <BadgeCheck className="h-4 w-4 text-primary" /> رحلتك إلى الاحتراف
        </p>
        <p className="mb-3 text-[11px] font-semibold leading-5 text-muted-foreground">
          طالب تربية ← يتعلم ← يُدرّس ← يواجه المواقف ← يتدرّب ميدانياً ← معلم جاهز
        </p>
        {worlds.map((w, i) => (
          <WorldRow key={w.id} world={w} index={i} isLast={i === worlds.length - 1} />
        ))}
      </div>

      {/* ٤. تقدمك: شريطان واضحان منفصلان */}
      <div className="card-soft rounded-3xl border border-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black">تقدمك</p>
          <button onClick={() => onGoTab("account")} className="flex items-center text-xs font-bold text-primary">
            التفاصيل في حسابي <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {started ? (
          <div className="space-y-3.5">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-foreground/70">
                <span>أسئلة واجهتها من البنك</span>
                <span className="text-foreground">
                  {answered} من {QUESTIONS.length}
                </span>
              </div>
              <div className="progress-track h-2.5">
                <div className="progress-fill h-full" style={{ width: `${Math.max(bankPct, 2)}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-foreground/70">
                <span>دقة إجاباتك</span>
                <span className="text-foreground" dir="ltr">
                  {accuracy}%
                </span>
              </div>
              <div className="progress-track h-2.5">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(accuracy ?? 0, 2)}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-muted/50 p-3 text-center text-xs font-semibold leading-6 text-foreground/70">
            لم تبدأ بعد — أجب عن أول جلسة وستظهر هنا نسبة وصولك للبنك ودقة إجاباتك.
          </p>
        )}
      </div>

      {/* ٥. إجراءات سريعة في صف واحد */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() =>
            startQuiz({
              mode: "quick",
              label: "اختبار سريع — 10 أسئلة",
              qids: shuffle(QUESTIONS).slice(0, 10).map((q) => q.id),
            })
          }
          className="card-soft flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F59E0B] text-white">
            <Zap className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-black">سريع — 10 أسئلة</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (reviewSet.length > 0) {
              startQuiz({ mode: "review", label: "مراجعة ذكية متباعدة", qids: reviewSet });
            } else {
              onGoTab("quiz");
            }
          }}
          className={`card-soft flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center ${
            reviewSet.length === 0 ? "opacity-60" : ""
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
            <Brain className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-black">مراجعة ذكية</span>
          <span className="text-[9px] font-bold text-foreground/60">
            {reviewSet.length > 0 ? `${reviewSet.length} سؤال مستحق` : "لا مراجعات الآن"}
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (redoSet.length > 0) {
              startQuiz({ mode: "redo", label: "إعادة الأسئلة الخاطئة", qids: redoSet });
            } else {
              onGoTab("quiz");
            }
          }}
          className={`card-soft flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center ${
            redoSet.length === 0 ? "opacity-60" : ""
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DC2626] text-white">
            <RotateCcw className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-black">إعادة الأخطاء</span>
          <span className="text-[9px] font-bold text-foreground/60">
            {redoSet.length > 0 ? `${redoSet.length} سؤال` : "لا أخطاء بعد"}
          </span>
        </motion.button>
      </div>

      {/* ٦. مفهوم اليوم */}
      <DailyTip onOpen={handleOpenConcept} />

      {/* ٧. مكتبة المفاهيم */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onGoTab("concepts")}
        className="card-soft flex w-full items-center gap-3 rounded-3xl border border-border bg-white p-4 text-right"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2D6A4F] text-white">
          <BookOpen className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-black">مكتبة المفاهيم</span>
          <span className="text-xs font-semibold text-foreground/60">
            {CONCEPTS.length} مفهوماً و{QUESTIONS.length} سؤالاً — الكتاب والمكتبة التربوية
          </span>
        </span>
        <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
      </motion.button>

      <p className="pt-1 text-center text-[10px] leading-5 text-muted-foreground">
        <GraduationCap className="mb-1 inline h-3.5 w-3.5" /> تربوي — مساعد إعداد المعلم: من أول سنة جامعية إلى التدريب العملي والتخرج
      </p>
    </div>
  );
}
