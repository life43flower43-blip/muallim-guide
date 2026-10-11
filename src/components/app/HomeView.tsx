"use client";

// الرئيسية — قرار المستخدم:
// ١) زر دائري كبير تتدفق منه أمواج دافئة بطيئة ليفهم الطالب أن الضغط عليه يبدأ الاختبار،
//    وتحته «ابدأ الاختبار (عدد لا متناهي من الأسئلة)».
// ٢) القائمة الأفقية للمحاور بعد الزر الدائري مباشرة — بلا عنوان «رحلتك إلى الاحتراف»
//    وبلا بطاقة خطوة مكررة (المستخدم: لماذا تكرر كل شيء!).
// ٣) لا «مفهوم اليوم» في الرئيسية — المفاهيم في المكتبة وتفصيلها في صفحة أخطائي.

import { useMemo } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { CONCEPTS, QUESTIONS, conceptById } from "@/lib/qbank";
import { orderUnseenFirst } from "@/lib/srs";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

// ---------- المحاور: شريط أفقي واحد بلا تكرار ----------
interface World {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export default function HomeView({ onGoTab }: { onGoTab: (t: string) => void }) {
  const { name, xp, attempts, sessions, conceptReads, scenarioChoices } =
    useApp();
  const startQuiz = useUi((s) => s.startQuiz);
  const openCourseTab = useUi((s) => s.openCourseTab);
  const startScenarios = useUi((s) => s.startScenarios);
  const startLab = useUi((s) => s.startLab);

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
      action: () => onGoTab("quiz"),
    },
    {
      id: "face",
      name: "أواجه",
      icon: School,
      color: "#EA580C",
      action: startScenarios,
    },
    {
      id: "train",
      name: "أتدرّب",
      icon: Dumbbell,
      color: "#F59E0B",
      action: startLab, // توحيد الوجهة مع زر «تدريب» في شريط التنقل — المختبر نفسه
    },
    {
      id: "become",
      name: "أصبح معلّمًا",
      icon: Rocket,
      color: "#B45309",
      action: () => onGoTab("account"),
    },
  ];

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

  return (
    <div className="space-y-5 px-4 pb-6">
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

      {/* ٢. زر الاختبار الدائري — حرارة وأمواج بطيئة تتدفق منه، وتحته الدعوة الصريحة */}
      <section className="flex flex-col items-center pb-1 pt-7" aria-label="ابدأ الاختبار">
        <div className="relative flex items-center justify-center">
          {/* توهج الحرارة — يتنفس ببطء حول الزر */}
          <motion.div
            aria-hidden
            className="absolute h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.5),rgba(249,115,22,0.2)_55%,transparent_72%)] blur-xl"
            animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.95, 1.06, 0.95] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* الأمواج البطيئة — ثلاث حلقات تتسع وتتلاشى بالتناوب */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute h-44 w-44 rounded-full border-2 border-amber-400/70"
              animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
              transition={{
                duration: 3.6,
                delay: i * 1.2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
          {/* نواة الزر */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={startIntensiveSession}
            aria-label="ابدأ الاختبار"
            className="relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 shadow-xl shadow-amber-400/50"
          >
            <motion.span
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Play className="h-16 w-16 text-white drop-shadow-md" fill="currentColor" />
            </motion.span>
          </motion.button>
        </div>

        <h3 className="mt-6 text-2xl font-black text-gray-900">ابدأ الاختبار</h3>
        <p className="mt-1 text-sm font-bold text-gray-600">
          (عدد لا متناهي من الأسئلة)
        </p>
      </section>

      {/* ٢.ب مختبر المعلّم — الإضافة الجديدة بارزة في الشاشة الأولى كي لا تبقى مغمورة خلف زر الشريط */}
      <section aria-label="مختبر المعلّم" className="pt-1">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startLab}
          className="relative w-full overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-white p-4 text-right shadow-sm"
        >
          <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black text-amber-950">
            <Sparkles className="h-3 w-3" /> جديد
          </span>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1B4332] text-white">
              <FlaskConical className="h-6 w-6" />
            </span>
            <div className="min-w-0 pr-0.5">
              <h3 className="text-base font-black text-gray-900">مختبر المعلّم</h3>
              <p className="mt-0.5 text-xs font-bold leading-5 text-gray-600">
                مواقف صفّية قراراتها تغيّر الموقف، خريطة كفاءات بأدلة، ومرآة للتأمل — تدرّب كأنك في الصف
              </p>
            </div>
          </div>
        </motion.button>
      </section>

      {/* ٣. القائمة الأفقية للمحاور — بعد الزر الدائري مباشرة، بلا عنوان وبلا تكرار */}
      <section aria-label="المحاور">
        <div className="card-soft rounded-3xl border border-border bg-white p-4">
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
                    ) : (
                      <Icon className={isCurrent ? "h-4.5 w-4.5" : "h-4 w-4"} />
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
        </div>
      </section>
    </div>
  );
}
