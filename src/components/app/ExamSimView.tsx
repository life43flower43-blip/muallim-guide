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
import { ad, arCount, QUESTION_FORMS } from "@/lib/arabic";
import { useQueryClient } from "@tanstack/react-query";
import { recordMistake } from "@/lib/mistakes-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Callout, Card, Chip, Divided, IconTile, OptionButton, PrimaryButton, ProgressBar, Ring, ScreenShell, SecondaryButton, SectionHeader, SkillBar } from "./ui-kit";

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
  const queryClient = useQueryClient();

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
  const [runs, setRuns] = useState<ExamRun[]>(() => loadExamRuns());
  const [startedAt, setStartedAt] = useState(0);
  const submittedRef = useRef(false);

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
      recordAttempt(it.qid, ok, chosen); // يغذي المراجعة المتباعدة
      if (!ok && chosen) recordMistake(it.qid, chosen, queryClient); // والخطأ المُجاب يدخل «أخطائي»
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
  }, [bp, items, answers, startedAt, recordAttempt, finishSession, queryClient]);

  // المؤقت التنازلي — والتسليم التلقائي عند انتهاء الوقت
  useEffect(() => {
    if (phase !== "run") return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "run" || remaining > 0) return;
    // التسليم بعد انتهاء الرسم الحالي، لا داخله
    const t = setTimeout(submit, 0);
    return () => clearTimeout(t);
  }, [phase, remaining, submit]);

  const current = items[idx] ? questionById(items[idx].qid) : undefined;
  const answeredCount = Object.keys(answers).length;
  const totalSec = bp ? bp.minutes * 60 : 0;
  const lowTime = phase === "run" && remaining <= Math.min(120, totalSec * 0.2);

  // ============ الرئيسية: نماذج الاختبار والسجل ============
  if (phase === "home") {
    return (
      <ScreenShell title="محاكي الاختبار الرسمي" sub="أقسام ووقت ومحك نجاح، والتحليل بعد التسليم" onClose={close}>
        <div className="space-y-6">
          <Divided>
            {BLUEPRINTS.map((b) => (
              <button key={b.id} type="button" onClick={() => startExam(b)} className="flex w-full items-start gap-3 px-4 py-4 text-right transition-colors hover:bg-muted/60">
                <IconTile icon={Award} />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{b.name}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{b.desc}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <Chip>{arCount(b.total, QUESTION_FORMS)}</Chip>
                    <Chip>{ad(b.minutes)} دقيقة</Chip>
                    <Chip>النجاح {ad(b.passPct)}٪</Chip>
                  </span>
                </span>
                <ChevronLeft className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/60" />
              </button>
            ))}
          </Divided>

          <section>
            <SectionHeader
              title="محاولاتك"
              action={
                runs.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearExamRuns();
                      setRuns([]);
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1 text-sm text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" /> مسح السجل
                  </button>
                ) : undefined
              }
            />
            {runs.length === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">تُحفظ كل محاولة هنا بدرجتها وتحليل أقسامها.</p>
            ) : (
              <Divided>
                {runs.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums ${
                        r.passed ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
                      }`}
                    >
                      {ad(r.scorePct)}٪
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base">{r.bpName}</span>
                      <span className="block text-sm text-muted-foreground">{arDate(r.ts)}</span>
                    </span>
                    <Chip tone={r.passed ? "success" : "danger"}>{r.passed ? "ناجح" : "دون المحك"}</Chip>
                  </div>
                ))}
              </Divided>
            )}
          </section>
        </div>
      </ScreenShell>
    );
  }

  // ============ التعليمات قبل البدء ============
  if (phase === "brief" && bp) {
    return (
      <ScreenShell
        title={bp.name}
        sub="تعليمات الاختبار"
        onBack={() => setPhase("home")}
        onClose={close}
        footer={
          <PrimaryButton onClick={beginRun} className="w-full">
            ابدأ الاختبار
          </PrimaryButton>
        }
      >
        <div className="space-y-5">
          <p className="text-base leading-7 text-secondary-foreground">{bp.desc}</p>
          <div className="grid grid-cols-3 gap-3">
            <BriefStat icon={LayoutGrid} label="سؤالًا" value={ad(bp.total)} />
            <BriefStat icon={Timer} label="دقيقة" value={ad(bp.minutes)} />
            <BriefStat icon={Award} label="للنجاح" value={`${ad(bp.passPct)}٪`} />
          </div>
          <Card className="p-5">
            <SectionHeader title="أقسام الاختبار" />
            <ul className="divide-y divide-border">
              {bp.sections.map((x) => (
                <li key={x.courseId} className="flex items-center gap-3 py-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COURSE_COLOR[x.courseId] ?? "var(--primary)" }} />
                  <span className="flex-1 text-base">{COURSE_SHORT[x.courseId] ?? x.courseId}</span>
                  <span className="text-sm text-muted-foreground">{arCount(x.quota, QUESTION_FORMS)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Callout tone="warning" icon={CircleAlert} title="قواعد الاختبار">
            <ul className="list-disc space-y-1 pr-5">
              <li>لا يظهر التصحيح أثناء الحل، كالاختبار الحقيقي.</li>
              <li>تتنقل بين الأسئلة بحرية، وتعلّم ما تريد مراجعته.</li>
              <li>يُسلَّم الاختبار تلقائيًا عند انتهاء الوقت.</li>
              <li>تُضاف أخطاؤك بعد التسليم إلى «أخطائي».</li>
            </ul>
          </Callout>
        </div>
      </ScreenShell>
    );
  }

  // ============ الحل الموقوت ============
  if (phase === "run" && bp) {
    const isLast = idx === items.length - 1;
    return (
      <>
        <ScreenShell
          title={bp.name}
          sub={`السؤال ${ad(idx + 1)} من ${ad(items.length)}، أجبت عن ${ad(answeredCount)}`}
          onClose={() => setSubmitOpen(true)}
          actions={
            <>
              <span className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold tabular-nums ${lowTime ? "bg-danger-soft text-destructive" : "bg-black/5"}`}>
                <Timer className="h-4 w-4" /> {fmtTime(remaining)}
              </span>
              <button type="button" onClick={() => setPaletteOpen(true)} aria-label="خريطة الأسئلة" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
                <LayoutGrid className="h-5 w-5" />
              </button>
            </>
          }
          footer={
            <>
              <SecondaryButton onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1">
                <ChevronRight className="h-4 w-4" /> السابق
              </SecondaryButton>
              {isLast ? (
                <PrimaryButton onClick={() => setSubmitOpen(true)} className="flex-1">
                  سلّم الاختبار
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))} className="flex-1">
                  التالي <ChevronLeft className="h-4 w-4" />
                </PrimaryButton>
              )}
            </>
          }
        >
          <ProgressBar value={((idx + 1) / items.length) * 100} className="mb-5" />
          {current && (
            <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Chip>
                  <span className="h-2 w-2 rounded-full" style={{ background: COURSE_COLOR[items[idx].courseId] ?? "var(--primary)" }} />
                  {COURSE_SHORT[items[idx].courseId] ?? ""}
                </Chip>
                <Chip>{current.difficulty}</Chip>
                <button
                  type="button"
                  aria-pressed={!!flagged[current.id]}
                  onClick={() => setFlagged((f) => ({ ...f, [current.id]: !f[current.id] }))}
                  className={`mr-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
                    flagged[current.id] ? "border-gem bg-gem-soft text-gem" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" fill={flagged[current.id] ? "currentColor" : "none"} />
                  {flagged[current.id] ? "معلَّم للمراجعة" : "علّم للمراجعة"}
                </button>
              </div>
              <h2 className="font-display text-lg font-semibold leading-9">{current.question}</h2>
              <div className="space-y-3">
                {current.options.map((o, i) => (
                  <OptionButton
                    key={i}
                    letter={current.options.length > 2 ? OPTION_LETTERS[i] : undefined}
                    state={answers[current.id] === o.text ? "selected" : "idle"}
                    onClick={() => setAnswers((a) => ({ ...a, [current.id]: o.text }))}
                  >
                    {o.text}
                  </OptionButton>
                ))}
              </div>
            </motion.div>
          )}
        </ScreenShell>

        <AnimatePresence>
          {paletteOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
              onClick={() => setPaletteOpen(false)}
            >
              <motion.div
                initial={{ y: 120 }}
                animate={{ y: 0 }}
                exit={{ y: 120 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl rounded-t-2xl bg-card p-5 pb-8"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-display text-base font-semibold">خريطة الأسئلة</p>
                  <button type="button" onClick={() => setPaletteOpen(false)} aria-label="إغلاق" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {items.map((it, i) => {
                    const isAns = !!answers[it.qid];
                    const isFlag = !!flagged[it.qid];
                    return (
                      <button
                        key={it.qid}
                        type="button"
                        onClick={() => {
                          setIdx(i);
                          setPaletteOpen(false);
                        }}
                        className={`relative flex h-11 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          isAns ? "bg-primary text-primary-foreground" : "bg-muted text-secondary-foreground"
                        } ${i === idx ? "ring-2 ring-foreground/60 ring-offset-1 ring-offset-card" : ""}`}
                      >
                        {ad(i + 1)}
                        {isFlag && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-gem" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary" /> مُجاب</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-muted ring-1 ring-border" /> لم يُجب</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gem" /> للمراجعة</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>تسليم الاختبار؟</AlertDialogTitle>
              <AlertDialogDescription>
                أجبت عن {ad(answeredCount)} من {ad(items.length)}.
                {items.length - answeredCount > 0 ? ` يبقى بلا إجابة ${arCount(items.length - answeredCount, QUESTION_FORMS)} وتُحسب خطأً.` : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>متابعة الحل</AlertDialogCancel>
              <AlertDialogAction onClick={submit}>سلّم الآن</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ============ النتيجة والتحليل ============
  if (phase === "result" && result && bp) {
    return (
      <ScreenShell
        title="نتيجة الاختبار"
        sub={result.bpName}
        onClose={close}
        footer={
          result.wrongQids.length > 0 ? (
            <>
              <SecondaryButton onClick={beginRun} className="flex-1">
                <RotateCcw className="h-4 w-4" /> اختبار جديد
              </SecondaryButton>
              <PrimaryButton onClick={() => startQuiz({ mode: "redo", label: "التدرب على أخطاء الاختبار", qids: result.wrongQids })} className="flex-1">
                <Dumbbell className="h-4 w-4" /> تدرّب على أخطائك
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton onClick={() => setPhase("home")} className="w-full">
              تم
            </PrimaryButton>
          )
        }
      >
        <div className="space-y-5">
          <Card className="flex flex-col items-center p-6 text-center">
            <Ring value={result.scorePct} size={128} stroke={10}>
              <span className="font-display text-3xl font-bold text-primary">{ad(result.scorePct)}٪</span>
            </Ring>
            <Chip tone={result.passed ? "success" : "danger"} className="mt-4">
              {result.passed ? "ناجح" : "دون المحك"}
            </Chip>
            <p className="mt-3 text-base text-secondary-foreground">
              {ad(result.correctCount)} من {ad(result.total)} صحيحة، وحد النجاح {ad(bp.passPct)}٪
            </p>
          </Card>

          <Card className="p-5">
            <SectionHeader title="تحليل الأقسام" />
            <div className="space-y-4">
              {result.sections.map((x) => {
                const v = x.total ? Math.round((x.correct / x.total) * 100) : 0;
                return <SkillBar key={x.courseId} label={x.label} value={v} status={`${ad(x.correct)} من ${ad(x.total)}، ${ad(v)}٪`} tone={v >= bp.passPct ? "success" : "warning"} />;
              })}
            </div>
          </Card>

          {result.wrongQids.length > 0 && (
            <section>
              <SectionHeader title={`أخطاؤك (${ad(result.wrongQids.length)})`} sub="أُضيفت إلى «أخطائي» للمراجعة" />
              <div className="space-y-3">
                {result.wrongQids.map((qid) => {
                  const q = questionById(qid);
                  if (!q) return null;
                  const chosen = answers[qid];
                  return (
                    <Card key={qid} className="space-y-2 p-4">
                      <p className="text-base font-medium leading-7">{q.question}</p>
                      {chosen && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">إجابتك: {chosen}</p>}
                      <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">الصحيح: {q.correct}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{q.reason}</p>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </ScreenShell>
    );
  }

  return null;
}

function BriefStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card className="flex flex-col items-center gap-1 py-4">
      <Icon className="h-5 w-5 text-primary" />
      <span className="font-display text-lg font-semibold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  );
}
