"use client";

// اختبار تحديد المستوى — من ميزة «تقييم للمستوى» في تطبيقات المحاكاة:
// اثنا عشر سؤالًا من كل المحاور، بلا توجيه أثناء الحل، ثم مستوى ثلاثي
// مع نقاط القوة والفجوات وخطة تنفيذية بأزرار جاهزة.
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Compass,
  TrendingUp,
  Target,
  Dumbbell,
  GraduationCap,
  CircleCheck,
  CircleX,
  ChevronLeft,
} from "lucide-react";
import {
  buildPlacementSet,
  evaluatePlacement,
  PLACEMENT_LEVELS,
  type ExamItem,
  type PlacementResult,
} from "@/lib/exam-sim";
import { COURSE_COLOR, COURSE_SHORT, OPTION_LETTERS, questionsOfCourse, questionById } from "@/lib/qbank";
import { orderUnseenFirst } from "@/lib/srs";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad, arCount, QUESTION_OBJ_FORMS } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { NewBadge } from "./shared";

export default function PlacementView() {
  const close = useUi((s) => s.clearPlacement);
  const startQuiz = useUi((s) => s.startQuiz);
  const startExamsim = useUi((s) => s.startExamsim);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);
  const attempts = useApp((s) => s.attempts);

  const [items] = useState<ExamItem[]>(() => buildPlacementSet());
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const result: PlacementResult | null = useMemo(() => {
    if (!done) return null;
    const judged: Record<string, boolean> = {};
    for (const it of items) {
      const q = questionById(it.qid);
      judged[it.qid] = !!q && answers[it.qid] === q.correct;
    }
    return evaluatePlacement(items, judged);
  }, [done, items, answers]);

  // تسجيل الإجابة فقط — والانتقال والإنهاء يُدار من الأثر أدناه
  const choose = (text: string) => {
    const it = items[idx];
    if (!it || answers[it.qid]) return;
    setAnswers((a) => ({ ...a, [it.qid]: text }));
  };

  const finish = useCallback(
    (finalAnswers: Record<string, string>) => {
      if (done) return;
      let correct = 0;
      for (const it of items) {
        const q = questionById(it.qid);
        const ok = !!q && finalAnswers[it.qid] === q.correct;
        if (ok) correct += 1;
        recordAttempt(it.qid, ok, finalAnswers[it.qid]);
      }
      finishSession({
        mode: "placement",
        label: "اختبار تحديد المستوى",
        total: items.length,
        correctCount: correct,
        xp: correct * 3,
        durationSec: 0,
      });
      setDone(true);
    },
    [done, items, recordAttempt, finishSession]
  );

  // الانتقال مدفوع بالحالة: إذا أُجيب عن السؤال الحالي انتقلنا تلقائيًا —
  // وباكتمال الأجوبة الاثنتي عشرة يُعرض المستوى فورًا
  useEffect(() => {
    if (done) return;
    const it = items[idx];
    if (!it || !answers[it.qid]) return;
    if (Object.keys(answers).length >= items.length) {
      finish(answers);
      return;
    }
    const t = setTimeout(() => setIdx((i) => Math.min(items.length - 1, i + 1)), 300);
    return () => clearTimeout(t);
  }, [answers, idx, done, items, finish]);

  const current = items[idx] ? questionById(items[idx].qid) : undefined;

  // ============ النتيجة: مستوى + قوة وفجوات + خطة ============
  if (done && result) {
    const level = PLACEMENT_LEVELS[result.level];
    const weakest = result.weak[0];
    const trainWeak = () => {
      if (!weakest) return;
      const qs = questionsOfCourse(weakest.courseId).map((q) => q.id);
      startQuiz({
        mode: "training",
        label: `خطة الفجوة: ${COURSE_SHORT[weakest.courseId] ?? weakest.courseId}`,
        qids: orderUnseenFirst(qs, attempts),
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="mx-auto max-w-lg px-4 pb-16 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-primary">نتيجة تحديد المستوى</p>
            <button
              onClick={close}
              aria-label="إنهاء"
              className="rounded-full bg-muted p-2.5 text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* بطاقة المستوى */}
          <div
            className="mt-4 rounded-3xl p-6 text-center text-white"
            style={{ background: `linear-gradient(135deg, ${level.color}, #06343C)` }}
          >
            <Compass className="mx-auto h-9 w-9 opacity-90" />
            <p className="mt-2 text-2xl font-black">{level.title}</p>
            <p className="mt-2 text-xs font-bold leading-6 text-white/90">{level.desc}</p>
            <p className="mt-3 text-[11px] font-black text-white/80">
              أجبت صوابًا عن {arCount(result.correctCount, QUESTION_OBJ_FORMS)} من {ad(result.total)}
            </p>
          </div>

          {/* القوة والفجوة */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="card-soft rounded-3xl border border-border bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-black text-primary">
                <TrendingUp className="h-4 w-4" /> نقاط قوتك
              </p>
              <div className="mt-2 space-y-1.5">
                {result.strong.map((s) => (
                  <span
                    key={s.courseId}
                    className="block rounded-xl bg-accent px-3 py-2 text-[11px] font-black text-primary"
                  >
                    {COURSE_SHORT[s.courseId] ?? s.courseId}
                  </span>
                ))}
              </div>
            </div>
            <div className="card-soft rounded-3xl border border-border bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-black text-amber-700">
                <Target className="h-4 w-4" /> فجواتك
              </p>
              <div className="mt-2 space-y-1.5">
                {result.weak.map((s) => (
                  <span
                    key={s.courseId}
                    className="block rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800"
                  >
                    {COURSE_SHORT[s.courseId] ?? s.courseId}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* التوزيع على المحاور */}
          <div className="mt-4 card-soft rounded-3xl border border-border bg-white p-4">
            <p className="text-sm font-black text-primary">أداؤك على المحاور</p>
            <div className="mt-3 space-y-2.5">
              {result.perCourse.map((r) => {
                const pct = r.total ? (r.correct / r.total) * 100 : 0;
                return (
                  <div key={r.courseId}>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{COURSE_SHORT[r.courseId] ?? r.courseId}</span>
                      <span className="text-muted-foreground">
                        {ad(r.correct)} / {ad(r.total)}
                      </span>
                    </div>
                    <div className="progress-track mt-1 h-2">
                      <div
                        className="progress-fill h-full"
                        style={{ width: `${pct}%`, background: COURSE_COLOR[r.courseId] ?? "#0B5563" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* الخطة المقترحة */}
          <div className="mt-4 card-soft rounded-3xl border border-border bg-white p-4">
            <p className="text-sm font-black text-primary">خطتك المقترحة الآن</p>
            <div className="mt-3 space-y-2">
              <button
                onClick={trainWeak}
                className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-right transition-colors hover:bg-muted/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-black">درّب نفسك على أضعف محاورك</span>
                  <span className="block text-[10px] font-bold text-muted-foreground">
                    جلسة تدريب كاملة على {weakest ? COURSE_SHORT[weakest.courseId] : "المحور الأضعف"} — الجديد يأتي أولاً
                  </span>
                </span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
              <button
                onClick={() => startExamsim()}
                className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-right transition-colors hover:bg-muted/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-black">اختبر جاهزيتك في المحاكي</span>
                  <span className="block text-[10px] font-bold text-muted-foreground">
                    محاكاة موقوتة بأقسام ومحك نجاح — كالاختبار الرسمي
                  </span>
                </span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] font-bold leading-5 text-muted-foreground">
            تحديد المستوى تشخيص أولي — كرره بعد أسبوع من التدريب لترى إزاحة مستواك ومحاورك
          </p>
        </div>
      </motion.div>
    );
  }

  // ============ شاشة الأسئلة ============
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
            <Compass className="h-5 w-5" /> اختبار تحديد المستوى
          </p>
          <button
            onClick={close}
            aria-label="إلغاء الاختبار"
            className="rounded-full bg-muted p-2.5 text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3">
          <div className="progress-track h-2">
            <div className="progress-fill h-full" style={{ width: `${((idx + 1) / items.length) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-center text-[11px] font-bold text-muted-foreground">
            السؤال {ad(idx + 1)} من {ad(items.length)} — سؤالان من كل محور، بلا توجيه حتى النهاية
          </p>
        </div>

        {current && (
          <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mt-4 rounded-3xl border border-border bg-white p-4 shadow-soft">
              <p className="text-[15px] font-black leading-8">{current.question}</p>
              <div className="mt-4 space-y-2.5">
                {current.options.map((o, i) => {
                  const selected = answers[current.id] === o.text;
                  const showLetter = current.options.length > 2;
                  return (
                    <button
                      key={i}
                      onClick={() => choose(o.text)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition-all ${
                        selected
                          ? "border-primary bg-accent ring-1 ring-primary"
                          : "border-border bg-white hover:bg-muted/40"
                      }`}
                    >
                      {showLetter && (
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                            selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {OPTION_LETTERS[i]}
                        </span>
                      )}
                      <span className="flex-1 text-[13px] font-bold leading-6">{o.text}</span>
                      {selected &&
                        (current.options.length > 2 ? (
                          <CircleCheck className="h-5 w-5 shrink-0 text-primary" />
                        ) : (
                          <CircleX className="h-5 w-5 shrink-0 text-primary" />
                        ))}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => finish(answers)}
            variant="outline"
            className="h-11 rounded-2xl px-6 text-xs font-black"
          >
            إنهاء وأعرض مستواي الآن
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
