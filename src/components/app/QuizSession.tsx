"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronDown, Lightbulb, BookOpen, Timer as TimerIcon, Brain, ArrowLeft, Flag, Target, Gem } from "lucide-react";
import { questionById, conceptById, examplesOf, OPTION_LETTERS, COURSES, COURSE_SHORT, shuffle } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi, type QuizConfig } from "@/lib/ui-store";
import { saveSnapshot, loadSnapshot, clearSnapshot, RESUME_FLAG } from "@/lib/session-snapshot";
import { buildSocraticSteps, type SocraticStep } from "@/lib/socratic";
import { ad, arCount, QUESTION_OBJ_FORMS, splitReason, splitArParagraphs } from "@/lib/arabic";
import SpeakButton from "./SpeakButton";
import { toast } from "@/hooks/use-toast";
import { Callout, Card, Chip, Divided, EmptyState, OptionButton, PrimaryButton, ProgressBar, Ring, ScreenShell, SecondaryButton, SectionHeader, SkillBar, pct } from "./ui-kit";
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
import type { Question } from "@/lib/types";
import { recordMistake, recordReviewResult, MISTAKES_QUERY_KEY } from "@/lib/mistakes-client";
import { completeSession, USER_QUERY_KEY } from "@/lib/account-client";

// ---------- مكونات صغيرة ----------

