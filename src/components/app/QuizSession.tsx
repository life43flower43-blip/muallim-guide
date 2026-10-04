"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Heart,
  HeartCrack,
  ArrowRight,
  RotateCcw,
  Trophy,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Volume2,
  Brain,
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
import { RingProgress } from "./shared";
import { cn } from "@/lib/utils";

type Phase = "answering" | "results" | "gameover";

/* ============ Duolingo palette ============ */
const GREEN = "#58CC02";
const GREEN_DARK = "#58A700";
const GREEN_SHADOW = "#46A302";
const GREEN_SOFT = "#D7FFB8";
const RED = "#FF4B4B";
const RED_DARK = "#EA2B2B";
const RED_SOFT = "#FFDFE0";
const GOLD = "#FFC800";
const GOLD_SHADOW = "#DBA800";
const BLUE = "#1CB0F6";
const BORDER = "#E5E5E5";
const INK = "#3C3C3C";
const BODY = "#4B4B4B";

/* ============ sounds (WebAudio, no files) ============ */
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}
function tone(
  freq: number,
  delay: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.12
) {
  const c = getCtx();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch {
    /* ignore */
  }
}
const playCorrect = () => {
  tone(659.25, 0, 0.14, "triangle", 0.14);
  tone(783.99, 0.12, 0.24, "triangle", 0.14);
};
const playWrong = () => {
  tone(220, 0, 0.18, "sawtooth", 0.05);
  tone(185, 0.13, 0.26, "sawtooth", 0.05);
};
const playFinish = () => {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, i * 0.12, 0.28, "triangle", 0.1)
  );
};

