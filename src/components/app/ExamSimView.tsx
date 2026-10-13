"use client";

// محاكي الرخصة والمسابقات — ميزة مقتبسة من تطبيقات المحاكاة الرسمية:
// بلاتنات بأقسام ووقت ومحك نجاح، لوحة تنقل بالأسئلة، علامة مراجعة،
// تسليم تلقائي عند انتهاء الوقت، وبطاقة نتيجة بدرجة وتحليل الأقسام والأخطاء.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Timer,
  Flag,
  LayoutGrid,
  CircleAlert,
  CircleCheck,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  RotateCcw,
  Dumbbell,
  Award,
  History,
  Trash2,
} from "lucide-react";
import {
  BLUEPRINTS,
  buildExamSet,
  loadExamRuns,
  saveExamRun,
  clearExamRuns,
  type ExamBlueprint,
  type ExamItem,
  type ExamRun,
} from "@/lib/exam-sim";
import { COURSE_COLOR, COURSE_SHORT, OPTION_LETTERS, questionById } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad, arCount, QUESTION_OBJ_FORMS } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { NewBadge } from "./shared";

type Phase = "home" | "brief" | "run" | "result";

const fmtTime = (sec: number) => {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${ad(m)}:${ad(String(r).padStart(2, "0"))}`;
};

const arDate = (ts: number) => {
  try {
    return new Intl.DateTimeFormat("ar", { day: "numeric", month: "long" }).format(ts);
  } catch {
    return "";
  }
};

export default function ExamSimView() {
  const close = useUi((s) => s.clearExamsim);
  const startQuiz = useUi((s) => s.startQuiz);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);

  const [phase, setPhase] = useState<Phase>("home");
  const [bp, setBp] = useState<ExamBlueprint | null>(null);
  const [items, setItems] = useState<ExamItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [result, setResult] = useState<ExamRun | null>(null);
  const [runs, setRuns] = useState<ExamRun[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    setRuns(loadExamRuns());
  }, []);

  const startExam = (blueprint: ExamBlueprint) => {
    setBp(blueprint);
    setPhase("brief");
  };

  const beginRun = () => {
    if (!bp) return;
    submittedRef.current = false;
    setItems(buildExamSet(bp));
    setAnswers({});
    setFlagged({});
    setIdx(0);
    setRemaining(bp.minutes * 60);
    setStartedAt(Date.now());
    setResult(null);
    setPhase("run");
  };

  const submit = useCallback(() => {
    if (submittedRef.current || !bp) return;
    submittedRef.current = true;
    let correctCount = 0;
    const wrongQids: string[] = [];
    const secMap = new Map<string, { correct: number; total: number }>();
    for (const it of items) {
      const q = questionById(it.qid);
      const row = secMap.get(it.courseId) ?? { correct: 0, total: 0 };
      row.total += 1;
      const chosen = answers[it.qid];
      const ok = !!chosen && !!q && chosen === q.correct;
      if (ok) {
        correctCount += 1;
        row.correct += 1;
      } else {
        wrongQids.push(it.qid);
      }
      secMap.set(it.courseId, row);
      recordAttempt(it.qid, ok, chosen); // يغذي دفتر الأخطاء والمراجعة المتباعدة
    }
    const scorePct = items.length ? Math.round((correctCount / items.length) * 100) : 0;
    const passed = scorePct >= bp.passPct;
    const run: ExamRun = {
      id: `E${Date.now()}`,
      bpId: bp.id,
      bpName: bp.name,
      scorePct,
      passed,
      correctCount,
      total: items.length,
      sections: Array.from(secMap.entries()).map(([courseId, r]) => ({
        courseId,
        label: COURSE_SHORT[courseId] ?? courseId,
        ...r,
      })),
      wrongQids,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      ts: Date.now(),
    };
    setRuns(saveExamRun(run));
    setResult(run);
    finishSession({
      mode: "examsim",
      label: bp.name,
      total: items.length,
      correctCount,
      xp: correctCount * 2 + (passed ? 60 : 0),
      durationSec: run.durationSec,
    });
    setSubmitOpen(false);
    setPaletteOpen(false);
    setPhase("result");
  }, [bp, items, answers, startedAt, recordAttempt, finishSession]);

  // المؤقت التنازلي — والتسليم التلقائي عند انتهاء الوقت
  useEffect(() => {
    if (phase !== "run") return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "run" && remaining <= 0) submit();
  }, [phase, remaining, submit]);

  const current = items[idx] ? questionById(items[idx].qid) : undefined;
  const answeredCount = Object.keys(answers).length;
  const totalSec = bp ? bp.minutes * 60 : 0;
  const lowTime = phase === "run" && remaining <= Math.min(120, totalSec * 0.2);

  // ============ الشاشة الرئيسية: البلاتنات + السجل ============
  if (phase === "home") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="mx-auto max-w-lg px-4 pb-16 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-primary">
              <GraduationCap className="h-6 w-6" /> محاكي الرخصة والمسابقات
            </h2>
            <button
              onClick={close}
              aria-label="إغلاق المحاكي"
              className="rounded-full bg-muted p-2.5 text-muted-foreground transition-colors hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mb-5 text-xs font-bold leading-6 text-muted-foreground">
            ثلاث بلاتنات تحاكي بنية الاختبارات الرسمية: قسم معلن، وقت محدد، ومحك نجاح — بلا توجيه أثناء
            الحل، والتحليل الكامل بعد التسليم.
          </p>

          <div className="space-y-3">
            {BLUEPRINTS.map((b) => (
              <motion.button
                key={b.id}
                whileTap={{ scale: 0.985 }}
                onClick={() => startExam(b)}
                className="card-soft flex w-full items-start gap-3.5 rounded-3xl border border-border bg-white p-4 text-right shadow-soft"
              >
                <span
                  className="flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
                  style={{ background: b.color }}
                >
                  <Award className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black text-foreground">{b.name}</span>
                  <span className="mt-1 block text-[11px] font-bold leading-5 text-muted-foreground">
                    {b.desc}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Chip>{arCount(b.total, QUESTION_OBJ_FORMS)}</Chip>
                    <Chip>{ad(b.minutes)} دقيقة</Chip>
                    <Chip>النجاح {ad(b.passPct)} بالمئة</Chip>
                  </span>
                </span>
              </motion.button>
            ))}
          </div>

          {/* سجل المحاولات */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-black text-primary">
                <History className="h-4 w-4" /> سجل محاولاتك
              </p>
              {runs.length > 0 && (
                <button
                  onClick={() => {
                    clearExamRuns();
                    setRuns([]);
                  }}
                  aria-label="تفريغ السجل"
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Trash2 className="h-3.5 w-3.5" /> تفريغ
                </button>
              )}
            </div>
            {runs.length === 0 ? (
              <p className="rounded-2xl bg-muted/60 px-4 py-3 text-[11px] font-bold leading-5 text-muted-foreground">
                لم تخوض محاكاة بعد — أول محاولة ستُحفظ هنا بدرجتها وتحليل أقسامها لترى تقدمك محاكاة بعد
                محاكاة.
              </p>
            ) : (
              <div className="space-y-2">
                {runs.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white ${
                        r.passed ? "bg-primary" : "bg-red-500"
                      }`}
                    >
                      {ad(r.scorePct)}٪
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black">{r.bpName}</span>
                      <span className="mt-0.5 block text-[10px] font-bold text-muted-foreground">
                        {arCount(r.correctCount, QUESTION_OBJ_FORMS)} — {arDate(r.ts)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                        r.passed ? "bg-accent text-primary" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {r.passed ? "ناجح" : "تحت المحك"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ صفحة التعليمات قبل البدء ============
  if (phase === "brief" && bp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="mx-auto max-w-lg px-4 pb-16 pt-5">
          <button
            onClick={() => setPhase("home")}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4" /> رجوع
          </button>

          <div
            className="mt-4 rounded-3xl p-5 text-white"
            style={{ background: `linear-gradient(135deg, ${bp.color}, #2A1058)` }}
          >
            <h2 className="text-xl font-black">{bp.name}</h2>
            <p className="mt-1.5 text-xs leading-6 text-white/90">{bp.desc}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <BriefStat icon={LayoutGrid} label="عدد الأسئلة" value={ad(bp.total)} />
            <BriefStat icon={Timer} label="الزمن" value={`${ad(bp.minutes)} دقيقة`} />
            <BriefStat icon={Award} label="حد النجاح" value={`${ad(bp.passPct)}٪`} />
          </div>

          <div className="mt-4 card-soft rounded-3xl border border-border bg-white p-4">
            <p className="text-sm font-black text-primary">أقسام الاختبار</p>
            <div className="mt-2.5 space-y-2">
              {bp.sections.map((s) => (
                <div key={s.courseId} className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: COURSE_COLOR[s.courseId] ?? "#5B21B6" }}
                  />
                  <span className="flex-1 text-xs font-bold">{COURSE_SHORT[s.courseId] ?? s.courseId}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-black text-muted-foreground">
                    {arCount(s.quota, QUESTION_OBJ_FORMS)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-black text-amber-900">
              <CircleAlert className="h-4 w-4" /> قواعد المحاكاة
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] font-bold leading-5 text-amber-900/85">
              <li>• لا يظهر التوجيه ولا الصواب أثناء الحل — كالامتحان الحقيقي تمامًا.</li>
              <li>• يمكنك التنقل بين الأسئلة وتعليم ما شككت فيه بعلامة المراجعة.</li>
              <li>• يُسلَّم الاختبار تلقائيًا عند انتهاء الوقت، فلا تتأخر في العودة للتسليم.</li>
              <li>• أخطاؤك بعد التسليم تُضاف تلقائيًا إلى دفتر أخطائي ومراجعتك المتباعدة.</li>
            </ul>
          </div>

          <Button
            onClick={beginRun}
            className="mt-5 h-14 w-full rounded-2xl bg-primary text-base font-black"
          >
            ابدأ المحاكاة الآن
          </Button>
        </div>
      </motion.div>
    );
  }

  // ============ شاشة الحل الموقوت ============
  if (phase === "run" && bp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        {/* شريط علوي ثابت: المؤقت والتقدم ولوحة الأسئلة */}
        <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-4 pb-2.5 pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center gap-2.5">
            <span
              className={`flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-black tabular-nums ${
                lowTime ? "bg-red-50 text-red-600" : "bg-muted text-foreground"
              }`}
            >
              <Timer className="h-4 w-4" /> {fmtTime(remaining)}
            </span>
            <div className="flex-1">
              <div className="progress-track h-2">
                <div
                  className="progress-fill h-full"
                  style={{ width: `${((idx + 1) / items.length) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] font-bold text-muted-foreground">
                السؤال {ad(idx + 1)} من {ad(items.length)} — أجبت عن {ad(answeredCount)}
              </p>
            </div>
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="لوحة الأسئلة"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          {current && (
            <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-black text-white"
                  style={{ background: COURSE_COLOR[items[idx].courseId] ?? "#5B21B6" }}
                >
                  {COURSE_SHORT[items[idx].courseId] ?? ""}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {current.difficulty}
                </span>
                <button
                  onClick={() => setFlagged((f) => ({ ...f, [current.id]: !f[current.id] }))}
                  className={`ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-black transition-colors ${
                    flagged[current.id]
                      ? "bg-amber-400 text-amber-950"
                      : "border border-border bg-white text-muted-foreground"
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" fill={flagged[current.id] ? "currentColor" : "none"} />
                  {flagged[current.id] ? "مُعلَّم للمراجعة" : "علّم للمراجعة"}
                </button>
              </div>

              <div className="rounded-3xl border border-border bg-white p-4 shadow-soft">
                <p className="text-[15px] font-black leading-8">{current.question}</p>
                <div className="mt-4 space-y-2.5">
                  {current.options.map((o, i) => {
                    const selected = answers[current.id] === o.text;
                    const showLetter = current.options.length > 2;
                    return (
                      <button
                        key={i}
                        onClick={() => setAnswers((a) => ({ ...a, [current.id]: o.text }))}
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
                        {selected && <CircleCheck className="h-5 w-5 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* أزرار التنقل والتسليم */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-2.5 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="flex h-12 flex-1 items-center justify-center gap-1 rounded-2xl border border-border bg-white text-sm font-black disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" /> السابق
            </button>
            {idx === items.length - 1 ? (
              <Button
                onClick={() => setSubmitOpen(true)}
                className="h-12 flex-1 rounded-2xl bg-amber-400 text-sm font-black text-amber-950 hover:bg-amber-300"
              >
                سلّم الاختبار
              </Button>
            ) : (
              <Button
                onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
                className="h-12 flex-1 rounded-2xl bg-primary text-sm font-black"
              >
                التالي <ChevronLeft className="mr-1 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* لوحة الأسئلة */}
        <AnimatePresence>
          {paletteOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 flex items-end bg-black/40"
              onClick={() => setPaletteOpen(false)}
            >
              <motion.div
                initial={{ y: 120 }}
                animate={{ y: 0 }}
                exit={{ y: 120 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="mx-auto w-full max-w-lg rounded-t-3xl bg-white p-5 pb-8"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black">خريطة الأسئلة</p>
                  <button
                    onClick={() => setPaletteOpen(false)}
                    aria-label="إغلاق الخريطة"
                    className="rounded-full bg-muted p-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {items.map((it, i) => {
                    const q = questionById(it.qid);
                    const isAns = !!answers[it.qid];
                    const isFlag = q ? !!flagged[q.id] : false;
                    return (
                      <button
                        key={it.qid}
                        onClick={() => {
                          setIdx(i);
                          setPaletteOpen(false);
                        }}
                        className={`relative flex h-10 items-center justify-center rounded-xl text-xs font-black transition-colors ${
                          isAns ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        } ${i === idx ? "ring-2 ring-amber-500" : ""}`}
                      >
                        {ad(i + 1)}
                        {isFlag && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-primary" /> مُجاب
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-muted" /> فارغ
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-amber-400" /> مُعلَّم للمراجعة
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* تأكيد التسليم */}
        <AnimatePresence>
          {submitOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm rounded-3xl bg-white p-5 text-center"
              >
                <CircleAlert className="mx-auto h-10 w-10 text-amber-500" />
                <p className="mt-2 text-base font-black">تسليم الاختبار؟</p>
                <p className="mt-1 text-xs font-bold leading-6 text-muted-foreground">
                  أجبت عن {ad(answeredCount)} من {ad(items.length)}
                  {items.length - answeredCount > 0
                    ? ` — وتبقى ${arCount(items.length - answeredCount, QUESTION_OBJ_FORMS)} دون إجابة وستُحسب خطأً`
                    : " — أكملت جميع الأسئلة"}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSubmitOpen(false)}
                    className="h-12 flex-1 rounded-2xl border border-border text-sm font-black"
                  >
                    متابعة الحل
                  </button>
                  <Button
                    onClick={submit}
                    className="h-12 flex-1 rounded-2xl bg-amber-400 text-sm font-black text-amber-950 hover:bg-amber-300"
                  >
                    سلّم الآن
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ============ بطاقة النتيجة والتحليل ============
  if (phase === "result" && result && bp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="mx-auto max-w-lg px-4 pb-16 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-primary">نتيجة المحاكاة</p>
            <button
              onClick={close}
              aria-label="إنهاء"
              className="rounded-full bg-muted p-2.5 text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* الدرجة والمحك */}
          <div
            className={`mt-4 rounded-3xl p-6 text-center text-white ${
              result.passed ? "bg-gradient-to-bl from-[#4C1D95] to-[#6D28D9]" : "bg-gradient-to-bl from-[#7F1D1D] to-[#B91C1C]"
            }`}
          >
            <p className="text-xs font-bold text-white/85">{result.bpName}</p>
            <p className="mt-2 text-6xl font-black tabular-nums">{ad(result.scorePct)}٪</p>
            <p className="mt-2 text-sm font-black">
              {result.passed ? "ناجح — جاوزت المحك المطلوب" : "تحت المحك — المراجعة سترفعك في المرة القادمة"}
            </p>
            <p className="mt-1 text-[11px] font-bold text-white/80">
              {arCount(result.correctCount, QUESTION_OBJ_FORMS)} من {ad(result.total)} — حد النجاح{" "}
              {ad(bp.passPct)} بالمئة
            </p>
          </div>

          {/* تحليل الأقسام */}
          <div className="mt-4 card-soft rounded-3xl border border-border bg-white p-4">
            <p className="text-sm font-black text-primary">تحليل الأقسام</p>
            <div className="mt-3 space-y-3">
              {result.sections.map((s) => {
                const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={s.courseId}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{s.label}</span>
                      <span className="text-muted-foreground">
                        {ad(s.correct)} / {ad(s.total)} — {ad(pct)}٪
                      </span>
                    </div>
                    <div className="progress-track mt-1.5 h-2.5">
                      <div
                        className="progress-fill h-full"
                        style={{
                          width: `${pct}%`,
                          background: COURSE_COLOR[s.courseId] ?? "#5B21B6",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* الأخطاء مع الأسباب */}
          {result.wrongQids.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-black text-primary">
                أخطاؤك ({arCount(result.wrongQids.length, QUESTION_OBJ_FORMS)})
              </p>
              <div className="space-y-2.5">
                {result.wrongQids.map((qid) => {
                  const q = questionById(qid);
                  if (!q) return null;
                  const chosen = answers[qid];
                  return (
                    <div key={qid} className="card-soft rounded-3xl border border-border bg-white p-4">
                      <p className="text-[13px] font-black leading-7">{q.question}</p>
                      {chosen && (
                        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                          إجابتك: {chosen}
                        </p>
                      )}
                      <p className="mt-1.5 rounded-xl bg-accent px-3 py-2 text-[11px] font-black text-primary">
                        الصواب: {q.correct}
                      </p>
                      <p className="mt-2 text-[11px] font-bold leading-6 text-muted-foreground">{q.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* أزرار ما بعد النتيجة */}
          <div className="mt-5 space-y-2">
            {result.wrongQids.length > 0 && (
              <Button
                onClick={() => {
                  startQuiz({
                    mode: "redo",
                    label: "تدريب على أخطاء المحاكاة",
                    qids: result.wrongQids,
                  });
                }}
                className="h-13 w-full rounded-2xl bg-primary text-sm font-black"
              >
                <Dumbbell className="ml-1.5 h-4.5 w-4.5" /> تدرّب الآن على أخطائك
              </Button>
            )}
            <button
              onClick={beginRun}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white text-sm font-black"
            >
              <RotateCcw className="h-4.5 w-4.5" /> محاكاة جديدة على البلاتنة نفسها
            </button>
            <button
              onClick={() => setPhase("home")}
              className="h-13 w-full rounded-2xl bg-muted text-sm font-black text-foreground"
            >
              عودة إلى البلاتنات
            </button>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold text-muted-foreground">
            حُفظت هذه المحاولة في سجل محاولاتك — قارن درجاتك بين المحاولات لترى أثر المراجعة
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">
      {children}
    </span>
  );
}

function BriefStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="card-soft flex flex-col items-center gap-1 rounded-2xl border border-border bg-white py-3.5">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-black">{value}</span>
      <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
}