function Timer({ seconds, onTimeout }: { seconds: number; onTimeout: () => void }) {
  const [left, setLeft] = useState(seconds);
  const firedRef = useRef(false);
  useEffect(() => {
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!firedRef.current) {
            firedRef.current = true;
            onTimeout();
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(left / 60);
  const s = left % 60;
  const danger = left <= 60;
  return (
    <span
      role="timer"
      aria-label="الوقت المتبقي"
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium tabular-nums ${
        danger ? "bg-danger-soft text-destructive" : "bg-muted text-secondary-foreground"
      }`}
    >
      <TimerIcon className="h-4 w-4" />
      <span dir="ltr">
        {ad(m)}:{ad(String(s).padStart(2, "0"))}
      </span>
    </span>
  );
}

// المدرّب السقراطي: أسئلة متدرجة تقود إلى الفهم قبل كشف الإجابة الكاملة
function SocraticBox({ q }: { q: Question }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const steps: SocraticStep[] = useMemo(() => buildSocraticSteps(q), [q]);
  const done = stepIdx >= steps.length;

  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Brain className="h-4 w-4 text-primary" /> فكّر خطوة بخطوة
        {!done && <span className="mr-auto text-xs font-normal text-muted-foreground">{ad(stepIdx + 1)} من {ad(steps.length)}</span>}
      </p>
      {!done ? (
        <div className="mt-3 space-y-3">
          <p className="text-[15px] leading-7">{steps[stepIdx].prompt}</p>
          {showHint && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-muted p-3 text-sm leading-7 text-secondary-foreground">
              {steps[stepIdx].hint}
            </motion.p>
          )}
          {!showHint ? (
            <SecondaryButton onClick={() => setShowHint(true)} className="h-10 text-sm">
              أظهر التلميح
            </SecondaryButton>
          ) : (
            <SecondaryButton
              onClick={() => {
                setStepIdx((i) => i + 1);
                setShowHint(false);
              }}
              className="h-10 text-sm"
            >
              {stepIdx + 1 < steps.length ? "الخطوة التالية" : "الإجابة الكاملة"} <ArrowLeft className="h-4 w-4" />
            </SecondaryButton>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <AcademicReason reason={q.reason} />
        </div>
      )}
    </Card>
  );
}

// المفهوم الذي يقوم عليه السؤال وأمثلة من الميدان (من البنك حصرًا)
function ConceptExamplesBox({ q }: { q: Question }) {
  const concept = conceptById(q.conceptId);
  const examples = useMemo(() => (concept ? examplesOf(concept).slice(0, 3) : []), [concept]);
  if (!concept) return null;
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <BookOpen className="h-4 w-4 text-primary" /> المفهوم: {concept.title}
      </p>
      <div className="mt-2 space-y-2">
        {splitArParagraphs(concept.explanation).map((p, i) => (
          <p key={i} className="text-sm leading-7 text-secondary-foreground">{p}</p>
        ))}
      </div>
      {examples.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4 text-gem" /> أمثلة من الميدان
          </p>
          {examples.map((ex, i) => (
            <p key={i} className="rounded-lg bg-muted p-3 text-sm leading-7 text-secondary-foreground">
              {ex}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

// الشرح: سبب صحة الإجابة، ثم لماذا البدائل خاطئة
function AcademicReason({ reason }: { reason: string }) {
  const { base, rest } = useMemo(() => splitReason(reason), [reason]);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-semibold text-primary">لماذا هذه الإجابة صحيحة</p>
        <p className="mt-1 text-[15px] leading-8">{base}</p>
      </div>
      {rest && (
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground">لماذا البدائل الأخرى خاطئة</p>
          <p className="mt-1 text-[15px] leading-8 text-secondary-foreground">{rest}</p>
        </div>
      )}
    </div>
  );
}

// ---------- الجلسة الرئيسية ----------

export default function QuizSession({ config }: { config: QuizConfig }) {
  const clearQuiz = useUi((s) => s.clearQuiz);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);
  const attempts = useApp((s) => s.attempts);
  const reportedQuestions = useApp((s) => s.reportedQuestions);
  const reportQuestion = useApp((s) => s.reportQuestion);

  // استئناف جلسة مقطوعة — يُفعّل فقط عند الضغط على «أكمل جلستك» في مركز الاختبارات
  const resumed = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      if (sessionStorage.getItem(RESUME_FLAG) !== "1") return null;
      sessionStorage.removeItem(RESUME_FLAG);
    } catch {
      return null;
    }
    const snap = loadSnapshot();
    if (!snap) return null;
    if (snap.config.label !== config.label || snap.config.qids.length !== config.qids.length)
      return null;
    return snap;
  }, [config]);

  const [idx, setIdx] = useState(resumed?.idx ?? 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [socratic, setSocratic] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);
  const [sessionXp, setSessionXp] = useState(resumed?.sessionXp ?? 0);
  const [review, setReview] = useState<{ qid: string; ok: boolean; answer?: string }[]>(resumed?.review ?? []);
  const [gemsEarned, setGemsEarned] = useState<number | null>(null);
  const startedAt = useRef(Date.now());
  const sessionId = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const queryClient = useQueryClient();
  const recordBest = useApp((s) => s.recordBest);

  const questions = useMemo(
    () => config.qids.map((id) => questionById(id)).filter(Boolean) as Question[],
    [config.qids]
  );
  const q = questions[idx];
  const instantFeedback = config.mode !== "exam" && config.mode !== "proficiency";
  const concept = q ? conceptById(q.conceptId) : undefined;
  // خلط ترتيب خيارات المقالي بثبات لكل سؤال — لا يُخلط صح/خطأ (أيقوناته دلالية)
  // الأسئلة الموسومة fixedOrder يشير شرحها إلى الخيارات بترتيبها («الخيار الثاني…») فتبقى بترتيبها
  const mcqOpts = useMemo(
    () => (q && q.type === "mcq" ? (q.fixedOrder ? q.options : shuffle(q.options)) : []),
    [q]
  );

  // خطاب اختبار الكفاءة — تفصيل النتيجة على المحاور (ميزة «ي» في بحث مشاكل الطلبة)
  // محسوب دائمًا بلا شرط — قواعد الخطافات تمنع الاستدعاء الشرطي
  const courseRows = useMemo(() => {
    const m = new Map<string, { ok: number; total: number }>();
    for (const r of review) {
      const rq = questionById(r.qid);
      if (!rq) continue;
      const rc = conceptById(rq.conceptId);
      if (!rc) continue;
      const row = m.get(rc.courseId) ?? { ok: 0, total: 0 };
      row.total++;
      if (r.ok) row.ok++;
      m.set(rc.courseId, row);
    }
    return COURSES.map((c) => ({
      id: c.id,
      name: COURSE_SHORT[c.id] ?? c.name,
      ...(m.get(c.id) ?? { ok: 0, total: 0 }),
    })).filter((r) => r.total > 0);
  }, [review]);

  // عند انتهاء الجلسة: تسجيل النقاط مرة واحدة
  useEffect(() => {
    if (finished && !recorded) {
      setRecorded(true);
      const correctCount = review.filter((r) => r.ok).length;
      const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
      finishSession({
        mode: config.mode,
        label: config.label,
        total: questions.length,
        correctCount,
        xp: sessionXp,
        durationSec,
      });
      clearSnapshot(); // انتهت الجلسة — لا لقطة للاستئناف
      // أفضل نتيجة للموضوع (نجوم الفصل أو نسبة الاختبار)، ثم جواهر الجلسة
      if (config.topicKey && questions.length > 0) recordBest(config.topicKey, (correctCount / questions.length) * 100);
      const answers = review.filter((r) => r.answer !== undefined).map((r) => ({ qid: r.qid, answer: r.answer as string }));
      if (answers.length > 0) {
        completeSession(queryClient, config.mode === "review" ? "review" : "practice", sessionId.current, answers, correctCount).then(setGemsEarned);
      }
      if (config.mode === "review") queryClient.invalidateQueries({ queryKey: MISTAKES_QUERY_KEY });
    }
  }, [finished, recorded, review, sessionXp, config, questions.length, finishSession]);

  // حفظ لقطة الجلسة بعد كل سؤال — تُستأنف من مركز الاختبارات عند العودة
  useEffect(() => {
    if (finished || questions.length === 0) return;
    saveSnapshot({ config, idx, review, sessionXp });
  }, [finished, config, idx, review, sessionXp, questions.length]);

  if (questions.length === 0) {
    return (
      <ScreenShell title={config.label} onClose={clearQuiz}>
        <EmptyState
          icon={Brain}
          title="لا توجد أسئلة في هذه الجلسة"
          sub={config.mode === "review" ? "لا مراجعة مستحقة الآن. تدرّب وستظهر المراجعة المتباعدة لاحقًا." : "جرّب نمطًا آخر من صفحة التدريب."}
          action={<PrimaryButton onClick={clearQuiz}>رجوع</PrimaryButton>}
        />
      </ScreenShell>
    );
  }

  const grade = () => {
    if (!q || selected === null) return;
    const ok = selected === q.correct;
    setGraded(ok);
    // اهتزاز لطيف يؤكد القرار لمسيًا — نجاح قصير واحد، خطأ نبضتان متقطعتان (ويحترم مفتاح الإعدادات)
    try {
      if ("vibrate" in navigator && useApp.getState().haptics)
        navigator.vibrate(ok ? 35 : [60, 40, 60]);
    } catch {}
    if (!ok) setWrongShake(true);
    setTimeout(() => setWrongShake(false), 450);
    recordAttempt(q.id, ok, selected ?? undefined);
    // الأخطاء: في المراجعة تُرسل النتيجة صحيحة أو خاطئة، وفي غيرها يُسجَّل الخطأ وحده
    if (config.mode === "review") {
      const isGuest = !queryClient.getQueryData(USER_QUERY_KEY);
      recordReviewResult(q.id, ok, selected, isGuest);
    } else if (!ok) {
      recordMistake(q.id, selected, queryClient);
    }
    const wasUnseen = !attempts[q.id];
    const gain = ok
      ? wasUnseen
        ? q.difficulty === "صعب"
          ? 15
          : q.difficulty === "متوسط"
            ? 10
            : 8
        : 6
      : 0;
    setSessionXp((x) => x + gain);
    setReview((r) => [...r, { qid: q.id, ok, answer: selected }]);
  };

  const next = () => {
    setSelected(null);
    setGraded(null);
    setSocratic(false);
    if (idx + 1 >= questions.length) {
      const correctCount = review.filter((r) => r.ok).length;
      if (config.mode === "exam" && correctCount === questions.length) {
        setSessionXp((x) => x + 30);
      } else if (config.mode === "proficiency" && correctCount / questions.length >= 0.6) {
        setSessionXp((x) => x + 50); // مكافأة النجاح في وضع الكفاءة الصارم
      } else if (correctCount === questions.length && questions.length >= 5) {
        setSessionXp((x) => x + 20);
      }
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const exit = () => {
    if (finished || review.length === 0) {
      clearSnapshot(); // خروج صريح بلا تقدم ذي به — لا استئناف
      clearQuiz();
    } else {
      setExiting(true);
    }
  };

  // زر «أبلغ عن خطأ» — يُحفظ معرف السؤال محليًا ويختفي الزر للسؤال المبلّغ عنه
  const reported = q ? reportedQuestions.includes(q.id) : false;
  const handleReport = () => {
    if (!q || reported) return;
    reportQuestion(q.id);
    toast({ title: "شكرًا — سيُراجع السؤال" });
  };

  // ---------- شاشة النتائج ----------
  if (finished) {
    const correctCount = review.filter((r) => r.ok).length;
    const pctV = (correctCount / questions.length) * 100;
    const isProficiency = config.mode === "proficiency";
    const passed = pctV >= 60;
    const wrong = review.filter((r) => !r.ok);
    const msg =
      pctV === 100 ? "إتقان كامل" : pctV >= 80 ? "أداء ممتاز" : pctV >= 50 ? "أداء جيد، وراجع أخطاءك" : "الخطأ بداية الفهم، راجع الشرح";
    return (
      <ScreenShell
        title="نتيجة الجلسة"
        sub={config.label}
        onClose={clearQuiz}
        footer={
          <PrimaryButton onClick={clearQuiz} className="w-full">
            متابعة
          </PrimaryButton>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center pt-2 text-center">
            <Ring value={pctV} size={128} stroke={10}>
              <span className="font-display text-3xl font-bold">{pct(pctV)}</span>
            </Ring>
            <h2 className="mt-4 font-display text-xl font-bold">{isProficiency ? (passed ? "اجتزت اختبار الكفاءة" : "لم تجتز هذه المرة") : msg}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ad(correctCount)} صحيحة من {ad(questions.length)}
            </p>
            {gemsEarned !== null && gemsEarned > 0 && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gem-soft px-3 py-1.5 text-sm font-medium text-gem">
                <Gem className="h-4 w-4" /> {ad(gemsEarned)}+ جوهرة
              </span>
            )}
          </div>

          {review.length < questions.length && (
            <Callout tone="warning" icon={TimerIcon} title="انتهى الوقت">
              الأسئلة التي لم تُجب عنها احتُسبت خطأً كما في الاختبار الحقيقي.
            </Callout>
          )}

          {isProficiency && (
            <section>
              <SectionHeader title="الأداء حسب المحور" sub={`أجبت صوابًا عن ${arCount(correctCount, QUESTION_OBJ_FORMS)}، وعتبة النجاح ٦٠٪`} />
              <Card className="space-y-4 p-4">
                {courseRows.map((row) => {
                  const v = row.total > 0 ? (row.ok / row.total) * 100 : 0;
                  return <SkillBar key={row.id} label={row.name} value={v} status={`${ad(row.ok)} من ${ad(row.total)}`} tone={v >= 60 ? "success" : v >= 40 ? "warning" : "danger"} />;
                })}
              </Card>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {passed ? "راجع المحاور الأضعف لتثبيت مستواك." : "ركّز على المحاور الأدنى بالتدريب حسب المحور، ثم أعد الاختبار."}
              </p>
            </section>
          )}

          <section>
            <SectionHeader title="مراجعة الأسئلة" sub={wrong.length > 0 ? `${arCount(wrong.length, QUESTION_OBJ_FORMS)} أُضيفت إلى «أخطائي»` : undefined} />
            <Divided>
              {review.map((r) => {
                const rq = questionById(r.qid)!;
                return (
                  <details key={r.qid} className="group">
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 hover:bg-muted/60">
                      {r.ok ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />}
                      <span className="min-w-0 flex-1 text-[15px] leading-7">{rq.question}</span>
                      <ChevronDown className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3 px-4 pb-4 pr-12">
                      {!r.ok && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">الإجابة الصحيحة: </span>
                          <span className="font-medium text-success">{rq.correct}</span>
                        </p>
                      )}
                      <AcademicReason reason={rq.reason} />
                    </div>
                  </details>
                );
              })}
            </Divided>
          </section>
        </div>
      </ScreenShell>
    );
  }

  // ---------- شاشة السؤال ----------
  const answered = graded !== null;
  const optState = (o: { text: string; isCorrect: boolean }): "idle" | "selected" | "correct" | "wrong" | "dim" => {
    const isSel = selected === o.text;
    // كشف الصواب والخطأ في الأنماط ذات التغذية الفورية فقط، والمحاكاة لا تكشف الإجابة
    if (!answered || !instantFeedback) return isSel ? "selected" : "idle";
    if (o.isCorrect) return "correct";
    if (isSel) return "wrong";
    return "dim";
  };

  return (
    <ScreenShell
      title={config.label}
      sub={`السؤال ${ad(idx + 1)} من ${ad(questions.length)}`}
      onClose={exit}
      actions={config.timeLimitSec ? <Timer seconds={config.timeLimitSec} onTimeout={() => setFinished(true)} /> : undefined}
      footer={
        graded === null ? (
          <PrimaryButton disabled={selected === null} onClick={grade} className="w-full">
            {instantFeedback ? "تحقّق" : "تأكيد الإجابة"}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={next} className="w-full">
            {idx + 1 >= questions.length ? "عرض النتيجة" : "السؤال التالي"} <ArrowLeft className="h-4 w-4" />
          </PrimaryButton>
        )
      }
    >
      <ProgressBar value={((idx + (answered ? 1 : 0)) / questions.length) * 100} className="mb-5" />
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`space-y-5 ${wrongShake && instantFeedback ? "shake" : ""}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={q.difficulty === "سهل" ? "success" : q.difficulty === "متوسط" ? "warning" : "danger"}>{q.difficulty}</Chip>
            {concept && <Chip>{concept.title}</Chip>}
          </div>

          <div className="flex items-start gap-2">
            <h2 className="min-w-0 flex-1 font-display text-lg font-semibold leading-9 sm:text-xl">{q.question}</h2>
            <SpeakButton text={q.question} label="استمع إلى السؤال" />
          </div>

          {q.type === "tf" ? (
            <div className="grid grid-cols-2 gap-3">
              {[q.options[0], q.options[1]].map((o, i) => (
                <OptionButton key={i} state={optState(o)} disabled={answered} onClick={() => setSelected(o.text)}>
                  <span className="block text-center font-medium">{o.text}</span>
                </OptionButton>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {mcqOpts.map((o, i) => (
                <OptionButton key={i} letter={OPTION_LETTERS[i]} state={optState(o)} disabled={answered} onClick={() => setSelected(o.text)}>
                  {o.text}
                </OptionButton>
              ))}
            </div>
          )}

          {/* التغذية الراجعة الفورية والشرح */}
          {answered && instantFeedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Callout tone={graded ? "success" : "danger"} icon={graded ? CheckCircle2 : XCircle} title={graded ? "إجابة صحيحة" : "إجابة غير صحيحة"}>
                {!graded && (
                  <>
                    الإجابة الصحيحة: <b>{q.correct}</b>
                  </>
                )}
              </Callout>

              <Card className="p-4">
                <AcademicReason reason={q.reason} />
              </Card>

              {!graded && (
                <>
                  {socratic ? (
                    <SocraticBox q={q} />
                  ) : (
                    <SecondaryButton onClick={() => setSocratic(true)} className="w-full">
                      <Brain className="h-4 w-4" /> فكّر معي خطوة بخطوة
                    </SecondaryButton>
                  )}
                  <ConceptExamplesBox q={q} />
                  <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Target className="h-4 w-4" /> أُضيف السؤال إلى «أخطائي» لمراجعته لاحقًا
                  </p>
                </>
              )}

              {reported ? (
                <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Flag className="h-4 w-4" /> أُبلغ عن هذا السؤال
                </p>
              ) : (
                <button type="button" onClick={handleReport} className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
                  <Flag className="h-4 w-4" /> أبلغ عن خطأ في السؤال
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* تأكيد الخروج */}
      <AlertDialog open={exiting} onOpenChange={setExiting}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>الخروج من الجلسة؟</AlertDialogTitle>
            <AlertDialogDescription>لن تُحتسب هذه الجلسة، وتبقى أخطاؤك محفوظة في «أخطائي».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>متابعة الجلسة</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                clearSnapshot();
                clearQuiz();
              }}
            >
              خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenShell>
  );
}
