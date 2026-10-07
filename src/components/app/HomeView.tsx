"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Target,
  ArrowLeft,
  Sprout,
  Lightbulb,
  RotateCcw,
  School,
  Presentation,
  Dumbbell,
  Rocket,
  BadgeCheck,
  Brain,
  Play,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  CONCEPTS,
  QUESTIONS,
  questionsOfCourse,
  shuffle,
  levelFromXp,
  levelTitle,
  conceptById,
} from "@/lib/qbank";
import { buildReviewSet, buildRedoSet, orderUnseenFirst } from "@/lib/srs";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import ShopDialog, { FairyAvatar } from "./ShopDialog";

// ---------- مفهوم اليوم: مختصر بسطرين مع «اقرأ المزيد» ----------
function DailyTip({ onOpen }: { onOpen: (id: string) => void }) {
  const conceptReads = useApp((s) => s.conceptReads);
  const [expanded, setExpanded] = useState(false);
  const tip = useMemo(() => {
    // مفهوم اليوم: مفهوم لم يقرأه المستخدم بعد (ثابت خلال اليوم)
    const read = new Set(Object.keys(conceptReads));
    const unread = CONCEPTS.filter((c) => !read.has(c.id));
    const pool = unread.length > 0 ? unread : CONCEPTS;
    const day = Math.floor(Date.now() / 86400000);
    return pool[day % pool.length];
  }, [conceptReads]);

  return (
    <div className="rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 to-orange-50 p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
          <Lightbulb className="h-4 w-4 text-amber-950" />
        </span>
        <p className="text-sm font-black text-amber-900">مفهوم اليوم</p>
      </div>
      <p className="font-extrabold text-gray-900">{tip.title}</p>
      <p className={`mt-1 text-xs leading-6 text-amber-950/90 ${expanded ? "" : "line-clamp-2"}`}>
        {tip.explanation}
      </p>
      {expanded && (
        <div className="mt-2 rounded-2xl bg-white/70 p-3">
          <p className="text-[11px] font-black text-amber-800">مثال تطبيقي</p>
          <p className="mt-0.5 text-xs leading-6 text-gray-700">{tip.example}</p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 rounded-full bg-amber-400 px-3 py-2 text-[11px] font-black text-amber-950 transition-transform active:scale-[0.98]"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              إظهار أقل <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              اقرأ المزيد <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
        <button
          onClick={() => onOpen(tip.id)}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-black text-amber-900 underline decoration-amber-300 underline-offset-4"
        >
          افتح البطاقة الكاملة <ArrowLeft className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------- رحلة المعلم: العوالم الستة كرقائق ----------
interface World {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  hint: string; // وصف وظيفي قصير — لا أرقام (قرار المستخدم: أرقام بلا علاقة تُحذف)
  planLocked?: boolean; // منشئ خطط الدروس: قيد البناء (بند 9)
  action: () => void;
}

export default function HomeView({ onGoTab }: { onGoTab: (t: string) => void }) {
  const { name, xp, attempts, sessions, conceptReads, scenarioChoices, equipped } =
    useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const openConcept = useUi((s) => s.openConcept);
  const openCourseTab = useUi((s) => s.openCourseTab);
  const startScenarios = useUi((s) => s.startScenarios);
  const [shopOpen, setShopOpen] = useState(false);

  const handleOpenConcept = (id: string) => {
    openConcept(id);
    onGoTab("concepts");
  };

  const reviewSet = useMemo(() => buildReviewSet(attempts), [attempts]);
  const redoSet = useMemo(() => buildRedoSet(attempts), [attempts]);
  const level = levelFromXp(xp);
  const answered = Object.keys(attempts).length;
  const started = answered > 0;

  // ---- موضع التقدم على المسار: أول عالم لم تُنجز مهامه بعد (من المحاولات والجلسات) ----
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
      id: "university",
      name: "الأساس",
      icon: Sprout,
      color: "#2D6A4F",
      hint: "فهم الطالب ونموه — أساس المهنة",
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
      hint: "مكتبة المفاهيم العامة",
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
      hint: "تدريب على طرق التدريس",
      planLocked: true,
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
      hint: "محاكاة مواقف الصف",
      action: startScenarios,
    },
    {
      id: "train",
      name: "أتدرّب",
      icon: Dumbbell,
      color: "#F59E0B",
      hint:
        reviewSet.length > 0
          ? "لديك مراجعات مستحقة الآن"
          : "المراجعة الذكية وأخطاؤك",
      action: () => onGoTab("quiz"),
    },
    {
      id: "become",
      name: "أصبح معلّمًا",
      icon: Rocket,
      color: "#B45309",
      hint: "مرحلتك وإنجازاتك",
      action: () => onGoTab("account"),
    },
  ];
  const currentWorld = worlds[currentWorldIdx];
  const CurrentIcon = currentWorld.icon;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "صباح المعرفة";
    if (h < 17) return "نهار موفق";
    return "مساء الخير";
  })();

  // جلسة اليوم: 5 أسئلة — الجديد أولاً ثم ما وُاجه سابقاً
  const startDailySession = () => {
    startQuiz({
      mode: "quick",
      label: "جلسة اليوم — ١٠ دقائق",
      qids: orderUnseenFirst(
        QUESTIONS.map((q) => q.id),
        attempts
      ).slice(0, 5),
    });
  };

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* ١. الترويسة المدمجة داخل الصفحة — ألوان صريحة عالية التباين (بند 1) */}
      <header className="pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-600">{greeting}</p>
            <h2 className="mt-0.5 truncate text-xl font-black text-gray-900">
              {name || "طالب التربية"}
            </h2>
            <p className="mt-0.5 text-[11px] font-bold text-gray-700">
              {levelTitle(level)}
            </p>
          </div>
          {/* الجنية ترافقك — انقرها لفتح متجر الجواهر */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShopOpen(true)}
            aria-label="الجنية — افتح متجر الجواهر"
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            className="shrink-0"
          >
            <FairyAvatar equipped={equipped} size={52} />
          </motion.button>
        </div>
      </header>

      {/* ٢. بطاقة جلسة اليوم — داكنة عالية التباين (بند 7) */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-l from-[#0B2018] to-[#1B4332] p-5 shadow-lg"
        aria-label="جلسة اليوم"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-white">ابدأ جلسة اليوم</h3>
            <p className="mt-1 text-sm font-bold text-gray-100">١٠ دقائق: ٥ أسئلة + مفهوم + موقف</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Play className="h-6 w-6 text-white" />
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startDailySession}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-base font-black text-amber-950 shadow-md active:bg-amber-300"
        >
          <Play className="h-5 w-5" /> ابدأ الآن
        </motion.button>
      </motion.section>

      {/* ٣. ثلاثة اختصارات بأيقونات Lucide حقيقية — بلا فراغات فارغة (بند 2) */}
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
          className="card-soft flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Zap className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-black text-gray-900">سريع</span>
          <span className="text-[9px] font-bold text-gray-600">١٠ أسئلة</span>
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
          className={`card-soft flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center ${
            reviewSet.length === 0 ? "opacity-60" : ""
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
            <RotateCcw className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-black text-gray-900">مراجعة ذكية</span>
          <span className="text-[9px] font-bold text-gray-600">
            {reviewSet.length > 0 ? "لديك مراجعات مستحقة" : "لا مراجعات الآن"}
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
          className={`card-soft flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center ${
            redoSet.length === 0 ? "opacity-60" : ""
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white">
            <Target className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-black text-gray-900">أخطائي</span>
          <span className="text-[9px] font-bold text-gray-600">
            {redoSet.length > 0 ? "أخطاء تنتظر إصلاحك" : "لا أخطاء بعد"}
          </span>
        </motion.button>
      </div>

      {/* ٤. أكمل من حيث توقفت — العالم الحالي فقط (بند 7) */}
      <section>
        <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-black text-gray-900">
          <BadgeCheck className="h-4 w-4 text-primary" />
          {started ? "أكمل من حيث توقفت" : "ابدأ رحلتك"}
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-black text-white"
            style={{ background: currentWorld.color }}
          >
            أنت هنا: {currentWorld.name}
          </span>
        </p>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={currentWorld.action}
          className="card-soft flex w-full items-center gap-3 rounded-3xl border border-border bg-white p-4 text-right"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: currentWorld.color }}
          >
            <CurrentIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black text-gray-900">{currentWorld.name}</span>
            <span className="mt-0.5 block text-xs font-bold text-gray-600">
              {currentWorld.hint}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-black text-primary">
            متابعة <ArrowLeft className="h-4 w-4" />
          </span>
        </motion.button>
      </section>

      {/* ٥. مفهوم اليوم — مختصر مع «اقرأ المزيد» */}
      <DailyTip onOpen={handleOpenConcept} />

      {/* ٧. رحلتك إلى الاحتراف — رقائق أفقية قابلة للتمرير، والعالم الحالي مبرز (بند 7) */}
      <section>
        <p className="mb-2 flex items-center gap-2 text-sm font-black text-gray-900">
          <BadgeCheck className="h-4 w-4 text-primary" /> رحلتك إلى الاحتراف
        </p>
        <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
          {worlds.map((w, i) => {
            const Icon = w.icon;
            const current = i === currentWorldIdx;
            return (
              <motion.button
                key={w.id}
                whileTap={{ scale: 0.97 }}
                onClick={w.action}
                aria-current={current ? "step" : undefined}
                className={`relative flex w-[152px] shrink-0 snap-start flex-col gap-1.5 rounded-2xl border bg-white p-3 text-right ${
                  current ? "" : "border-border"
                }`}
                style={current ? { borderColor: w.color, boxShadow: `0 0 0 2px ${w.color}` } : undefined}
              >
                <span className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                    style={{ background: w.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </span>
                <span className="text-sm font-black leading-5 text-gray-900">{w.name}</span>
                <span className="text-[10px] font-bold leading-4 text-gray-600">{w.hint}</span>
                {w.planLocked && (
                  <span
                    className="flex cursor-not-allowed items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[9px] font-bold text-gray-500 opacity-70"
                    title="منشئ خطط الدروس قيد البناء — بقية بطاقة أُدرّس جاهزة"
                  >
                    <Lock className="h-3 w-3" /> منشئ الخطط: قيد البناء
                  </span>
                )}
                {current && (
                  <span
                    className="absolute -top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white"
                    style={{ background: w.color }}
                  >
                    أنت هنا
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      <p className="pt-1 text-center text-[10px] leading-5 text-gray-500">
        تربوي — مساعد إعداد المعلم: من طالب تربية إلى معلم جاهز
      </p>

      <ShopDialog open={shopOpen} onOpenChange={setShopOpen} />
    </div>
  );
}
