"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sprout,
  Lightbulb,
  School,
  Presentation,
  Dumbbell,
  Rocket,
  BadgeCheck,
  Brain,
  Play,
  Target,
  User,
  ChevronDown,
  ChevronUp,
  CircleCheck,
} from "lucide-react";
import {
  CONCEPTS,
  QUESTIONS,
  conceptById,
  questionById,
} from "@/lib/qbank";
import { buildReviewSet, orderUnseenFirst } from "@/lib/srs";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

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

// ---------- رحلة المعلم: العوالم الستة ----------
interface World {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  hint: string; // وصف وظيفي قصير — لا أرقام (قرار المستخدم: أرقام بلا علاقة تُحذف)
  action: () => void;
}

export default function HomeView({ onGoTab }: { onGoTab: (t: string) => void }) {
  const { name, xp, attempts, sessions, conceptReads, scenarioChoices } =
    useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const openConcept = useUi((s) => s.openConcept);
  const openCourseTab = useUi((s) => s.openCourseTab);
  const startScenarios = useUi((s) => s.startScenarios);

  const handleOpenConcept = (id: string) => {
    openConcept(id);
    onGoTab("concepts");
  };

  const reviewSet = useMemo(() => buildReviewSet(attempts), [attempts]);
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
      id: "base",
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
      hint: "مفاهيم تربوية عامة",
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
      action: () => onGoTab("quiz"),
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

  // ---- الاختبار المكثف: جميع أسئلة البنك — الجديد أولاً ثم ما وُاجه سابقاً ----
  // طلب المستخدم الصريح: الجلسة تشمل جميع الأسئلة المكثفة، لا خمسة.
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

  // آخر مفهوم تفاعل معه المستخدم — لسطر «أكمل من حيث توقفت»
  const lastConceptTitle = useMemo(() => {
    const last = Object.values(attempts).sort((a, b) => b.ts - a.ts)[0];
    if (!last) return undefined;
    const q = questionById(last.qid);
    return q ? conceptById(q.conceptId)?.title : undefined;
  }, [attempts]);

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* ١. شريط الهوية — ممتد بعرض الشاشة بلون كامل بلا حواف ولا إطارات (نموذج المستخدم) */}
      <header className="-mx-4 -mt-3 bg-gradient-to-l from-[#0B2018] to-[#1B4332] px-4 pb-4 pt-[calc(max(env(safe-area-inset-top),6px)+12px)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <School className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-black leading-6 text-white">تربوي</h2>
              <p className="text-[10px] font-bold text-emerald-100/80">مساعد إعداد المعلم</p>
            </div>
          </div>
          {name && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white">
              <User className="h-3.5 w-3.5" /> {name}
            </span>
          )}
        </div>
      </header>

      {/* ٢. بطاقة الاختبار المكثف — جميع الأسئلة، وعند كل خطأ نرشدك إلى مفهومه */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-l from-[#0B2018] to-[#1B4332] p-5 shadow-lg"
        aria-label="الاختبار المكثف"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-white">ابدأ جلسة اليوم</h3>
            <p className="mt-1 text-sm font-bold leading-6 text-gray-100">
              اختبار مكثف يشمل جميع الأسئلة — وعند كل خطأ نعرفك بمفهومه وأمثلته
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Play className="h-6 w-6 text-white" />
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Target className="h-4.5 w-4.5 text-white" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-200">
              {started ? "أكمل من حيث توقفت" : "ابدأ من الأول"}
            </p>
            <p className="truncate text-sm font-black text-white">
              {started
                ? (lastConceptTitle ?? "متابعة الأسئلة")
                : "سنجيب عن الأسئلة كلها واحدة تلو الأخرى"}
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startIntensiveSession}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-base font-black text-amber-950 shadow-md active:bg-amber-300"
        >
          <Play className="h-5 w-5" /> ابدأ الآن
        </motion.button>
      </motion.section>

      {/* ٣. مفهوم اليوم — مختصر مع «اقرأ المزيد» */}
      <DailyTip onOpen={handleOpenConcept} />

      {/* ٥. رحلتك إلى الاحتراف — مسار أفقي بخطوات متصلة والعالم الحالي مبرز */}
      <section>
        <p className="mb-2 flex items-center gap-2 text-sm font-black text-gray-900">
          <BadgeCheck className="h-4 w-4 text-primary" /> رحلتك إلى الاحتراف
        </p>
        <div className="card-soft rounded-3xl border border-border bg-white p-4">
          {/* المسار: العوالم الستة بخطوات متصلة */}
          <div className="flex items-start justify-between gap-0.5">
            {worlds.map((w, i) => {
              const Icon = w.icon;
              const isCurrent = i === currentWorldIdx;
              const isDone = i < currentWorldIdx;
              return (
                <button
                  key={w.id}
                  onClick={w.action}
                  aria-label={w.name}
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex w-[13%] flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      isCurrent
                        ? "text-white ring-4 ring-offset-0"
                        : isDone
                          ? "text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                    style={
                      isCurrent
                        ? { background: w.color, boxShadow: `0 0 0 3px ${w.color}33` }
                        : isDone
                          ? { background: w.color }
                          : undefined
                    }
                  >
                    {isDone ? (
                      <CircleCheck className="h-4.5 w-4.5" />
                    ) : isCurrent ? (
                      <Icon className="h-4.5 w-4.5" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span
                    className={`text-center text-[8.5px] font-black leading-3 ${
                      isCurrent ? "text-gray-900" : "text-muted-foreground"
                    }`}
                  >
                    {w.name}
                  </span>
                </button>
              );
            })}
          </div>
          {/* خط الاتصال بين الخطوات — خلف الأيقونات */}

          {/* بطاقة الخطوة الحالية */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={currentWorld.action}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-muted/50 p-3 text-right"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: currentWorld.color }}
            >
              <CurrentIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-gray-900">{currentWorld.name}</span>
              <span className="mt-0.5 block text-[11px] font-bold leading-4 text-gray-600">
                {currentWorld.hint}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-black text-primary">
              متابعة <ArrowLeft className="h-4 w-4" />
            </span>
          </motion.button>
        </div>
      </section>
    </div>
  );
}
