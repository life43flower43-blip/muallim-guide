"use client";

import { motion } from "framer-motion";
import {
  Flame,
  Zap,
  BookOpen,
  Brain,
  FlaskConical,
  ClipboardList,
  ArrowLeft,
  RefreshCcw,
  ChevronLeft,
} from "lucide-react";
import { useAppStore, levelInfo, DAILY_GOAL_XP } from "@/lib/store";
import { useNav } from "@/lib/nav";
import { conceptOfDay, greeting, CONCEPT_MAP, CAT_MAP, todayKey } from "@/lib/content";
import { RingProgress, AppCard, SectionTitle, CategoryChip } from "./shared";

export default function HomeView() {
  const { xp, streakDays, dailyXp, dailyDate, answered, correct, errorBox, exploredConcepts } =
    useAppStore();
  const { setTab, openConcept, startQuiz, openPlan, openReview } = useNav();

  const { level, next, progress } = levelInfo(xp);
  const dailyPct = Math.min(100, Math.round((dailyXp / DAILY_GOAL_XP) * 100));
  const daily = dailyDate === todayKey() ? dailyPct : 0;
  const errorCount = Object.keys(errorBox).length;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
  const cotd = conceptOfDay();

  const quickActions = [
    { id: "concepts", icon: BookOpen, label: "المفاهيم", color: "#0d9488" },
    { id: "quiz", icon: Brain, label: "اختبار سريع", color: "#f59e0b" },
    { id: "practice", icon: FlaskConical, label: "سيناريوهات", color: "#8b5cf6" },
    { id: "plan", icon: ClipboardList, label: "خطة سلوك", color: "#10b981" },
  ] as const;

  const handleQuick = (id: string) => {
    if (id === "plan") openPlan();
    else setTab(id as "concepts" | "quiz" | "practice");
  };

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-[11px] text-stone-400 font-medium mb-0.5">{greeting()}</p>
          <h1 className="text-xl font-extrabold text-stone-900">رفيقك في علوم التربية</h1>
        </div>
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 flex items-center justify-center text-2xl shadow-lift">
            {level.icon}
          </div>
          <span className="absolute -bottom-1.5 -left-1.5 bg-amber-400 text-stone-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow">
            م{levelInfo(xp).levelIndex + 1}
          </span>
        </div>
      </motion.div>

      {/* ===== Stats row ===== */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-3"
      >
        <AppCard className="flex-[1.4] p-4 flex items-center gap-3">
          <RingProgress value={progress} size={58} stroke={6}>
            <span className="text-[10px] font-extrabold text-teal-800">{xp}</span>
          </RingProgress>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-stone-800 truncate">{level.title}</p>
            <p className="text-[10px] text-stone-400">
              {next ? `${next.xp - xp} نقطة للمستوى التالي` : "أعلى مستوى — أحسنت!"}
            </p>
          </div>
        </AppCard>
        <AppCard className="flex-1 p-4 flex flex-col items-center justify-center gap-1.5">
          <span className="flex items-center gap-1 text-orange-500">
            <Flame className="w-4 h-4" />
            <span className="text-lg font-extrabold leading-none">{streakDays}</span>
          </span>
          <span className="text-[10px] text-stone-400 font-medium">سلسلة الأيام</span>
        </AppCard>
      </motion.div>

      {/* ===== Daily goal ===== */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-l from-teal-800 to-teal-600 rounded-3xl p-4 shadow-lift relative overflow-hidden"
      >
        <div className="absolute -left-6 -top-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute left-8 -bottom-10 w-20 h-20 rounded-full bg-white/5" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-white text-[13px] font-bold">هدف اليوم</p>
              <p className="text-teal-100 text-[10px]">
                {dailyXp} / {DAILY_GOAL_XP} نقطة خبرة
              </p>
            </div>
          </div>
          <span className="text-white font-extrabold text-sm">{daily}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden relative z-10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-amber-300 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${daily}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      {/* ===== Error box / smart review ===== */}
      {errorCount > 0 && (
        <AppCard
          className="p-4 flex items-center gap-3 border border-rose-100"
          onClick={() => startQuiz({ category: "all", count: Math.min(10, errorCount), mode: "review", title: "مراجعة أخطائي" })}
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
            <RefreshCcw className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-extrabold text-stone-800">صندوق أخطائك يحتاجك</p>
            <p className="text-[10px] text-stone-400">
              {errorCount} سؤالاً أخطأت فيه — أعد المحاولة وحولها إلى إتقان
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-stone-300" />
        </AppCard>
      )}

      {/* ===== Quick actions ===== */}
      <div>
        <SectionTitle title="ابدأ الآن" />
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleQuick(a.id)}
              className="bg-white rounded-2xl shadow-soft py-3.5 px-1 flex flex-col items-center gap-2"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: a.color + "18" }}
              >
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
              </div>
              <span className="text-[10px] font-bold text-stone-600">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ===== Concept of the day ===== */}
      <div>
        <SectionTitle
          title="مفهوم اليوم"
          action={
            <button
              onClick={() => setTab("concepts")}
              className="text-[11px] font-bold text-teal-700 flex items-center gap-0.5"
            >
              كل المفاهيم
              <ArrowLeft className="w-3 h-3" />
            </button>
          }
        />
        <AppCard
          className="p-4 flex items-center gap-3.5"
          onClick={() => openConcept(cotd.id)}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: CAT_MAP[cotd.category].soft }}
          >
            {cotd.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[14px] font-extrabold text-stone-800">{cotd.title}</p>
              <CategoryChip id={cotd.category} small />
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">{cotd.simple}</p>
          </div>
        </AppCard>
      </div>

      {/* ===== Mini progress ===== */}
      {answered > 0 && (
        <AppCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-extrabold text-stone-800">نبض تعلمك</p>
            <span className="text-[10px] text-stone-400">
              {exploredConcepts.length} مفهوماً مستكشفاً
            </span>
          </div>
          <div className="flex items-center gap-4">
            <RingProgress value={accuracy ?? 0} size={64} stroke={7} color="#10b981">
              <span className="text-[11px] font-extrabold text-stone-700">{accuracy}%</span>
            </RingProgress>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">أسئلة مُجابة</span>
                <span className="font-bold text-stone-700">{answered}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">إجابات صحيحة</span>
                <span className="font-bold text-stone-700">{correct}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">نقاط الخطأ المفتوحة</span>
                <span className="font-bold text-rose-500">{errorCount}</span>
              </div>
            </div>
          </div>
        </AppCard>
      )}
    </div>
  );
}
