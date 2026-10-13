"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Lightbulb,
  BookOpen,
  Timer as TimerIcon,
  X,
  Brain,
  ArrowLeft,
  Trophy,
  Flag,
  Target,
  Award,
} from "lucide-react";
import { questionById, conceptById, examplesOf, OPTION_LETTERS, COURSES, COURSE_SHORT, shuffle } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi, type QuizConfig } from "@/lib/ui-store";
import { saveSnapshot, loadSnapshot, clearSnapshot, RESUME_FLAG } from "@/lib/session-snapshot";
import { buildSocraticSteps, type SocraticStep } from "@/lib/socratic";
import { ad, arCount, QUESTION_OBJ_FORMS, splitReason, splitArParagraphs } from "@/lib/arabic";
import SpeakButton from "./SpeakButton";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

// ---------- مكونات صغيرة ----------

// شارة النتيجة النوعية — بلا نسب ولا أرقام (قرار المستخدم: حذف الأرقام لا إخفاؤها)
function ResultBadge({ tone }: { tone: "great" | "good" | "fair" | "weak" }) {
  const toneCls =
    tone === "great"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "good"
        ? "bg-emerald-100 text-emerald-700"
        : tone === "fair"
          ? "bg-amber-100 text-amber-700"
          : "bg-red-100 text-red-600";
  const Icon = tone === "weak" ? XCircle : Trophy;
  return (
    <span className={`flex h-24 w-24 items-center justify-center rounded-full ${toneCls}`}>
      <Icon className="h-12 w-12" />
    </span>
  );
}

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
    <div
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
        danger ? "bg-red-100 text-red-700 pulse-ring" : "bg-secondary text-primary"
      }`}
    >
      <TimerIcon className="h-4 w-4" />
      <span dir="ltr">
        {ad(m)}:{ad(String(s).padStart(2, "0"))}
      </span>
    </div>
  );
}

function SocraticBox({ q }: { q: Question }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const steps: SocraticStep[] = useMemo(() => buildSocraticSteps(q), [q]);
  const done = stepIdx >= steps.length;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
          <Lightbulb className="h-4 w-4 text-amber-950" />
        </div>
        <p className="text-sm font-extrabold text-amber-900">المدرّب السقراطي — فكّر معي</p>
      </div>
      {!done ? (
        <div className="space-y-3">
          <p className="font-bold text-foreground">{steps[stepIdx].prompt}</p>
          {!showHint ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-amber-300 bg-white text-amber-900"
              onClick={() => setShowHint(true)}
            >
              <Brain className="ml-1 h-4 w-4" /> جرب أول نفسي
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <p className="rounded-xl border border-amber-200 bg-white p-3 text-sm leading-7 text-amber-950">
                {steps[stepIdx].hint}
              </p>
            </motion.div>
          )}
          {showHint && (
            <Button
              size="sm"
              className="rounded-full bg-amber-500 text-white hover:bg-amber-600"
              onClick={() => {
                setStepIdx((i) => i + 1);
                setShowHint(false);
              }}
            >
              {stepIdx + 1 < steps.length ? "سؤال تالٍ" : "فتح الإجابة الكاملة"}
              <ArrowLeft className="mr-1 h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <p className="text-sm leading-7 text-foreground">
            <span className="font-extrabold text-primary">الإجابة الصحيحة: </span>
            {q.correct}
          </p>
          <AcademicReason reason={q.reason} compact />
        </motion.div>
      )}
    </div>
  );
}

// لوحة «المفهوم وأمثلة مشابهة» — تظهر بعد الخطأ مباشرة (المحتوى من البنك حصراً — بلا تأليف)
function ConceptExamplesBox({ q }: { q: Question }) {
  const concept = conceptById(q.conceptId);
  const examples = useMemo(() => (concept ? examplesOf(concept).slice(0, 3) : []), [concept]);
  if (!concept) return null;
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
      <p className="mb-1.5 flex items-center gap-2 text-sm font-extrabold text-sky-900">
        <BookOpen className="h-4 w-4" /> المفهوم الذي خطأت فيه: {concept.title}
      </p>
      <div className="space-y-2">
        {splitArParagraphs(concept.explanation).map((p, i) => (
          <p key={i} className="text-sm leading-7 text-sky-950">{p}</p>
        ))}
      </div>
      {examples.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-black text-sky-800">
            <Lightbulb className="h-3.5 w-3.5" /> شواهد تطبيقية من الميدان
          </p>
          {examples.map((ex, i) => (
            <p
              key={i}
              className="rounded-xl border border-sky-100 bg-white p-3 text-xs leading-6 text-gray-700"
            >
              {ex}
            </p>
          ))}
        </div>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-sky-700">
        <Target className="h-3.5 w-3.5" /> سجلنا هذا الخطأ في صفحة «أخطائي» مع شرح المفهوم وأمثلته
      </p>
    </div>
  );
}

// التعليل الأكاديمي: أساس الصواب ثم موقف البدائل — كل شقّ بعنوانه
function AcademicReason({ reason, compact }: { reason: string; compact?: boolean }) {
  const { base, rest } = useMemo(() => splitReason(reason), [reason]);
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-primary/15 bg-violet-50/70 p-3">
        <p className={`font-black text-primary ${compact ? "text-[11px]" : "text-xs"}`}>أساس الصواب</p>
        <p className={`mt-1 leading-7 ${compact ? "text-[13px]" : "text-sm"} text-foreground/95`}>{base}</p>
      </div>
      {rest && (
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3">
          <p className={`font-black text-amber-800 ${compact ? "text-[11px]" : "text-xs"}`}>موقف البدائل</p>
          <p className={`mt-1 leading-7 ${compact ? "text-[13px]" : "text-sm"} text-amber-950/90`}>{rest}</p>
        </div>
      )}
    </div>
  );
}

function ReasonBox({ q }: { q: Question }) {
  const [open, setOpen] = useState(false);
  const concept = conceptById(q.conceptId);
  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-primary"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          التعليل ومصدر المفهوم
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2 overflow-hidden"
        >
          <AcademicReason reason={q.reason} />
          {concept && (
            <p className="rounded-xl bg-accent p-3 text-xs leading-6 text-primary">
              <span className="font-bold">المفهوم: </span>
              {concept.title} — {concept.chapter}
            </p>
          )}
        </motion.div>
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
  const [review, setReview] = useState<{ qid: string; ok: boolean }[]>(resumed?.review ?? []);
  const startedAt = useRef(Date.now());

  const questions = useMemo(
    () => config.qids.map((id) => questionById(id)).filter(Boolean) as Question[],
    [config.qids]
  );
  const q = questions[idx];
  const instantFeedback = config.mode !== "exam" && config.mode !== "proficiency";
  const concept = q ? conceptById(q.conceptId) : undefined;
  // خلط ترتيب خيارات المقالي بثبات لكل سؤال — لا يُخلط صح/خطأ (أيقوناته دلالية)
  const mcqOpts = useMemo(() => (q && q.type === "mcq" ? shuffle(q.options) : []), [q]);

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
    }
  }, [finished, recorded, review, sessionXp, config, questions.length, finishSession]);

  // حفظ لقطة الجلسة بعد كل سؤال — تُستأنف من مركز الاختبارات عند العودة
  useEffect(() => {
    if (finished || questions.length === 0) return;
    saveSnapshot({ config, idx, review, sessionXp });
  }, [finished, config, idx, review, sessionXp, questions.length]);

  if (questions.length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <Brain className="h-14 w-14 text-primary" />
        <h2 className="text-xl font-black">لا توجد أسئلة في هذه الجلسة</h2>
        <p className="text-sm text-muted-foreground">
          {config.mode === "review"
            ? "لا توجد أسئلة مستحقة للمراجعة الآن — أنجز تدريباً جديداً وستظهر المراجعة المتباعدة لاحقاً."
            : "جرّب نمطاً آخر من شاشة الاختبار."}
        </p>
        <Button onClick={clearQuiz} className="rounded-full bg-primary px-8 text-primary-foreground">
          رجوع
        </Button>
      </div>
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
    setReview((r) => [...r, { qid: q.id, ok }]);
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
    const pct = (correctCount / questions.length) * 100;
    const isProficiency = config.mode === "proficiency";
    const passed = pct >= 60;
    const msg =
      pct === 100
        ? "إتقان كامل! أنت أسطورة"
        : pct >= 80
          ? "أداء ممتاز، استمر!"
          : pct >= 50
            ? "جيد — راجع أخطائك وستتحسن"
            : "لا بأس، التوجيه بعد الخطأ طريق الإتقان";
    const tone: "great" | "good" | "fair" | "weak" =
      pct === 100 ? "great" : pct >= 80 ? "good" : pct >= 50 ? "fair" : "weak";
    return (
      <div className="flex h-dvh flex-col bg-background">
        <div className="safe-top flex items-center justify-between px-4 pb-2">
          <p className="text-lg font-black text-primary">النتيجة</p>
          <button onClick={clearQuiz} className="rounded-full bg-muted p-2" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
          <div className="pop-in flex flex-col items-center gap-3 py-4">
            <ResultBadge tone={tone} />
            <h2 className="text-xl font-black">{msg}</h2>
            {review.length < questions.length && (
              <p className="rounded-2xl bg-red-50 px-4 py-2 text-xs font-bold leading-6 text-red-700">
                لم تُجب عن بعض الأسئلة قبل انتهاء الوقت — احتُسبت خطأً كالامتحان الحقيقي.
              </p>
            )}
          </div>

          {/* خطاب اختبار الكفاءة — نجاح أو رسوب مع تفصيل المحاور */}
          {isProficiency && (
            <div
              className={`pop-in rounded-3xl border-2 p-4 ${
                passed ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {passed ? (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Award className="h-6 w-6" />
                  </span>
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white">
                    <XCircle className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className={`text-base font-black ${passed ? "text-emerald-800" : "text-red-800"}`}>
                    {passed ? "نجحت في اختبار الكفاءة" : "لم تنجح هذه المرة — وسبيلك واضح"}
                  </p>
                  <p className="text-xs font-bold leading-6 text-muted-foreground">
                    أجبت صوابًا عن {arCount(correctCount, QUESTION_OBJ_FORMS)} من {ad(questions.length)} — وعتبة
                    النجاح ستون بالمئة كما في الاختبارات الحقيقية.
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs font-black text-foreground">خطابك على المحاور:</p>
              <div className="mt-2 space-y-2">
                {courseRows.map((row) => {
                  const rowPct = row.total > 0 ? row.ok / row.total : 0;
                  return (
                    <div key={row.id}>
                      <div className="mb-1 flex items-center justify-between text-[11px] font-black">
                        <span>{row.name}</span>
                        <span
                          className={
                            rowPct >= 0.6
                              ? "text-emerald-700"
                              : rowPct >= 0.4
                                ? "text-amber-700"
                                : "text-red-600"
                          }
                        >
                          {ad(row.ok)} من {ad(row.total)}
                        </span>
                      </div>
                      <div className="progress-track h-2">
                        <div className="progress-fill h-full" style={{ width: `${rowPct * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 rounded-xl bg-white/80 p-3 text-[11px] font-bold leading-6 text-foreground">
                {passed
                  ? "أنت الآن قادر على اجتياز هذا المستوى من الكفاءة — راجع المحاور الأضعف في الخطاب أعلاه لتثبيت الأفضلية."
                  : "ركّز مذاكرتك على المحاور الأدنى في الخطاب أعلاه: تدريب حسب المحور ثم المراجعة الذكية — ثم عد لاختبار الكفاءة من جديد."}
              </p>
            </div>
          )}
          <p className="mb-2 mt-4 px-1 text-sm font-extrabold text-muted-foreground">
            مراجعة الأسئلة — اضغط لعرض التفسير
          </p>
          <div className="space-y-2">
            {review.map((r) => {
              const rq = questionById(r.qid)!;
              return (
                <details key={r.qid} className="card-soft rounded-2xl border border-border bg-white p-4">
                  <summary className="flex cursor-pointer list-none items-start gap-3">
                    {r.ok ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <span className="text-sm font-bold leading-6">{rq.question}</span>
                  </summary>
                  {!r.ok && (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                      الإجابة الصحيحة: {rq.correct}
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    <span className="font-black text-primary/80">التعليل: </span>
                    {rq.reason}
                  </p>
                </details>
              );
            })}
          </div>
        </div>
        <div className="safe-bottom border-t border-border bg-white px-4 pt-3">
          <Button
            onClick={clearQuiz}
            className="h-14 w-full rounded-2xl bg-primary text-lg font-black text-primary-foreground"
          >
            <Trophy className="ml-2 h-5 w-5" /> متابعة رحلة التعلم
          </Button>
        </div>
      </div>
    );
  }

  // ---------- شاشة السؤال ----------
  const progress = (idx / questions.length) * 100;

  return (
    <div className="tap-none flex h-dvh flex-col bg-background">
      {/* رأس الجلسة */}
      <div className="safe-top px-4 pb-2 pt-2">
        <div className="mb-2 flex items-center gap-3">
          <button onClick={exit} className="rounded-full p-1.5 text-muted-foreground" aria-label="خروج">
            <X className="h-6 w-6" />
          </button>
          <div className="progress-track h-3.5 flex-1">
            <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
          </div>
          {config.timeLimitSec ? (
            <Timer seconds={config.timeLimitSec} onTimeout={() => setFinished(true)} />
          ) : (
            <span className="h-8" aria-hidden />
          )}
        </div>
        <p className="text-center text-xs font-bold text-muted-foreground">{config.label}</p>
      </div>

      {/* جسم السؤال */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
                {q.type === "mcq" ? "اختيار من متعدد" : "صح أم خطأ"}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  q.difficulty === "سهل"
                    ? "bg-emerald-100 text-emerald-700"
                    : q.difficulty === "متوسط"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {q.difficulty}
              </span>
              {concept && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {concept.title}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-extrabold leading-9">{q.question}</h2>
              <SpeakButton text={q.question} label="استمع إلى السؤال" tone="sky" />
            </div>

            {q.type === "tf" ? (
              <div className="grid grid-cols-2 gap-3">
                {[q.options[0], q.options[1]].map((o, i) => {
                  const isSel = selected === o.text;
                  const isCorrect = o.isCorrect;
                  // كشف الصواب/الخطأ فقط في الأنماط ذات التغذية الفورية — المحاكاة لا تكشف الإجابة
                  let cls = "border-border bg-white";
                  if (instantFeedback && graded !== null && isCorrect) cls = "border-emerald-500 bg-emerald-50";
                  else if (instantFeedback && graded === false && isSel) cls = "border-red-400 bg-red-50";
                  else if (isSel) cls = "border-primary bg-accent shadow-sm";
                  return (
                    <button
                      key={i}
                      disabled={graded !== null}
                      onClick={() => setSelected(o.text)}
                      className={`opt-btn flex h-20 items-center justify-center gap-2 rounded-2xl border-2 text-xl font-black ${cls} ${
                        wrongShake && isSel && instantFeedback ? "shake" : ""
                      }`}
                    >
                      {o.text === "صح" ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      {o.text}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {mcqOpts.map((o, i) => {
                  const isSel = selected === o.text;
                  const isCorrect = o.isCorrect;
                  // كشف الصواب/الخطأ فقط في الأنماط ذات التغذية الفورية — المحاكاة لا تكشف الإجابة
                  let cls = "border-border bg-white";
                  if (instantFeedback && graded !== null && isCorrect) cls = "border-emerald-500 bg-emerald-50";
                  else if (instantFeedback && graded === false && isSel) cls = "border-red-400 bg-red-50";
                  else if (isSel) cls = "border-primary bg-accent shadow-sm";
                  return (
                    <button
                      key={i}
                      disabled={graded !== null}
                      onClick={() => setSelected(o.text)}
                      className={`opt-btn flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-right ${cls} ${
                        wrongShake && isSel && instantFeedback ? "shake" : ""
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black ${
                          isSel ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
                        }`}
                      >
                        {OPTION_LETTERS[i]}
                      </span>
                      <span className="text-base font-bold leading-7">{o.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* التغذية الراجعة الفورية */}
            <AnimatePresence>
              {graded !== null && instantFeedback && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div
                    className={`flex items-center gap-3 rounded-2xl border p-4 ${
                      graded ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    {graded ? (
                      <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="h-8 w-8 shrink-0 text-red-500" />
                    )}
                    <div>
                      <p className={`font-black ${graded ? "text-emerald-800" : "text-red-700"}`}>
                        {graded ? "أحسنت! إجابة صحيحة" : "إجابة غير صحيحة"}
                      </p>
                      {!graded && (
                        <p className="text-sm text-red-600">
                          الإجابة الصحيحة: <b>{q.correct}</b>
                        </p>
                      )}
                    </div>
                  </div>

                  {!graded && (
                    <>
                      <button
                        onClick={() => setSocratic((s) => !s)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-amber-300 bg-amber-50 py-3 text-sm font-black text-amber-900"
                      >
                        <Lightbulb className="h-4 w-4" />
                        {socratic ? "إخفاء المدرّب" : "لا تفهم فقط — افهم لماذا (توجيه سقراطي)"}
                      </button>
                      {socratic && <SocraticBox q={q} />}
                      {!socratic && <ReasonBox q={q} />}
                      <ConceptExamplesBox q={q} />
                    </>
                  )}
                  {graded && <ReasonBox q={q} />}

                  {/* زر أبلغ عن خطأ داخل منطقة الشرح بعد الإجابة (نقد البند 11) */}
                  {reported ? (
                    <span className="flex items-center gap-1.5 self-start rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                      <Flag className="h-3.5 w-3.5" /> تم الإبلاغ عن هذا السؤال
                    </span>
                  ) : (
                    <button
                      onClick={handleReport}
                      className="flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Flag className="h-3.5 w-3.5" /> أبلغ عن خطأ
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* زر التحقق/التالي */}
      <div className="safe-bottom border-t border-border bg-white px-4 pt-3">
        {graded === null ? (
          <Button
            disabled={selected === null}
            onClick={grade}
            className="h-14 w-full rounded-2xl bg-primary text-lg font-black text-primary-foreground disabled:opacity-40"
          >
            {instantFeedback ? "تحقق" : "تأكيد الاختيار"}
          </Button>
        ) : (
          <Button
            onClick={next}
            className={`h-14 w-full rounded-2xl text-lg font-black ${
              !instantFeedback
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : graded
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-500 text-white"
            }`}
          >
            {idx + 1 >= questions.length ? "عرض النتيجة" : "متابعة"}
          </Button>
        )}
      </div>

      {/* تأكيد الخروج */}
      <AlertDialog open={exiting} onOpenChange={setExiting}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>الخروج من الجلسة؟</AlertDialogTitle>
            <AlertDialogDescription>
              تقدمك في هذه الجلسة سيُهدر — وأخطاؤك تبقى محفوظة في صفحة «أخطائي» مع شرح المفهوم
              وأمثلته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">متابعة الجلسة</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-red-500 hover:bg-red-600"
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
    </div>
  );
}
