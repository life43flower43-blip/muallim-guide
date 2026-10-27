"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, CheckCircle2, XCircle, ChevronDown, Lightbulb, BookOpen, Timer as TimerIcon, Brain, Flag, Gem, RotateCcw } from "lucide-react";
import { questionById, conceptById, COURSES, COURSE_SHORT, shuffle } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi, type QuizConfig } from "@/lib/ui-store";
import { saveSnapshot, loadSnapshot, clearSnapshot, RESUME_FLAG, type Confidence } from "@/lib/session-snapshot";
import { ad, arCount, QUESTION_OBJ_FORMS, splitReason } from "@/lib/arabic";
import { ConceptReader } from "./ConceptsView";
import { toast } from "@/hooks/use-toast";
import { Callout, Card, Divided, EmptyState, PrimaryButton, Ring, ScreenShell, SecondaryButton, SectionHeader, SkillBar, pct } from "./ui-kit";
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
import { pingStudied } from "@/lib/push-client";

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

// الشرح: سبب صحة الإجابة، ثم لماذا البدائل خاطئة
function AcademicReason({ reason }: { reason: string }) {
  const { base, rest } = useMemo(() => splitReason(reason), [reason]);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-primary">لماذا هذه الإجابة صحيحة</p>
        <p className="mt-1 text-base leading-8">{base}</p>
      </div>
      {rest && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground">لماذا البدائل الأخرى خاطئة</p>
          <p className="mt-1 text-base leading-8 text-secondary-foreground">{rest}</p>
        </div>
      )}
    </div>
  );
}

// ---------- الجلسة الرئيسية ----------
// أنماط منصات بنوك الأسئلة العالمية (UWorld وKaplan):
// - استبعاد الخيارات بشطبها، وتحديد الثقة بالإجابة قبل التحقق.
// - اختصارات لوحة المفاتيح، وزمن كل سؤال.
// - الشرح بجوار السؤال على الشاشات الواسعة، وفتح المفهوم دون مغادرة الجلسة.
// - تقرير نتيجة يحلل الدقة حسب الفصل والثقة والزمن.

type ReviewItem = { qid: string; ok: boolean; answer?: string; sec?: number; conf?: Confidence };

const CONF_OPTIONS: { id: Confidence; label: string }[] = [
  { id: "sure", label: "متأكد" },
  { id: "unsure", label: "متردد" },
  { id: "guess", label: "أخمّن" },
];
const CONF_LABEL: Record<Confidence, string> = { sure: "متأكد", unsure: "متردد", guess: "تخمين" };

const PRAISE = ["أحسنت!", "رائع!", "ممتاز!", "إجابة صحيحة!", "عمل جيد!"];
const KEY_INDEX: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, "١": 0, "٢": 1, "٣": 2, "٤": 3, "أ": 0, "ب": 1, "ج": 2, "د": 3 };

/** «٤٢ ث» أو «٣:٠٥ د» */
const fmtSec = (s: number) => (s < 60 ? `${ad(s)} ث` : `${ad(Math.floor(s / 60))}:${ad(String(s % 60).padStart(2, "0"))} د`);