/* ============ TTS (question speaker) ============ */
function speakAr(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.95;
    const ar = synth
      .getVoices()
      .find((v) => v.lang?.toLowerCase().startsWith("ar"));
    if (ar) u.voice = ar;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

/* ============ Arabic-Indic digits ============ */
const arNum = (n: number) => n.toLocaleString("ar-EG");

const GUIDANCE_FALLBACK =
  "اختيارك يشترك مع خطأ شائع: الخلط بين أثر الإجراء على السلوك واتجاهه. أعد قراءة التعريف تحت ضوء الشرح أدناه.";

/* ============ renders «…» terms as green pills ============ */
function QuestionText({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("«") ? (
          <span
            key={i}
            className="inline-block align-baseline bg-[#D7FFB8] text-[#3f8a00] font-extrabold rounded-full px-2.5 py-0.5 mx-0.5 border-b-[3px] border-[#58CC02] leading-7"
          >
            {p.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/* ============ 3D pill button styles ============ */
const optionBase =
  "relative w-full text-right rounded-2xl border-2 p-4 min-h-[54px] flex items-center justify-center gap-2 transition-colors duration-150";

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
  const [hearts, setHearts] = useState(5);
  const [lastGain, setLastGain] = useState(XP_CORRECT);
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
  const twoCol = q.options.every((o) => o.length <= 16);

  const choose = (i: number) => {
    if (locked) return;
    setSelected(i);
    setLocked(true);
    const correct = i === q.correct;
    const wasRetry = !!errorBox[q.id] || cfg.mode === "review";
    recordAnswer(q.id, q.conceptId, correct, wasRetry);
    if (correct) {
      const gain = wasRetry ? XP_RETRY_CORRECT : XP_CORRECT;
      setLastGain(gain);
      setXpGained((x) => x + gain);
      setShowXpFloat(true);
      setTimeout(() => setShowXpFloat(false), 1100);
      playCorrect();
      setResults((r) => ({ ...r, correctIds: [...r.correctIds, q.id] }));
    } else {
      playWrong();
      setHearts((h) => Math.max(0, h - 1));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(160);
      }
      setResults((r) => ({ ...r, wrong: [...r.wrong, q] }));
    }
  };

  const next = () => {
    // hearts depleted mid-quiz → gameover (but if the quiz is already finished, show results)
    if (hearts <= 0 && idx + 1 < total) {
      setPhase("gameover");
      return;
    }
    if (idx + 1 >= total) {
      setPhase("results");
      playFinish();
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

  const restart = () => {
    setOverride(null);
    setIdx(0);
    setSelected(null);
    setLocked(false);
    setHearts(5);
    setResults({ correctIds: [], wrong: [] });
    setPhase("answering");
    setSeconds(0);
    setXpGained(0);
    recordedDone.current = false;
  };

  const retryWrong = () => {
    const ids = results.wrong.map((w) => w.id);
    if (ids.length === 0) return;
    setOverride(buildQuiz("all", ids.length, ids));
    setIdx(0);
    setSelected(null);
    setLocked(false);
    setHearts(5);
    setResults({ correctIds: [], wrong: [] });
    setPhase("answering");
    setSeconds(0);
    setXpGained(0);
    recordedDone.current = false;
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  /* ================= GAME OVER (نفدت القلوب) ================= */
  if (phase === "gameover") {
    return (
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="absolute inset-0 z-[55] bg-white flex flex-col"
      >
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            initial={{ scale: 0.5, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="w-24 h-24 rounded-full bg-[#FFDFE0] flex items-center justify-center"
          >
            <HeartCrack className="w-12 h-12 text-[#FF4B4B]" />
          </motion.div>
          <h2 className="text-2xl font-extrabold text-[#3C3C3C] mt-6">نفدت القلوب!</h2>
          <p className="text-[13px] font-semibold text-[#777] leading-7 mt-2 max-w-xs">
            لا تستسلم — الخطأ أول طريق الإتقان. اقرأ التوجيه جيداً في كل محاولة
            وستلاحظ الفرق، ولن نحاسبك على المحاولات.
          </p>
          <div className="w-full max-w-xs mt-8 space-y-3">
            <button
              onClick={restart}
              className="w-full h-14 rounded-2xl bg-[#58CC02] shadow-[0_4px_0_#46A302] text-white text-base font-extrabold flex items-center justify-center gap-2 active:translate-y-[3px] transition-transform"
            >
              <RotateCcw className="w-5 h-5" />
              أعد المحاولة
            </button>
            <button
              onClick={endQuiz}
              className="w-full h-14 rounded-2xl bg-white border-2 border-[#E5E5E5] shadow-[0_3px_0_#E5E5E5] text-[#4B4B4B] text-base font-extrabold flex items-center justify-center active:translate-y-[3px] transition-transform"
            >
              الخروج
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ================= MAIN ================= */
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute inset-0 z-[55] bg-white flex flex-col"
    >
      {phase === "answering" ? (
        <>
          {/* ===== top bar: back • hearts • progress • close ===== */}
          <div className="shrink-0 bg-white px-4 pt-[max(env(safe-area-inset-top),0.9rem)] pb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={endQuiz}
                aria-label="رجوع"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#AFAFAF] hover:bg-stone-100 active:scale-90 transition"
              >
                <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <div className="flex items-center gap-1 shrink-0" aria-label="القلوب المتبقية">
                <Heart
                  className={cn("w-6 h-6 transition", hearts === 0 && "grayscale")}
                  fill="#FF4B4B"
                  color="#FF4B4B"
                />
                <span className="text-[15px] font-extrabold text-[#FF4B4B] leading-none">
                  {arNum(hearts)}
                </span>
              </div>
              <div
                className="flex-1 h-4 rounded-full bg-[#E5E5E5] overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(((idx + (locked ? 1 : 0)) / total) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.div
                  className="h-full rounded-full bg-[#58CC02]"
                  animate={{ width: `${((idx + (locked ? 1 : 0)) / total) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <button
                onClick={endQuiz}
                aria-label="إغلاق الاختبار"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#AFAFAF] hover:bg-stone-100 active:scale-90 transition"
              >
                <X className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* ===== question body ===== */}
          <div className="flex-1 overflow-y-auto nice-scroll" key={q.id}>
            <motion.div
              initial={{ opacity: 0, x: -22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="px-5 pt-4 pb-6"
            >
              <h1 className="text-center text-[21px] font-extrabold text-[#3C3C3C] mb-5">
                {cfg.title ?? "اختر الإجابة الصحيحة"}
              </h1>

              {/* speech bubble */}
              <div className="relative bg-white border-[3px] border-[#FFC800] rounded-[1.6rem] p-4 mb-7 flex items-start gap-3">
                <button
                  onClick={() => speakAr(q.question)}
                  aria-label="استمع للسؤال"
                  className="shrink-0 w-9 h-9 rounded-full text-[#1CB0F6] flex items-center justify-center hover:bg-[#DDF4FF] active:scale-90 transition"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
                <p className="text-[15px] font-bold text-[#3C3C3C] leading-8 flex-1">
                  <QuestionText text={q.question} />
                </p>
                {showXpFloat && (
                  <span className="absolute -top-5 end-4 animate-float-xp text-[15px] font-extrabold text-[#E6A600] drop-shadow-sm">
                    +{arNum(lastGain)} XP
                  </span>
                )}
              </div>

              {/* options */}
              <div
                className={cn(
                  twoCol ? "grid grid-cols-2 gap-3" : "space-y-3"
                )}
                role="group"
                aria-label="الخيارات"
              >
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
                      disabled={locked}
                      whileTap={locked ? undefined : { y: 3 }}
                      animate={state === "wrong" ? { x: [0, -8, 7, -4, 2, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        optionBase,
                        "px-3 py-3.5 text-center",
                        state === "idle" &&
                          "bg-white border-[#E5E5E5] shadow-[0_4px_0_#E5E5E5] hover:bg-[#F7F7F7] text-[#4B4B4B] cursor-pointer",
                        state === "right" &&
                          "bg-[#D7FFB8] border-[#58CC02] shadow-[0_4px_0_#9fdf3f] text-[#58A700]",
                        state === "wrong" &&
                          "bg-[#FFDFE0] border-[#FF4B4B] shadow-[0_4px_0_#f2a3a3] text-[#EA2B2B]",
                        state === "dim" && "bg-white border-[#E5E5E5] opacity-40 text-[#4B4B4B]"
                      )}
                    >
                      <span className="text-[13.5px] font-bold leading-6">{opt}</span>
                      {state === "right" && (
                        <span className="absolute top-1.5 end-1.5 w-5 h-5 rounded-full bg-[#58CC02] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                        </span>
                      )}
                      {state === "wrong" && (
                        <span className="absolute top-1.5 end-1.5 w-5 h-5 rounded-full bg-[#FF4B4B] flex items-center justify-center">
                          <X className="w-3 h-3 text-white" strokeWidth={3.5} />
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* ===== bottom feedback bar ===== */}
          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ y: 260 }}
                animate={{ y: 0 }}
                exit={{ y: 260 }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                className={cn(
                  "shrink-0 px-4 pt-4 pb-[calc(max(env(safe-area-inset-bottom),0.9rem)+0.4rem)]",
                  isCorrect ? "bg-[#D7FFB8]" : "bg-[#FFDFE0]"
                )}
              >
                {isCorrect ? (
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 shrink-0 rounded-full bg-white flex items-center justify-center">
                      <Check className="w-6 h-6 text-[#58CC02]" strokeWidth={3.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-extrabold text-[#58A700]">أحسنت!</h3>
                        <span className="bg-white rounded-full px-2 py-0.5 text-[11px] font-extrabold text-[#c79100]">
                          +{arNum(lastGain)} XP
                        </span>
                      </div>
                      <p className="text-[12px] font-semibold text-[#4e7d13] leading-6">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-11 h-11 shrink-0 rounded-full bg-white flex items-center justify-center">
                        <X className="w-6 h-6 text-[#FF4B4B]" strokeWidth={3.5} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-[#EA2B2B]">
                          إجابة غير صحيحة!
                        </h3>
                        <p className="text-[11px] font-bold text-[#c95050]">
                          اقرأ التوجيه جيداً قبل المتابعة
                        </p>
                      </div>
                    </div>
                    <div className="max-h-[34vh] overflow-y-auto nice-scroll space-y-2 mb-3">
                      <div className="bg-white/85 rounded-2xl p-3">
                        <p className="text-[11px] font-extrabold text-[#EA2B2B] mb-1 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" />
                          التوجيه بعد الخطأ — لماذا خيارك غير دقيق؟
                        </p>
                        <p className="text-[12px] text-[#7a3030] leading-6">
                          {selected !== null
                            ? (q.guidance[selected] ?? GUIDANCE_FALLBACK)
                            : GUIDANCE_FALLBACK}
                        </p>
                      </div>
                      <div className="bg-white/85 rounded-2xl p-3">
                        <p className="text-[11px] font-extrabold text-[#58A700] mb-0.5">
                          الإجابة الصحيحة
                        </p>
                        <p className="text-[12.5px] font-extrabold text-[#3f8a00] mb-1">
                          {q.options[q.correct]}
                        </p>
                        <p className="text-[12px] text-[#555] leading-6">{q.explanation}</p>
                      </div>
                      {q.conceptId && CONCEPT_MAP[q.conceptId] && (
                        <button
                          onClick={() => openConcept(q.conceptId!)}
                          className="w-full h-11 rounded-2xl bg-white border-2 border-[#E5E5E5] shadow-[0_3px_0_#E5E5E5] text-[#1CB0F6] text-[12px] font-extrabold flex items-center justify-center gap-2 active:translate-y-[2px] transition-transform"
                        >
                          <BookOpen className="w-4 h-4" />
                          افهم المفهوم: {CONCEPT_MAP[q.conceptId].title}
                        </button>
                      )}
                    </div>
                  </>
                )}

                <div className="relative">
                  <button
                    onClick={next}
                    className={cn(
                      "w-full h-14 rounded-2xl text-white text-base font-extrabold flex items-center justify-center active:translate-y-[4px] transition-transform hover:brightness-105",
                      isCorrect
                        ? "bg-[#58CC02] shadow-[0_4px_0_#46A302]"
                        : "bg-[#FF4B4B] shadow-[0_4px_0_#D63838]"
                    )}
                  >
                    {idx + 1 >= total ? "عرض النتائج" : "متابعة"}
                  </button>
                  <span
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white border-2 border-[#E5E5E5] rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-[#4B4B4B] shadow-sm"
                    dir="ltr"
                  >
                    {arNum(idx + 1)} / {arNum(total)}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

/* ================= RESULTS (Duolingo style) ================= */
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
    <div className="flex-1 overflow-y-auto nice-scroll px-5 py-6 space-y-5 bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="flex flex-col items-center text-center pt-4"
      >
        <RingProgress value={pct} size={140} stroke={13} color="#58CC02" track="#E5E5E5">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold text-[#3C3C3C]">{pct}%</span>
            <span className="text-[10px] text-[#999]">
              {arNum(correctCount)} من {arNum(total)}
            </span>
          </div>
        </RingProgress>
        <div className="flex items-center gap-2 mt-4">
          <Trophy className={cn("w-6 h-6", perfect ? "text-[#FFC800]" : "text-[#999]")} />
          <h2 className="text-xl font-extrabold text-[#3C3C3C]">
            {perfect ? "علامة كاملة!" : "انتهت الجلسة"}
          </h2>
        </div>
        <p className="text-[12px] text-[#777] leading-relaxed mt-1 max-w-xs">{message}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-2.5"
      >
        {[
          { icon: Check, label: "صحيحة", value: arNum(correctCount), color: "#58A700" },
          { icon: X, label: "أخطاء", value: arNum(total - correctCount), color: "#FF4B4B" },
          {
            icon: Brain,
            label: "نقاط XP",
            value: `+${arNum(xpGained + XP_QUIZ_DONE)}`,
            color: "#E6A600",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border-2 border-[#E5E5E5] shadow-[0_3px_0_#E5E5E5] py-3.5 flex flex-col items-center gap-1"
          >
            <s.icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={2.5} />
            <span className="text-base font-extrabold" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="text-[9.5px] text-[#999] font-bold">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {wrong.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl border-2 border-[#E5E5E5] shadow-[0_3px_0_#E5E5E5] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#FF4B4B]" />
            <p className="text-[13px] font-extrabold text-[#3C3C3C]">مفاهيم تحتاج مراجعة</p>
          </div>
          <div className="space-y-2.5">
            {wrong.map((w) => {
              const c = CONCEPT_MAP[w.conceptId];
              return (
                <button
                  key={w.id}
                  onClick={() => c && openConcept(c.id)}
                  className="w-full text-right bg-[#F7F7F7] rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
                >
                  <span className="text-xl">{c?.icon ?? "📘"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[#3C3C3C]">
                      {c?.title ?? "مفهوم"}
                    </p>
                    <p className="text-[10px] text-[#999] line-clamp-1">{w.question}</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#1CB0F6] shrink-0">
                    راجع
                  </span>
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
        className="space-y-3 pb-4"
      >
        {wrong.length > 0 && (
          <button
            onClick={onRetryWrong}
            className="w-full h-14 rounded-2xl bg-[#FFC800] shadow-[0_4px_0_#DBA800] text-white text-base font-extrabold flex items-center justify-center gap-2 active:translate-y-[4px] transition-transform hover:brightness-105"
          >
            <RotateCcw className="w-5 h-5" />
            أعد الأخطاء فقط ({arNum(wrong.length)})
          </button>
        )}
        <button
          onClick={onNewSession}
          className="w-full h-14 rounded-2xl bg-[#58CC02] shadow-[0_4px_0_#46A302] text-white text-base font-extrabold flex items-center justify-center gap-2 active:translate-y-[4px] transition-transform hover:brightness-105"
        >
          <Brain className="w-5 h-5" />
          جلسة جديدة
        </button>
        <button
          onClick={onHome}
          className="w-full h-14 rounded-2xl bg-white border-2 border-[#E5E5E5] shadow-[0_3px_0_#E5E5E5] text-[#4B4B4B] text-base font-extrabold flex items-center justify-center active:translate-y-[3px] transition-transform"
        >
          عودة
        </button>
        <p className="text-center text-[10px] text-[#ccc] pt-1" dir="ltr">
          {mm}:{ss}
        </p>
      </motion.div>
    </div>
  );
}
