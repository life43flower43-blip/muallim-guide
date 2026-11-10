"use client";

// محاكي الرخصة والمسابقات — ميزة مقتبسة من تطبيقات المحاكاة الرسمية:
// بلاتنات بأقسام ووقت ومحك نجاح، لوحة تنقل بالأسئلة، علامة مراجعة،
// تسليم تلقائي عند انتهاء الوقت، وبطاقة نتيجة بدرجة وتحليل الأقسام والأخطاء.
import { FitText } from "./FitText";
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
  ListOrdered,
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
import { Callout, Card, Chip, DifficultyChip, Divided, OptionButton, PrimaryButton, ProgressBar, Ring, ScreenShell, SecondaryButton, SectionHeader, SkillBar, GameTile } from "./ui-kit";

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

// مسودة الاختبار الجاري على الجهاز
const DRAFT_KEY = "turbawy-exam-draft";
type ExamDraft = { bpId: string; items: ExamItem[]; answers: Record<string, string>; flagged: Record<string, boolean>; idx: number; startedAt: number; deadline: number };
function loadDraft(): ExamDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    return d && Array.isArray(d.items) && d.items.length && typeof d.deadline === "number" ? (d as ExamDraft) : null;
  } catch {
    return null;
  }
}
function saveDraft(d: ExamDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export default function ExamSimView() {
  const close = useUi((s) => s.clearExamsim);
  const startQuiz = useUi((s) => s.startQuiz);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);
  const queryClient = useQueryClient();

  // استئناف اختبار جارٍ أُغلق التطبيق أثناءه (وإن انتهى وقته يُسلَّم فورًا)
  const [resume] = useState(() => {
    const d = typeof window !== "undefined" ? loadDraft() : null;
    const blueprint = d ? BLUEPRINTS.find((b) => b.id === d.bpId) : undefined;
    return d && blueprint ? { d, blueprint } : null;
  });
  const [phase, setPhase] = useState<Phase>(resume ? "run" : "home");
  const [bp, setBp] = useState<ExamBlueprint | null>(resume?.blueprint ?? null);
  const [items, setItems] = useState<ExamItem[]>(resume?.d.items ?? []);
  const [answers, setAnswers] = useState<Record<string, string>>(resume?.d.answers ?? {});
  const [flagged, setFlagged] = useState<Record<string, boolean>>(resume?.d.flagged ?? {});
  const [idx, setIdx] = useState(resume ? Math.min(resume.d.idx, resume.d.items.length - 1) : 0);
  const [remaining, setRemaining] = useState(resume ? Math.max(0, Math.round((resume.d.deadline - Date.now()) / 1000)) : 0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [result, setResult] = useState<ExamRun | null>(null);
  const [runs, setRuns] = useState<ExamRun[]>(() => loadExamRuns());
  const [startedAt, setStartedAt] = useState(resume?.d.startedAt ?? 0);
  const [deadline, setDeadline] = useState(resume?.d.deadline ?? 0);
  const submittedRef = useRef(false);

  // حفظ الاختبار الجاري مع كل إجابة
  useEffect(() => {
    if (phase !== "run" || !bp || !items.length) return;
    saveDraft({ bpId: bp.id, items, answers, flagged, idx, startedAt, deadline });
  }, [phase, bp, items, answers, flagged, idx, startedAt, deadline]);

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
    setDeadline(Date.now() + bp.minutes * 60_000);
    setResult(null);
    setPhase("run");
  };

  const submit = useCallback(() => {
    if (submittedRef.current || !bp) return;
    submittedRef.current = true;
    clearDraft();
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
    if (phase !== "run" || !deadline) return;
    // الوقت المتبقي يُحسب من موعد الانتهاء، فلا يتأخر إذا نام الجوال أو صغُر التطبيق
    const tick = () => setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [phase, deadline]);

  useEffect(() => {
    if (phase !== "run" || remaining > 0) return;
    // التسليم بعد انتهاء الرسم الحالي، لا داخله
    const t = setTimeout(submit, 0);
    return () => clearTimeout(t);
  }, [phase, remaining, submit]);

  const current = items[idx] ? questionById(items[idx].qid) : undefined;
  const answeredCount = Object.keys(answers).length;
  const totalSec = bp ? bp.minutes * 60 : 0;
  // التحذير في الدقائق العشر الأخيرة، أو في آخر خُمس الوقت إن كان الاختبار قصيرًا
  const lowTime = phase === "run" && remaining <= Math.min(600, totalSec * 0.2);
  const samePass = BLUEPRINTS.every((b) => b.passPct === BLUEPRINTS[0].passPct);
  const answeredTotal = Object.keys(answers).length;

  // ============ الرئيسية: نماذج الاختبار والسجل ============
  if (phase === "home") {
    return (
      <ScreenShell title="محاكي الاختبار الرسمي" sub={samePass ? `اختر نموذجًا، وحد النجاح ${ad(BLUEPRINTS[0].passPct)}٪ في كل النماذج` : "اختر نموذجًا للبدء"} onClose={close}>
        <div className="space-y-6">
          <div className="space-y-2.5">
            {BLUEPRINTS.map((b, k) => (
              <GameTile key={b.id} tone={k} emoji={["📝", "🎓", "🏆", "🎯"][k % 4]} title={b.name} meta={`${ad(b.total)} سؤالًا · ${ad(b.minutes)} د`} onClick={() => startExam(b)} />
            ))}
          </div>

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
              <div className="flex items-center gap-3 rounded-[20px] border border-dashed border-border px-4 py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <History className="h-5 w-5" />
                </span>
                <span className="text-[14px] leading-6 text-secondary-foreground">لا محاولات بعد. اختر نموذجًا من الأعلى، وستظهر هنا درجتك وتحليل أقسامك بعد التسليم.</span>
              </div>
            ) : (
              <Divided>
                {runs.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums ${
                        r.passed ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
                      }`}
                    >
                      <bdi dir="rtl">{ad(r.scorePct)}٪</bdi>
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
          {/* القواعد أولًا حتى تُقرأ قبل البدء */}
          <Callout tone="warning" icon={CircleAlert} title="قواعد الاختبار">
            <ul className="list-disc space-y-1 pr-5">
              <li>لا يظهر التصحيح أثناء الحل، كالاختبار الحقيقي.</li>
              <li>تتنقل بين الأسئلة بحرية، وتعلّم ما تريد مراجعته.</li>
              <li>يُسلَّم الاختبار تلقائيًا عند انتهاء الوقت.</li>
              <li>تُضاف أخطاؤك بعد التسليم إلى «أخطائي».</li>
            </ul>
          </Callout>
          <div className="grid grid-cols-3 gap-3">
            <BriefStat icon={ListOrdered} label="سؤالًا" value={ad(bp.total)} />
            <BriefStat icon={Timer} label="دقيقة" value={ad(bp.minutes)} />
            <BriefStat icon={Award} label="للنجاح" value={`${ad(bp.passPct)}٪`} />
          </div>
          <Card className="p-5">
            <SectionHeader title="أقسام الاختبار" />
            <ul className="divide-y divide-border">
              {bp.sections.map((x) => (
                <li key={x.courseId} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1 text-base">{COURSE_SHORT[x.courseId] ?? x.courseId}</span>
                  <span className="text-sm text-secondary-foreground">{arCount(x.quota, QUESTION_FORMS)}</span>
                </li>
              ))}
            </ul>
          </Card>
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
          sub={`أجبت عن ${ad(answeredCount)} من ${ad(items.length)}`}
          onClose={() => setSubmitOpen(true)}
          actions={
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label="خريطة الأسئلة: المُجاب والمتروك والمعلَّم" className="flex h-10 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-bold">
              <LayoutGrid className="h-4 w-4" /> الأسئلة
            </button>
          }
          footer={
            <>
              <SecondaryButton onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="flex-1">
                <ChevronRight className="h-5 w-5" /> السابق
              </SecondaryButton>
              {isLast ? (
                <PrimaryButton onClick={() => setSubmitOpen(true)} className="flex-1">
                  سلّم الاختبار
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))} className="flex-1">
                  التالي <ChevronLeft className="h-5 w-5" />
                </PrimaryButton>
              )}
            </>
          }
        >
          {/* المؤقت أبرز ما في الشاشة، ويتحول إلى تحذير في الدقائق العشر الأخيرة */}
          <div className={`mb-3 flex items-center justify-between rounded-[18px] px-4 py-2.5 ${lowTime ? "bg-danger-soft text-destructive" : "bg-accent text-accent-foreground"}`} role="timer" aria-live={lowTime ? "polite" : "off"}>
            <span className="flex items-center gap-2 text-[14px] font-bold">
              <Timer className="h-5 w-5" /> {lowTime ? "اقترب الوقت من النهاية" : "الوقت المتبقي"}
            </span>
            <span className="font-display text-[22px] font-extrabold tabular-nums" dir="ltr">{fmtTime(remaining)}</span>
          </div>
          <div className="mb-5 flex items-center gap-3">
            <ProgressBar value={((idx + 1) / items.length) * 100} className="flex-1" />
            <span className="shrink-0 text-sm font-bold text-secondary-foreground"><bdi>{ad(idx + 1)} من {ad(items.length)}</bdi></span>
          </div>
          {current && (
            <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
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
              <h2 className="font-display text-[17px] font-semibold leading-8">{current.question}</h2>
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
                  <div>
                    <p className="font-display text-base font-semibold">خريطة الأسئلة</p>
                    <p className="text-[13px] text-secondary-foreground">
                      أجبت عن {ad(answeredCount)}، وبقي {ad(items.length - answeredCount)}، وعلّمت {ad(Object.values(flagged).filter(Boolean).length)} للمراجعة
                    </p>
                  </div>
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
                <RotateCcw className="h-4 w-4 max-[359px]:hidden" /> اختبار جديد
              </SecondaryButton>
              <PrimaryButton onClick={() => startQuiz({ mode: "redo", label: "التدرب على أخطاء الاختبار", qids: result.wrongQids })} className="flex-1">
                <Dumbbell className="h-4 w-4 max-[359px]:hidden" /> تدرّب على أخطائك
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
              <span className="font-display text-3xl font-bold text-foreground"><bdi dir="rtl">{ad(result.scorePct)}٪</bdi></span>
            </Ring>
            <Chip tone={result.passed ? "success" : "danger"} className="mt-4">
              {result.passed ? "ناجح" : "دون المحك"}
            </Chip>
            <p className="mt-3 text-base text-secondary-foreground">
              إجابات صحيحة: <bdi className="font-bold text-foreground">{ad(result.correctCount)} من {ad(result.total)}</bdi>
            </p>
            <p className="text-sm text-secondary-foreground">
              حد النجاح: <bdi dir="rtl">{ad(bp.passPct)}٪</bdi>
            </p>
            {answeredTotal === 0 && (
              <p className="mt-3 rounded-[14px] bg-muted px-3 py-2 text-sm leading-6 text-secondary-foreground">سُلّم الاختبار دون أي إجابة، فكل الأسئلة محسوبة خطأً. ابدأ اختبارًا جديدًا حين تكون مستعدًا.</p>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeader title="تحليل الأقسام" />
            <div className="space-y-4">
              {result.sections.map((x) => {
                const v = x.total ? Math.round((x.correct / x.total) * 100) : 0;
                return <SkillBar key={x.courseId} label={x.label} value={v} status={`${ad(x.correct)} من ${ad(x.total)} (${ad(v)}٪)`} tone={v >= bp.passPct ? "success" : "warning"} />;
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
      <Icon className="h-5 w-5 text-foreground" />
      <span className="font-display text-lg font-semibold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  );
}
