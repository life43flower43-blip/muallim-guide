"use client";

// سباق السرعة — من نمط الاختبارات الذاتية السريعة (Quizizz/Socrative):
// عشرة أسئلة، عشرون ثانية لكل سؤال، نقاط تتناقص مع مرور الوقت،
// متتالية صحيحة ترفع المضاعف، وتغذية لحظية خاطفة قبل الانتقال.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Zap, Flame, Timer, Trophy, CircleCheck, CircleX, Sparkles } from "lucide-react";
import { OPTION_LETTERS, QUESTIONS, shuffle, questionById } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { NewBadge } from "./shared";

const QS_COUNT = 10;
const PER_Q_SEC = 20;

export default function SpeedRunView() {
  const close = useUi((s) => s.clearSpeed);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);

  const [round, setRound] = useState(0);
  const questions = useMemo(() => shuffle(QUESTIONS).slice(0, QS_COUNT), [round]);

  const [qIndex, setQIndex] = useState(0);
  const [tenths, setTenths] = useState(PER_Q_SEC * 10);
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = questions[qIndex] ? questionById(questions[qIndex].id) : undefined;

  const finishNow = useCallback(
    (finalPoints: number, finalCorrect: number) => {
      setFinished(true);
      finishSession({
        mode: "speed",
        label: "سباق السرعة",
        total: QS_COUNT,
        correctCount: finalCorrect,
        xp: Math.min(80, Math.round(finalPoints / 8)),
        durationSec: 0,
      });
    },
    [finishSession]
  );

  const reveal = useCallback(
    (picked: string | null) => {
      if (!q || revealed) return;
      setChosen(picked);
      setRevealed(true);
      const ok = picked !== null && picked === q.correct;
      recordAttempt(q.id, ok, picked ?? undefined);

      // حساب صريح مسبق — بلا تحديثات متداخلة داخل مُحدِّث الحالة
      const bonus = Math.round((Math.max(0, tenths) / (PER_Q_SEC * 10)) * 10);
      const mult = 1 + Math.min(combo, 5) * 0.1;
      const gained = ok ? Math.round((20 + bonus) * mult) : 0;
      const newPoints = points + gained;
      const newCombo = ok ? combo + 1 : 0;
      const newCorrect = ok ? correctCount + 1 : correctCount;

      setPoints(newPoints);
      setCombo(newCombo);
      if (ok) {
        setBestCombo((b) => Math.max(b, newCombo));
        setCorrectCount(newCorrect);
      }

      // تغذية خاطفة ثم انتقال
      advanceRef.current = setTimeout(() => {
        if (qIndex + 1 >= QS_COUNT) {
          finishNow(newPoints, newCorrect);
        } else {
          setQIndex((i) => i + 1);
          setTenths(PER_Q_SEC * 10);
          setChosen(null);
          setRevealed(false);
        }
      }, 1300);
    },
    [q, revealed, tenths, combo, points, correctCount, qIndex, recordAttempt, finishNow]
  );

  // مؤقت السؤال — يتوقف عند الكشف
  useEffect(() => {
    if (revealed || finished) return;
    const t = setInterval(() => setTenths((r) => r - 1), 100);
    return () => clearInterval(t);
  }, [revealed, finished, qIndex, round]);

  // انتهاء وقت السؤال
  useEffect(() => {
    if (!revealed && tenths <= 0 && !finished) reveal(null);
  }, [tenths, revealed, finished, reveal]);

  useEffect(
    () => () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    },
    []
  );

  const restart = () => {
    setRound((r) => r + 1);
    setQIndex(0);
    setTenths(PER_Q_SEC * 10);
    setChosen(null);
    setRevealed(false);
    setPoints(0);
    setCombo(0);
    setBestCombo(0);
    setCorrectCount(0);
    setFinished(false);
  };

  // ============ شاشة الختام ============
  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="mx-auto max-w-lg px-4 pb-16 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-primary">نتيجة السباق</p>
            <button
              onClick={close}
              aria-label="إنهاء"
              className="rounded-full bg-muted p-2.5 text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 rounded-3xl bg-gradient-to-bl from-[#4C1D95] to-[#6D28D9] p-6 text-center text-white">
            <Trophy className="mx-auto h-9 w-9 opacity-90" />
            <p className="mt-2 text-5xl font-black tabular-nums">{ad(points)}</p>
            <p className="text-xs font-bold text-white/85">مجموع نقاط السباق</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat icon={CircleCheck} value={`${ad(correctCount)}/${ad(QS_COUNT)}`} label="صواب" color="#6D28D9" />
            <Stat icon={Flame} value={ad(bestCombo)} label="أطول متتالية" color="#B45309" />
            <Stat icon={Sparkles} value={ad(Math.min(80, Math.round(points / 8)))} label="نقاط خبرة" color="#D97706" />
          </div>
          <div className="mt-4 rounded-2xl bg-muted/60 p-3.5 text-[11px] font-bold leading-6 text-muted-foreground">
            السرعة تصنع الفارق: الإجابة المبكرة تمنحك مكافأة زمنية، والمتتالية الصحيحة ترفع المضاعف — لكن
            الدقة قبل السرعة، فالخطأ يقطع المتتالية ويجمّد نقاطك.
          </div>
          <div className="mt-4 space-y-2">
            <Button onClick={restart} className="h-13 w-full rounded-2xl bg-primary text-sm font-black">
              <Zap className="ml-1.5 h-4.5 w-4.5" /> سباق جديد بأسئلة أخرى
            </Button>
            <button
              onClick={close}
              className="h-13 w-full rounded-2xl border border-border bg-white text-sm font-black"
            >
              عودة إلى مركز الاختبارات
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ شاشة السباق ============
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="mx-auto max-w-lg px-4 pb-10 pt-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-black text-primary">
            <Zap className="h-5 w-5" /> سباق السرعة
            <NewBadge tone="violet" />
          </p>
          <button
            onClick={close}
            aria-label="إنهاء السباق"
            className="rounded-full bg-muted p-2.5 text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* الشريط العلوي: النقاط والمتتالية والمؤقت */}
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-sm font-black text-white tabular-nums">
            <Zap className="h-4 w-4" /> {ad(points)}
          </span>
          {combo > 1 && (
            <motion.span
              key={combo}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 rounded-2xl bg-amber-400 px-3 py-2 text-xs font-black text-amber-950"
            >
              <Flame className="h-4 w-4" fill="currentColor" /> متتالية {ad(combo)}
            </motion.span>
          )}
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Timer className="h-4 w-4" /> {ad(Math.ceil(Math.max(0, tenths) / 10))} ثانية
          </span>
        </div>

        {/* شريط زمن السؤال */}
        <div className="progress-track mt-2.5 h-2.5">
          <div
            className={`progress-fill h-full transition-colors ${
              tenths <= 60 ? "!bg-red-500" : ""
            }`}
            style={{ width: `${Math.max(0, (tenths / (PER_Q_SEC * 10)) * 100)}%` }}
          />
        </div>

        <p className="mt-1.5 text-center text-[11px] font-bold text-muted-foreground">
          السؤال {ad(qIndex + 1)} من {ad(QS_COUNT)} — كل ثانية تأخير تنقص نقاطك
        </p>

        {q && (
          <motion.div key={`${round}-${q.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mt-4 rounded-3xl border border-border bg-white p-4 shadow-soft">
              <p className="text-[15px] font-black leading-8">{q.question}</p>
              <div className="mt-4 space-y-2.5">
                {q.options.map((o, i) => {
                  const isCorrect = revealed && o.text === q.correct;
                  const isWrongPick = revealed && chosen === o.text && o.text !== q.correct;
                  const dim = revealed && !isCorrect && !isWrongPick;
                  return (
                    <button
                      key={i}
                      disabled={revealed}
                      onClick={() => reveal(o.text)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition-all ${
                        isCorrect
                          ? "border-primary bg-accent ring-2 ring-primary"
                          : isWrongPick
                            ? "border-red-400 bg-red-50"
                            : dim
                              ? "border-border bg-white opacity-45"
                              : "border-border bg-white hover:bg-muted/40"
                      }`}
                    >
                      {q.options.length > 2 && (
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                            isCorrect ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {OPTION_LETTERS[i]}
                        </span>
                      )}
                      <span className="flex-1 text-[13px] font-bold leading-6">{o.text}</span>
                      {isCorrect && <CircleCheck className="h-5 w-5 shrink-0 text-primary" />}
                      {isWrongPick && <CircleX className="h-5 w-5 shrink-0 text-red-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
            {revealed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-3 rounded-2xl px-4 py-2.5 text-center text-xs font-black ${
                  chosen !== null && chosen === q.correct
                    ? "bg-accent text-primary"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {chosen === null
                  ? `انتهى الوقت — الصواب: ${q.correct}`
                  : chosen === q.correct
                    ? "إصابة سريعة!"
                    : `الصواب: ${q.correct}`}
              </motion.p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-white py-3.5">
      <Icon className="h-5 w-5" style={{ color }} />
      <span className="text-sm font-black tabular-nums">{value}</span>
      <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}
