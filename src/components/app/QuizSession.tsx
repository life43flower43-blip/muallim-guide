"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Clock,
  Brain,
  Lightbulb,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Trophy,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import {
  buildQuiz,
  CONCEPT_MAP,
  QUESTIONS,
  XP_CORRECT,
  XP_RETRY_CORRECT,
  XP_QUIZ_DONE,
} from "@/lib/content";
import type { QuizQuestion } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useNav } from "@/lib/nav";
import { RingProgress, CategoryChip } from "./shared";
import { cn } from "@/lib/utils";

type Phase = "answering" | "results";

function buildQuestions(
  cfg: NonNullable<ReturnType<typeof useNav.getState>["quiz"]>,
  errorKeys: string[]
): QuizQuestion[] {
  if (cfg.mode === "review") {
    return buildQuiz("all", cfg.count, errorKeys);
  }
  if (cfg.mode === "concept" && cfg.conceptId) {
    return QUESTIONS.filter((q) => q.conceptId === cfg.conceptId);
  }
  return buildQuiz(cfg.category, cfg.count);
}

export default function QuizSession() {
  const cfg = useNav((s) => s.quiz);
  const endQuiz = useNav((s) => s.endQuiz);
  const openConcept = useNav((s) => s.openConcept);
  const recordAnswer = useAppStore((s) => s.recordAnswer);
  const recordQuizDone = useAppStore((s) => s.recordQuizDone);
  const errorBox = useAppStore((s) => s.errorBox);

  // built once per mount — AppShell keys this component per quiz config
  const [questions] = useState<QuizQuestion[]>(() =>
    cfg ? buildQuestions(cfg, Object.keys(errorBox)) : []
  );

  const [idx, setIdx] = useState(0);
  const [override, setOverride] = useState<QuizQuestion[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [results, setResults] = useState<{ correctIds: string[]; wrong: QuizQuestion[] }>({
    correctIds: [],
    wrong: [],
  });
  const [phase, setPhase] = useState<Phase>("answering");
  const [seconds, setSeconds] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [showXpFloat, setShowXpFloat] = useState(false);
  const recordedDone = useRef(false);

  useEffect(() => {
    if (phase !== "answering") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  if (!cfg) return null;
  const effectiveQuestions = override ?? questions;
  if (effectiveQuestions.length === 0) return null;

  const q = effectiveQuestions[idx];
  const isCorrect = selected === q.correct;
  const total = effectiveQuestions.length;

  const choose = (i: number) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    const correct = i === q.correct;
    const wasRetry = !!errorBox[q.id] || cfg.mode === "review";
    recordAnswer(q.id, q.conceptId, correct, wasRetry);
    if (correct) {
      const gain = wasRetry ? XP_RETRY_CORRECT : XP_CORRECT;
      setXpGained((x) => x + gain);
      setShowXpFloat(true);
      setTimeout(() => setShowXpFloat(false), 1100);
      setResults((r) => ({ ...r, correctIds: [...r.correctIds, q.id] }));
    } else {
      setResults((r) => ({ ...r, wrong: [...r.wrong, q] }));
    }
  };

  const next = () => {
    if (idx + 1 >= total) {
      setPhase("results");
      if (!recordedDone.current) {
        recordedDone.current = true;
        recordQuizDone(cfg.title ?? "اختبار", results.correctIds.length, total, cfg.mode);
      }
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setLocked(false);
  };

  const retryWrong = () => {
    const ids = results.wrong.map((w) => w.id);
    if (ids.length === 0) return;
    setOverride(buildQuiz("all", ids.length, ids));
    setResults({ correctIds: [], wrong: [] });
    setIdx(0);
    setSelected(null);
    setLocked(false);
    setPhase("answering");
    setSeconds(0);
    setXpGained(0);
    recordedDone.current = false;
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute inset-0 z-[55] bg-background flex flex-col"
    >
        {phase === "answering" ? (
          <>
            {/* top bar */}
            <div className="shrink-0 px-5 pt-4 pb-3 bg-white border-b border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={endQuiz}
                  className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center"
                >
                  <X className="w-4.5 h-4.5 w-4 h-4 text-stone-500" />
                </button>
                <div className="text-center">
                  <p className="text-[12px] font-extrabold text-stone-800">{cfg.title}</p>
                  <p className="text-[9.5px] text-stone-400">
                    السؤال {idx + 1} من {total}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-100 rounded-full px-2.5 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-[11px] font-bold text-stone-600 tabular-nums" dir="ltr">
                    {mm}:{ss}
                  </span>
                </div>
              </div>
              {/* progress */}
              <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-teal-600"
                  animate={{ width: `${((idx + (locked ? 1 : 0)) / total) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* question body */}
            <div className="flex-1 overflow-y-auto nice-scroll px-5 py-4 space-y-4" key={q.id}>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <CategoryChip id={q.category} small />
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((d) => (
                      <span
                        key={d}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          d <= q.difficulty ? "bg-amber-400" : "bg-stone-200"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative">
                  {showXpFloat && (
                    <span className="absolute -top-2 left-2 animate-float-xp text-sm font-extrabold text-emerald-500">
                      +{selected === q.correct ? XP_CORRECT : XP_RETRY_CORRECT} XP
                    </span>
                  )}
                  <p className="text-[15px] font-bold text-stone-800 leading-7">{q.question}</p>
                </div>

                {/* options */}
                <div className="space-y-2.5 pt-1">
                  {q.options.map((opt, i) => {
                    const isSel = selected === i;
                    const isRight = i === q.correct;
                    const state = !locked
                      ? "idle"
                      : isRight
                        ? "right"
                        : isSel
                          ? "wrong"
                          : "dim";
                    return (
                      <motion.button
                        key={i}
                        onClick={() => choose(i)}
                        whileTap={locked ? undefined : { scale: 0.98 }}
                        animate={
                          state === "wrong" ? { x: [0, -6, 5, -3, 2, 0] } : { x: 0 }
                        }
                        transition={{ duration: 0.45 }}
                        className={cn(
                          "w-full text-right rounded-2xl p-4 border-2 flex items-center gap-3 transition-colors",
                          state === "idle" &&
                            "bg-white border-stone-100 hover:border-teal-200 shadow-soft",
                          state === "right" && "bg-emerald-50 border-emerald-400",
                          state === "wrong" && "bg-rose-50 border-rose-400",
                          state === "dim" && "bg-white border-stone-100 opacity-45"
                        )}
                      >
                        <span
                          className={cn(
                            "shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-[12px] font-extrabold",
                            state === "idle" && "bg-stone-100 text-stone-500",
                            state === "right" && "bg-emerald-500 text-white",
                            state === "wrong" && "bg-rose-500 text-white",
                            state === "dim" && "bg-stone-100 text-stone-400"
                          )}
                        >
                          {state === "right" ? (
                            <Check className="w-4 h-4" />
                          ) : state === "wrong" ? (
                            <X className="w-4 h-4" />
                          ) : (
                            ["أ", "ب", "ج", "د"][i]
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-[13px] leading-6",
                            state === "right" && "text-emerald-800 font-bold",
                            state === "wrong" && "text-rose-700 font-bold",
                            state === "idle" && "text-stone-700 font-medium",
                            state === "dim" && "text-stone-500"
                          )}
                        >
                          {opt}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* ===== Guidance panel ===== */}
                <AnimatePresence>
                  {locked && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "rounded-3xl p-4 border",
                        isCorrect ? "bg-emerald-50/70 border-emerald-100" : "bg-white border-amber-200"
                      )}
                    >
                      {isCorrect ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-[13px] font-extrabold text-emerald-700">
                              إجابة صحيحة — أحسنت!
                            </p>
                          </div>
                          <p className="text-[12px] text-stone-600 leading-6">{q.explanation}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
                              <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-[13px] font-extrabold text-amber-600">
                              توجيه بعد الخطأ — دعنا نضبط الفكرة
                            </p>
                          </div>

                          {/* why wrong */}
                          <div className="bg-rose-50 rounded-2xl p-3 mb-3">
                            <p className="text-[11px] font-extrabold text-rose-600 mb-1">
                              لماذا خيارك غير دقيق؟
                            </p>
                            <p className="text-[12px] text-rose-800/90 leading-6">
                              {q.guidance[selected as number] ??
                                "اختيارك يشترك مع خطأ شائع: الخلط بين أثر الإجراء على السلوك واتجاهه. أعد قراءة التعريف تحت ضوء الشرح أدناه."}
                            </p>
                          </div>

                          {/* correct answer */}
                          <div className="bg-emerald-50 rounded-2xl p-3 mb-3">
                            <p className="text-[11px] font-extrabold text-emerald-700 mb-1">
                              الإجابة الصحيحة
                            </p>
                            <p className="text-[12px] text-emerald-900 font-bold leading-6 mb-1">
                              {q.options[q.correct]}
                            </p>
                            <p className="text-[12px] text-stone-600 leading-6">{q.explanation}</p>
                          </div>
                        </>
                      )}

                      {/* concept link */}
                      {q.conceptId && CONCEPT_MAP[q.conceptId] && (
                        <button
                          onClick={() => openConcept(q.conceptId!)}
                          className="w-full mt-1 mb-3 h-11 rounded-2xl bg-teal-700/5 border border-teal-200 text-teal-800 text-[12px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                        >
                          <BookOpen className="w-4 h-4" />
                          افهم المفهوم: {CONCEPT_MAP[q.conceptId].title}
                        </button>
                      )}

                      <button
                        onClick={next}
                        className="w-full h-12 rounded-2xl bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lift active:scale-[0.98] transition-transform"
                      >
                        {idx + 1 >= total ? "عرض النتائج" : "السؤال التالي"}
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        ) : (
          /* ===== RESULTS ===== */
          <ResultsScreen
            total={total}
            correctCount={results.correctIds.length}
            wrong={results.wrong}
            xpGained={xpGained}
            seconds={seconds}
            onRetryWrong={retryWrong}
            onNewSession={() => {
              endQuiz();
              setTimeout(() => useNav.getState().setTab("quiz"), 50);
            }}
            onHome={endQuiz}
            openConcept={openConcept}
          />
        )}
    </motion.div>
  );
}

function ResultsScreen({
  total,
  correctCount,
  wrong,
  xpGained,
  seconds,
  onRetryWrong,
  onNewSession,
  onHome,
  openConcept,
}: {
  total: number;
  correctCount: number;
  wrong: QuizQuestion[];
  xpGained: number;
  seconds: number;
  onRetryWrong: () => void;
  onNewSession: () => void;
  onHome: () => void;
  openConcept: (id: string) => void;
}) {
  const pct = Math.round((correctCount / total) * 100);
  const perfect = correctCount === total;
  const message =
    pct >= 90
      ? "أداء ممتاز — المفاهيم رسخت لديك!"
      : pct >= 70
        ? "أداء جيد جداً — بضعة مراجعات ستحسم الإتقان"
        : pct >= 50
          ? "بداية طيبة — ركز على المفاهيم التي أخطأت فيها"
          : "لا بأس — الخطأ أول خطوات التعلم، راجع المفاهيم ثم أعد المحاولة";
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex-1 overflow-y-auto nice-scroll px-5 py-6 space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col items-center text-center pt-4"
      >
        <RingProgress value={pct} size={140} stroke={12} color={perfect ? "#10b981" : "#0f766e"}>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold text-stone-800">{pct}%</span>
            <span className="text-[10px] text-stone-400">
              {correctCount} من {total}
            </span>
          </div>
        </RingProgress>
        <div className="flex items-center gap-2 mt-4">
          <Trophy className={cn("w-5 h-5", perfect ? "text-amber-500" : "text-stone-400")} />
          <h2 className="text-lg font-extrabold text-stone-900">
            {perfect ? "علامة كاملة!" : "انتهت الجلسة"}
          </h2>
        </div>
        <p className="text-[12px] text-stone-500 leading-relaxed mt-1 max-w-xs">{message}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-2.5"
      >
        {[
          { icon: Check, label: "صحيحة", value: correctCount, color: "#10b981" },
          { icon: X, label: "أخطاء", value: total - correctCount, color: "#f43f5e" },
          { icon: Brain, label: "نقاط XP", value: `+${xpGained + XP_QUIZ_DONE}`, color: "#f59e0b" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-soft py-3.5 flex flex-col items-center gap-1">
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
            <span className="text-base font-extrabold" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="text-[9.5px] text-stone-400 font-medium">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {wrong.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl shadow-soft p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <p className="text-[13px] font-extrabold text-stone-800">مفاهيم تحتاج مراجعة</p>
          </div>
          <div className="space-y-2.5">
            {wrong.map((w) => {
              const c = CONCEPT_MAP[w.conceptId];
              return (
                <button
                  key={w.id}
                  onClick={() => c && openConcept(c.id)}
                  className="w-full text-right bg-stone-50 rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
                >
                  <span className="text-xl">{c?.icon ?? "📘"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-stone-700">{c?.title ?? "مفهوم"}</p>
                    <p className="text-[10px] text-stone-400 line-clamp-1">{w.question}</p>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 shrink-0">راجع</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-2.5 pb-4"
      >
        {wrong.length > 0 && (
          <button
            onClick={onRetryWrong}
            className="w-full h-12 rounded-2xl bg-amber-400 text-stone-900 text-sm font-extrabold flex items-center justify-center gap-2 shadow-lift active:scale-[0.98] transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            أعد الأخطاء فقط ({wrong.length})
          </button>
        )}
        <button
          onClick={onNewSession}
          className="w-full h-12 rounded-2xl bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lift active:scale-[0.98] transition-transform"
        >
          <Brain className="w-4 h-4" />
          جلسة جديدة
        </button>
        <button
          onClick={onHome}
          className="w-full h-12 rounded-2xl bg-white text-stone-600 text-sm font-bold shadow-soft flex items-center justify-center active:scale-[0.98] transition-transform"
        >
          <AlertCircle className="w-4 h-4 text-stone-400" />
          عودة
        </button>
        <p className="text-center text-[10px] text-stone-300 pt-1" dir="ltr">
          {mm}:{ss}
        </p>
      </motion.div>
    </div>
  );
}