const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export default function QuizSession({ config }: { config: QuizConfig }) {
  const clearQuiz = useUi((s) => s.clearQuiz);
  const startQuiz = useUi((s) => s.startQuiz);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);
  const attempts = useApp((s) => s.attempts);
  const reportedQuestions = useApp((s) => s.reportedQuestions);
  const reportQuestion = useApp((s) => s.reportQuestion);
  const recordBest = useApp((s) => s.recordBest);
  const queryClient = useQueryClient();

  // استئناف جلسة مقطوعة — يُفعّل فقط عند الضغط على «أكمل جلستك»
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
    if (snap.config.label !== config.label || snap.config.qids.length !== config.qids.length) return null;
    return snap;
  }, [config]);

  const [idx, setIdx] = useState(resumed?.idx ?? 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [conf, setConf] = useState<Confidence | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);
  const [sessionXp, setSessionXp] = useState(resumed?.sessionXp ?? 0);
  const [review, setReview] = useState<ReviewItem[]>(resumed?.review ?? []);
  const [gemsEarned, setGemsEarned] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "wrong" | "unsure">("all");
  const startedAt = useRef(Date.now());
  const qStartedAt = useRef(Date.now());
  const sessionId = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const questions = useMemo(() => config.qids.map((id) => questionById(id)).filter(Boolean) as Question[], [config.qids]);
  const q = questions[idx];
  const instantFeedback = config.mode !== "exam" && config.mode !== "proficiency";
  const concept = q ? conceptById(q.conceptId) : undefined;
  // خلط خيارات الاختيار من متعدد بثبات لكل سؤال، إلا ما يشير شرحه إلى ترتيبها
  const mcqOpts = useMemo(() => (q && q.type === "mcq" ? (q.fixedOrder ? q.options : shuffle(q.options)) : []), [q]);
  const opts = q ? (q.type === "tf" ? [q.options[0], q.options[1]] : mcqOpts) : [];

  // تفصيل النتيجة: حسب المحور إن تعددت المحاور، وإلا حسب الفصل
  const breakdown = useMemo(() => {
    const byCourse = new Map<string, { ok: number; total: number }>();
    const byChapter = new Map<string, { ok: number; total: number }>();
    for (const r of review) {
      const rq = questionById(r.qid);
      const rc = rq ? conceptById(rq.conceptId) : undefined;
      if (!rc) continue;
      for (const [m, k] of [
        [byCourse, rc.courseId],
        [byChapter, rc.chapter],
      ] as const) {
        const row = m.get(k) ?? { ok: 0, total: 0 };
        row.total++;
        if (r.ok) row.ok++;
        m.set(k, row);
      }
    }
    if (byCourse.size > 1)
      return { title: "الأداء حسب المحور", rows: [...byCourse].map(([id, v]) => ({ id, name: COURSE_SHORT[id] ?? COURSES.find((c) => c.id === id)?.name ?? id, ...v })) };
    return { title: "الأداء حسب الفصل", rows: [...byChapter].map(([id, v]) => ({ id, name: chapterLabel(id), ...v })) };
  }, [review]);

  // عند انتهاء الجلسة: تسجيل النتيجة مرة واحدة
  useEffect(() => {
    if (finished && !recorded) {
      setRecorded(true);
      const correctCount = review.filter((r) => r.ok).length;
      const durationSec = Math.round((Date.now() - startedAt.current) / 1000);
      finishSession({ mode: config.mode, label: config.label, total: questions.length, correctCount, xp: sessionXp, durationSec });
      pingStudied();
      clearSnapshot();
      if (config.topicKey && questions.length > 0) recordBest(config.topicKey, (correctCount / questions.length) * 100);
      const answers = review.filter((r) => r.answer !== undefined).map((r) => ({ qid: r.qid, answer: r.answer as string }));
      if (answers.length > 0) {
        completeSession(queryClient, config.mode === "review" ? "review" : "practice", sessionId.current, answers, correctCount).then(setGemsEarned);
      }
      if (config.mode === "review") queryClient.invalidateQueries({ queryKey: MISTAKES_QUERY_KEY });
    }
  }, [finished, recorded, review, sessionXp, config, questions.length, finishSession, recordBest, queryClient]);

  // حفظ لقطة الجلسة بعد كل سؤال
  useEffect(() => {
    if (finished || questions.length === 0) return;
    saveSnapshot({ config, idx, review, sessionXp });
  }, [finished, config, idx, review, sessionXp, questions.length]);

  const choose = (text: string) => {
    if (graded !== null) return;
    setSelected(text);
  };

  const grade = () => {
    if (!q || selected === null || graded !== null) return;
    const ok = selected === q.correct;
    setGraded(ok);
    // الخطأ يبقى أمام الطالب، والشرح بضغطة واحدة فلا تزدحم الشاشة
    try {
      if ("vibrate" in navigator && useApp.getState().haptics) navigator.vibrate(ok ? 35 : [60, 40, 60]);
    } catch {}
    if (!ok) setWrongShake(true);
    setTimeout(() => setWrongShake(false), 450);
    recordAttempt(q.id, ok, selected);
    if (config.mode === "review") {
      const isGuest = !queryClient.getQueryData(USER_QUERY_KEY);
      recordReviewResult(q.id, ok, selected, isGuest);
    } else if (!ok || conf === "guess") {
      // الإجابة الصحيحة بالتخمين تُراجَع أيضًا: لم تُعرف بعد
      recordMistake(q.id, selected, queryClient);
    }
    const wasUnseen = !attempts[q.id];
    const gain = ok ? (wasUnseen ? (q.difficulty === "صعب" ? 15 : q.difficulty === "متوسط" ? 10 : 8) : 6) : 0;
    setSessionXp((x) => x + gain);
    const sec = Math.max(1, Math.round((Date.now() - qStartedAt.current) / 1000));
    setReview((r) => [...r, { qid: q.id, ok, answer: selected, sec, conf: conf ?? undefined }]);
  };

  const next = () => {
    if (graded === null) return;
    setSelected(null);
    setGraded(null);
    setShowWhy(false);
    setConf(null);
    qStartedAt.current = Date.now();
    if (idx + 1 >= questions.length) {
      const correctCount = review.filter((r) => r.ok).length;
      if (config.mode === "exam" && correctCount === questions.length) setSessionXp((x) => x + 30);
      else if (config.mode === "proficiency" && correctCount / questions.length >= 0.6) setSessionXp((x) => x + 50);
      else if (correctCount === questions.length && questions.length >= 5) setSessionXp((x) => x + 20);
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  // الإجابة الصحيحة تنتقل وحدها إلى السؤال التالي، وكذلك كل إجابة في الاختبار المحاكي
  useEffect(() => {
    if (graded === null || finished) return;
    if (instantFeedback && !graded) return;
    const t = setTimeout(next, instantFeedback ? 900 : 150);
    return () => clearTimeout(t);
  }, [graded]);

  const exit = () => {
    if (finished || review.length === 0) {
      clearSnapshot();
      clearQuiz();
    } else {
      setExiting(true);
    }
  };

  // اختصارات لوحة المفاتيح: ١–٤ أو أ–د للاختيار، وEnter للتحقق ثم المتابعة
  useEffect(() => {
    if (!q || finished || exiting || readerId) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key in KEY_INDEX && graded === null) {
        const o = opts[KEY_INDEX[e.key]];
        if (o) {
          e.preventDefault();
          choose(o.text);
        }
        return;
      }
      // Enter يتحقق ثم يتابع حتى لو كان التركيز على خيار، إلا في رأس الصفحة أو نافذة حوار
      if (e.key === "Enter" && !(t && t.closest("header, [role=dialog], [role=alertdialog]"))) {
        e.preventDefault();
        if (graded === null) grade();
        else next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reported = q ? reportedQuestions.includes(q.id) : false;
  const handleReport = () => {
    if (!q || reported) return;
    reportQuestion(q.id);
    toast({ title: "شكرًا، سيُراجَع السؤال" });
  };

  const reader = readerId && <ConceptReader conceptId={readerId} embedded onClose={() => setReaderId(null)} />;

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

  // ---------- تقرير النتيجة ----------
  if (finished) {
    const correctCount = review.filter((r) => r.ok).length;
    const pctV = (correctCount / questions.length) * 100;
    const isProficiency = config.mode === "proficiency";
    const passed = pctV >= 60;
    const wrongIds = review.filter((r) => !r.ok).map((r) => r.qid);
    const timed = review.filter((r) => r.sec);
    const avgSec = timed.length ? Math.round(timed.reduce((a, r) => a + (r.sec ?? 0), 0) / timed.length) : 0;
    const totalSec = Math.round((Date.now() - startedAt.current) / 1000);
    const withConf = review.filter((r) => r.conf);
    const confRows = CONF_OPTIONS.map((o) => {
      const rs = withConf.filter((r) => r.conf === o.id);
      return { ...o, total: rs.length, ok: rs.filter((r) => r.ok).length };
    }).filter((r) => r.total > 0);
    const sureWrong = withConf.filter((r) => r.conf === "sure" && !r.ok).length;
    const luckyRight = withConf.filter((r) => r.conf !== "sure" && r.ok).length;
    const shown = review.filter((r) => (filter === "wrong" ? !r.ok : filter === "unsure" ? r.conf && r.conf !== "sure" : true));
    const headline = isProficiency
      ? passed
        ? "اجتزت اختبار الكفاءة"
        : "لم تجتز هذه المرة"
      : pctV === 100
        ? "إتقان كامل"
        : pctV >= 80
          ? "أداء ممتاز"
          : pctV >= 50
            ? "أداء جيد، وراجع أخطاءك"
            : "الخطأ بداية الفهم";

    return (
      <>
        <ScreenShell
          wide
          title="تقرير الجلسة"
          sub={config.label}
          onClose={clearQuiz}
          footer={
            <>
              {wrongIds.length > 0 && (
                <SecondaryButton onClick={() => startQuiz({ mode: "redo", label: "إعادة الأسئلة الخاطئة", qids: shuffle(wrongIds) })} className="flex-1 sm:flex-none">
                  <RotateCcw className="h-4 w-4" /> أعد الخاطئة الآن
                </SecondaryButton>
              )}
              <div className="hidden flex-1 sm:block" />
              <PrimaryButton onClick={clearQuiz} className="flex-1 sm:flex-none">
                متابعة
              </PrimaryButton>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:items-start [&>*]:min-w-0">
            {/* الملخص */}
            <div className="space-y-4 lg:sticky lg:top-0">
              <Card className="flex flex-col items-center p-6 text-center">
                <Ring value={pctV} size={128} stroke={10}>
                  <span className="font-display text-3xl font-bold">{pct(pctV)}</span>
                </Ring>
                <h2 className="mt-4 font-display text-xl font-bold">{headline}</h2>
                {isProficiency && <p className="mt-1 text-sm text-muted-foreground">عتبة النجاح ٦٠٪</p>}
                {gemsEarned !== null && gemsEarned > 0 && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gem-soft px-3 py-1.5 text-sm font-medium text-gem">
                    <Gem className="h-4 w-4" /> {ad(gemsEarned)}+ جوهرة
                  </span>
                )}
              </Card>
              <div className="grid grid-cols-3 gap-3">
                <StatTile label="صحيحة" value={`${ad(correctCount)} من ${ad(questions.length)}`} />
                <StatTile label="متوسط السؤال" value={fmtSec(avgSec)} />
                <StatTile label="المدة" value={fmtSec(totalSec)} />
              </div>
              {review.length < questions.length && (
                <Callout tone="warning" icon={TimerIcon} title="انتهى الوقت">
                  الأسئلة التي لم تُجب عنها احتُسبت خطأً كما في الاختبار الحقيقي.
                </Callout>
              )}
            </div>

            {/* التحليل */}
            <div className="space-y-6">
              {breakdown.rows.length > 0 && (
                <section>
                  <SectionHeader title={breakdown.title} />
                  <Card className="space-y-4 p-4">
                    {breakdown.rows.map((row) => {
                      const v = (row.ok / row.total) * 100;
                      return <SkillBar key={row.id} label={row.name} value={v} status={`${ad(row.ok)} من ${ad(row.total)}`} tone={v >= 70 ? "success" : v >= 50 ? "warning" : "danger"} />;
                    })}
                  </Card>
                </section>
              )}

              {confRows.length > 0 && (
                <section>
                  <SectionHeader title="الثقة والدقة" sub="هل تعرف ما تعرفه؟" />
                  <Card className="p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {confRows.map((r) => (
                        <div key={r.id}>
                          <p className="font-display text-lg font-bold">{pct((r.ok / r.total) * 100)}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.label}، {ad(r.ok)} من {ad(r.total)}
                          </p>
                        </div>
                      ))}
                    </div>
                    {(sureWrong > 0 || luckyRight > 0) && (
                      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm leading-7">
                        {sureWrong > 0 && (
                          <p className="flex gap-2">
                            <AlertTriangle className="mt-1.5 h-4 w-4 shrink-0 text-destructive" />
                            أخطأت في {arCount(sureWrong, QUESTION_OBJ_FORMS)} وأنت متأكد. هذه أفكار راسخة غير دقيقة، فأعد قراءة مفاهيمها أولًا.
                          </p>
                        )}
                        {luckyRight > 0 && (
                          <p className="flex gap-2">
                            <Lightbulb className="mt-1.5 h-4 w-4 shrink-0 text-gem" />
                            أصبت في {arCount(luckyRight, QUESTION_OBJ_FORMS)} دون يقين. ما أصبته بالتخمين أُضيف إلى «أخطائي» لتثبيته.
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                </section>
              )}

              <section>
                <SectionHeader title="مراجعة الأسئلة" />
                <div role="tablist" aria-label="تصفية الأسئلة" className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                  {(
                    [
                      ["all", `الكل ${ad(review.length)}`],
                      ["wrong", `الخاطئة ${ad(wrongIds.length)}`],
                      ["unsure", `دون يقين ${ad(withConf.filter((r) => r.conf !== "sure").length)}`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={filter === id}
                      onClick={() => setFilter(id)}
                      className={`min-h-[36px] shrink-0 rounded-full border px-4 text-sm transition-colors ${
                        filter === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {shown.length === 0 ? (
                  <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">لا أسئلة في هذا التصنيف</p>
                ) : (
                  <Divided>
                    {shown.map((r) => {
                      const rq = questionById(r.qid)!;
                      const rc = conceptById(rq.conceptId);
                      const n = review.indexOf(r) + 1;
                      return (
                        <details key={r.qid} className="group">
                          <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 hover:bg-muted/60">
                            {r.ok ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />}
                            <span className="min-w-0 flex-1">
                              <span className="block text-base leading-7">
                                <span className="text-muted-foreground">{ad(n)}. </span>
                                {rq.question}
                              </span>
                              <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                {rc && <span>{rc.title}</span>}
                                {r.sec !== undefined && <span>{fmtSec(r.sec)}</span>}
                                {r.conf && <span>{CONF_LABEL[r.conf]}</span>}
                              </span>
                            </span>
                            <ChevronDown className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="space-y-3 px-4 pb-4 pr-12">
                            {!r.ok && r.answer && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">إجابتك: </span>
                                <span className="text-destructive">{r.answer}</span>
                              </p>
                            )}
                            <p className="text-sm">
                              <span className="text-muted-foreground">الإجابة الصحيحة: </span>
                              <span className="font-medium text-success">{rq.correct}</span>
                            </p>
                            <AcademicReason reason={rq.reason} />
                            {rc && (
                              <button type="button" onClick={() => setReaderId(rc.id)} className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-primary hover:bg-accent">
                                <BookOpen className="h-4 w-4" /> اقرأ المفهوم: {rc.title}
                              </button>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </Divided>
                )}
              </section>
            </div>
          </div>
        </ScreenShell>
        {reader}
      </>
    );
  }

  // ---------- شاشة السؤال (على نمط Duolingo) ----------
  const answered = graded !== null;
  const showFeedback = answered && instantFeedback;
  const progress = ((idx + (answered ? 1 : 0)) / questions.length) * 100;
  // الإجابات الصحيحة المتتالية حتى الآن
  let combo = 0;
  for (let i = review.length - 1; i >= 0 && review[i].ok; i--) combo++;

  const optClass = (o: { text: string; isCorrect: boolean }) => {
    const isSel = selected === o.text;
    if (showFeedback && o.isCorrect) return "border-[var(--t700)] bg-[var(--t100)] text-[var(--t950)] dark:bg-[var(--t700)]/15 dark:text-[var(--t300)]";
    if (showFeedback && isSel) return "border-[#F0B4B4] bg-[#FFF6F6] text-foreground dark:bg-[#FF4B4B]/10";
    if (isSel) return "border-[var(--t700)] bg-[var(--t050)] text-[var(--t950)] ring-2 ring-[var(--t150)] dark:bg-[var(--t800)]/15 dark:text-foreground";
    return "border-[var(--t075)] bg-white text-foreground dark:border-border dark:bg-card";
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex flex-col bg-background">
        {/* الرأس: إغلاق وشريط تقدم سميك */}
        <header className="safe-top mx-auto flex w-full max-w-[720px] items-center gap-3 px-4 pb-1 pt-3">
          <button type="button" onClick={exit} aria-label="إغلاق" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--t050)] text-[var(--t700)]">
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <div className="flex h-2.5 flex-1 justify-start overflow-hidden rounded-full bg-[var(--t075)]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <motion.div className="h-full rounded-full bg-gradient-to-l from-[#F4C430] to-[var(--t700)]" animate={{ width: `${Math.max(progress, 3)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
          {config.timeLimitSec ? (
            <Timer seconds={config.timeLimitSec} onTimeout={() => setFinished(true)} />
          ) : (
            <span className="shrink-0 whitespace-nowrap text-sm font-bold text-[var(--t500)]">
              {ad(idx + 1)} من {ad(questions.length)}
            </span>
          )}
        </header>

        {/* السؤال والخيارات */}
        <main className="no-scrollbar flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              className={`mx-auto w-full max-w-[640px] px-4 pb-6 pt-4 ${wrongShake && instantFeedback ? "shake" : ""}`}
            >
              {combo >= 3 && !answered && (
                <p className="mb-3 text-base font-bold text-[#E3A93B]">{ad(combo)} إجابات صحيحة متتالية!</p>
              )}
              {concept && <p className="inline-flex max-w-full rounded-full bg-[#FBF1D6] px-3 text-[13px] font-bold leading-7 text-[#9A6A12]"><span className="truncate">{concept.title}</span></p>}
              <h2 className="mt-3 font-display text-lg font-extrabold leading-8 text-foreground">{q.question}</h2>

              <div className={q.type === "tf" ? "mt-6 grid grid-cols-2 gap-3" : "mt-6 space-y-2.5"}>
                {opts.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={answered}
                    onClick={() => choose(o.text)}
                    className={`flex min-h-[54px] w-full items-center gap-3 rounded-[18px] border-[1.5px] px-3.5 py-3 text-right text-base font-semibold leading-7 transition active:scale-[0.99] ${optClass(o)} ${
                      q.type === "tf" ? "justify-center text-center font-bold" : ""
                    }`}
                  >
                    {q.type === "mcq" && (
                      // دائرة الاختيار: تمتلئ بالأخضر عند الاختيار، وتظهر علامة صح أو خطأ بعد التحقق
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          showFeedback && o.isCorrect ? "border-[var(--t700)] bg-[var(--t700)] text-white" : showFeedback && selected === o.text ? "border-[#E58A8A] bg-[#E58A8A] text-white" : selected === o.text ? "border-[var(--t700)] bg-[var(--t700)]" : "border-[var(--t150)]"
                        }`}
                        aria-hidden="true"
                      >
                        {showFeedback && o.isCorrect ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : showFeedback && selected === o.text ? <X className="h-3.5 w-3.5" strokeWidth={3.5} /> : selected === o.text ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                      </span>
                    )}
                    <span className={q.type === "mcq" ? "min-w-0 flex-1" : ""}>{o.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* الشريط السفلي: «تحقّق» ثم لوحة نتيجة هادئة بيضاء */}
        <footer className={`safe-bottom border-t bg-white transition-colors dark:bg-card ${showFeedback ? (graded ? "border-[var(--t150)]" : "border-[#F3C9C9]") : "border-transparent"}`}>
          <div className="mx-auto w-full max-w-[640px] px-4 py-3">
            {showFeedback && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${graded ? "bg-[var(--t100)] text-[var(--t700)]" : "bg-[#FDECEC] text-[#D64545]"}`}>
                    {graded ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-base font-extrabold leading-7 ${graded ? "text-[var(--t800)]" : "text-[#C0392B]"}`}>{graded ? PRAISE[idx % PRAISE.length] : "الإجابة الصحيحة"}</p>
                    {!graded && <p className="text-[15px] font-semibold leading-7 text-foreground">{q.correct}</p>}
                  </div>
                  <button type="button" onClick={handleReport} disabled={reported} aria-label="أبلغ عن خطأ في السؤال" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 disabled:opacity-30">
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
                {showWhy && (
                  <div className="no-scrollbar mt-3 max-h-[34vh] overflow-y-auto rounded-[18px] bg-[var(--t025)] p-3.5 dark:bg-background">
                    <AcademicReason reason={q.reason} />
                    {concept && (
                      <button type="button" onClick={() => setReaderId(concept.id)} className="mt-2 flex min-h-[36px] items-center gap-1.5 text-sm font-bold text-[#B8860B]">
                        <BookOpen className="h-4 w-4" /> اقرأ المفهوم
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            <div className="flex gap-3">
              {showFeedback && !showWhy && (
                <button
                  type="button"
                  onClick={() => setShowWhy(true)}
                  className="min-h-[50px] flex-1 rounded-[20px] border border-[#E3D3A0] bg-white text-base font-bold text-[#9A6A12] active:scale-[0.98] dark:bg-card"
                >
                  الشرح
                </button>
              )}
              {!answered ? (
                <button
                  type="button"
                  disabled={selected === null}
                  onClick={grade}
                  className="min-h-[52px] flex-[2] rounded-[20px] bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] text-lg font-bold text-white transition active:scale-[0.98] disabled:from-[var(--t075)] disabled:to-[var(--t075)] disabled:text-[var(--t450)]"
                >
                  {instantFeedback ? "تحقّق" : "تأكيد"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className={`min-h-[52px] flex-[2] rounded-[20px] text-lg font-bold text-white transition active:scale-[0.98] ${
                    "bg-gradient-to-l from-[var(--t600)] to-[var(--t850)]"
                  }`}
                >
                  {idx + 1 >= questions.length ? "النتيجة" : "متابعة"}
                </button>
              )}
            </div>
          </div>
        </footer>
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
      </div>
      {reader}
    </>
  );
}
