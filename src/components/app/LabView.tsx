"use client";

// مختبر المعلّم — تدريب مهني على المواقف: قرار متفرع الأثر ← تحليل ← تأمل ← خريطة كفاءات
// + اختبار الاستقلال: مواقف جديدة تُدار بلا تقييم أثناء القرار، والتحليل بعد الختام
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  FlaskConical,
  Map as MapIcon,
  Eye,
  Dumbbell,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  MinusCircle,
  Sparkles,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { useApp } from "@/lib/store";
import {
  LAB_SCENARIOS,
  LAB_EXAM_SCENARIOS,
  labScenarioById,
  isExamScenario,
  skillReports,
  skillOfConcept,
  STATUS_WORD,
  labStatusColor,
  RATING_WORD,
  type LabAttempt,
  type LabRating,
  type LabScenario,
  type QuizHint,
} from "@/lib/lab";
import { conceptById, questionById, OPTION_LETTERS } from "@/lib/qbank";

type LabTab = "list" | "exam" | "map" | "mirror";

const ratingIcon: Record<LabRating, typeof CheckCircle2> = {
  good: CheckCircle2,
  ok: MinusCircle,
  poor: CircleAlert,
};
const ratingCls: Record<LabRating, string> = {
  good: "text-emerald-600 border-emerald-200 bg-emerald-50",
  ok: "text-amber-600 border-amber-200 bg-amber-50",
  poor: "text-red-600 border-red-200 bg-red-50",
};

export default function LabView() {
  const clearLab = useUi((s) => s.clearLab);
  const startScenarios = useUi((s) => s.startScenarios);
  const openConcept = useUi((s) => s.openConcept);
  const labAttempts = useApp((s) => s.labAttempts);
  const addLabAttempt = useApp((s) => s.addLabAttempt);
  const quizAttempts = useApp((s) => s.attempts);

  const [tab, setTab] = useState<LabTab>("list");
  const [scenario, setScenario] = useState<LabScenario | null>(null);
  const [examMode, setExamMode] = useState(false);
  const [runId, setRunId] = useState(0); // مفتاح جلسة — يجعل خلط العرض ثابتاً داخل الجلسة وجديداً بين الجلسات
  const [nodeKey, setNodeKey] = useState("start");
  const [steps, setSteps] = useState<LabAttempt["steps"]>([]);
  const [pendingOutcome, setPendingOutcome] = useState<LabAttempt["steps"][number] | null>(null);
  const [reflect, setReflect] = useState<LabAttempt["reflection"]>({ success: "", failed: "", change: "" });

  const reports = useMemo(() => skillReports(labAttempts, quizHintsOf(quizAttempts)), [labAttempts, quizAttempts]);

  const lastStatusOf = (sid: string) => {
    const rel = labAttempts.filter((a) => a.sid === sid).sort((a, b) => a.ts - b.ts);
    if (!rel.length) return null;
    const last = rel[rel.length - 1];
    const scores = last.steps.map((s) => s.rating);
    if (scores.every((r) => r === "good")) return "متقن في آخر تجربة";
    if (scores.every((r) => r === "poor")) return "يحتاج إعادة في آخر تجربة";
    return "في تحسّن في آخر تجربة";
  };

  const startScenario = (s: LabScenario, asExam = false) => {
    setScenario(s);
    setExamMode(asExam);
    setRunId((n) => n + 1);
    setNodeKey("start");
    setSteps([]);
    setPendingOutcome(null);
    setReflect({ success: "", failed: "", change: "" });
  };

  const node = scenario ? scenario.nodes[nodeKey] : null;
  // خلط عرض الخيارات حتمياً ببذرة الجلسة — يكسر نمط «القرار الأفضل في موضع ثابت»
  // ويثبت الترتيب داخل الجلسة ويجديده في كل جلسة جديدة
  const shownOptions = useMemo(() => {
    if (!node || !scenario) return [];
    const seed = `${scenario.id}#${nodeKey}#${runId}`;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const arr = [...node.options];
    for (let i = arr.length - 1; i > 0; i--) {
      h = (h * 1103515245 + 12345) >>> 0;
      const j = h % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [node, scenario, runId]);

  const choose = (optIndex: number) => {
    if (!scenario || pendingOutcome) return;
    const opt = shownOptions[optIndex];
    const step: LabAttempt["steps"][number] = { node: nodeKey, choice: opt.text, rating: opt.rating, outcome: opt.outcome };
    if (examMode) {
      // اختبار الاستقلال: بلا تقييم ولا نتيجة أثناء القرار — انتقال مباشر
      const nextSteps = [...steps, step];
      setSteps(nextSteps);
      setNodeKey(opt.next === "end" ? "end" : opt.next);
      return;
    }
    setPendingOutcome(step);
  };

  const proceed = () => {
    if (!scenario || !pendingOutcome) return;
    const node = scenario.nodes[pendingOutcome.node];
    const opt = node.options.find((o) => o.text === pendingOutcome.choice);
    if (!opt) return;
    const nextSteps = [...steps, pendingOutcome];
    setSteps(nextSteps);
    setPendingOutcome(null);
    setNodeKey(opt.next === "end" ? "end" : opt.next);
  };

  const saveAttempt = () => {
    if (!scenario) return;
    addLabAttempt({ sid: scenario.id, ts: Date.now(), steps, reflection: reflect, mode: examMode ? "exam" : "train" });
    setScenario(null);
    setTab(examMode ? "exam" : "list");
  };

  const openConceptDeep = (cid: string) => {
    clearLab();
    openConcept(cid);
  };

  const header = (t: LabTab) => (
    <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-foreground">مختبر المعلّم</h1>
          <p className="text-xs text-muted-foreground">تدرّب على قرار المعلم في مواقف الحصة الحقيقية</p>
        </div>
        <button
          onClick={clearLab}
          aria-label="إغلاق"
          className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex gap-1.5">
        {(
          [
            ["list", "المواقف", Dumbbell],
            ["exam", "الاستقلال", ShieldCheck],
            ["map", "الخريطة", MapIcon],
            ["mirror", "مرآتي", Eye],
          ] as const
        ).map(([id, lbl, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl border-2 px-1.5 py-2 text-[11px] font-bold ${
              t === id ? "border-primary bg-accent text-primary" : "border-border bg-white text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );

  // ---------- شاشة تشغيل الموقف (تدريب أو اختبار استقلال) ----------
  if (scenario) {
    const finished = nodeKey === "end";
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="mx-auto max-w-lg px-4 pb-28 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setScenario(null)}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {examMode ? "إنهاء الاختبار" : "خروج من الموقف"}
            </button>
            {examMode ? (
              <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-white px-3 py-1 text-xs font-bold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> اختبار استقلال
              </span>
            ) : (
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">{scenario.skill}</span>
            )}
          </div>

          <h2 className="text-lg font-black leading-8">{scenario.title}</h2>
          <p className="text-xs font-bold text-muted-foreground">{examMode ? "موقف جديد لم تتدرّب عليه — قرارك هنا بلا تلميح" : scenario.stage}</p>

          {!finished && !pendingOutcome && node && (
            <motion.div key={nodeKey + runId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
              <div className="rounded-2xl border-2 border-primary/20 bg-white p-4 text-sm font-bold leading-7">{node.text}</div>
              <p className="pt-1 text-sm font-black text-primary">{examMode ? "خذ قرارك — التقييم يظهر بعد الختام" : "ماذا ستفعل؟"}</p>
              {shownOptions.map((o, i) => (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className="flex w-full items-start gap-3 rounded-2xl border-2 border-border bg-white p-4 text-right transition hover:border-primary hover:bg-accent"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-black text-primary">
                    {OPTION_LETTERS[i]}
                  </span>
                  <span className="text-sm font-bold leading-6">{o.text}</span>
                </button>
              ))}
            </motion.div>
          )}

          {pendingOutcome && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
              <div className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-sm font-black ${ratingCls[pendingOutcome.rating]}`}>
                {(() => {
                  const Icon = ratingIcon[pendingOutcome.rating];
                  return <Icon className="h-5 w-5" />;
                })()}
                {RATING_WORD[pendingOutcome.rating]}
              </div>
              <div className="rounded-2xl border border-border bg-white p-4 text-sm leading-7">{pendingOutcome.outcome}</div>
              <button
                onClick={proceed}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-black text-primary-foreground"
              >
                ماذا حدث بعد ذلك؟ <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {finished && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
              {examMode && (
                <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-accent p-3 text-sm font-black text-primary">
                  <ShieldCheck className="h-5 w-5" /> نتيجة اختبار الاستقلال — قراراتك بلا تلميح الآن بلا تقييم
                </div>
              )}
              <div className="rounded-2xl border-2 border-primary/30 bg-accent p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
                  <Sparkles className="h-4 w-4" /> قراراتك في هذا الموقف
                </p>
                <div className="space-y-2">
                  {steps.map((s, i) => (
                    <div key={i} className="rounded-xl bg-white p-3 text-xs leading-6">
                      <span className={`mr-1 font-black ${s.rating === "good" ? "text-emerald-700" : s.rating === "ok" ? "text-amber-700" : "text-red-700"}`}>
                        {RATING_WORD[s.rating]}:
                      </span>
                      <span className="font-bold">{s.choice}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4 text-sm leading-7">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-primary">
                  <Quote className="h-4 w-4" /> خلاصة الموقف
                </p>
                {scenario.end}
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-black">
                  <BookOpen className="h-4 w-4 text-primary" /> مفاهيم من المكتبة تخدم هذا الموقف
                </p>
                <div className="flex flex-wrap gap-2">
                  {scenario.conceptIds.map((cid) => {
                    const c = conceptById(cid);
                    if (!c) return null;
                    return (
                      <button
                        key={cid}
                        onClick={() => openConceptDeep(cid)}
                        className="rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-bold text-primary"
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-border bg-white p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-black">
                  <Eye className="h-4 w-4 text-primary" /> مرآة المعلّم — تأمل بعد التجربة
                </p>
                <div className="space-y-3">
                  {(
                    [
                      ["success", "ما الذي نجح في تصرفاتك؟"],
                      ["failed", "ما القرار الذي لم ينجح؟ ولماذا؟"],
                      ["change", "ما الذي سأغيّره في المرة المقبلة؟"],
                    ] as const
                  ).map(([k, lbl]) => (
                    <div key={k}>
                      <label className="mb-1 block text-xs font-bold text-muted-foreground">{lbl}</label>
                      <textarea
                        value={reflect[k]}
                        onChange={(e) => setReflect((r) => ({ ...r, [k]: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border-2 border-border bg-background p-3 text-sm leading-6 outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveAttempt}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-black text-primary-foreground"
                >
                  <CheckCircle2 className="h-5 w-5" /> {examMode ? "احفظ نتيجة الاختبار والتأمل" : "احفظ التجربة والتأمل"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // ---------- تبويب المواقف التدريبية ----------
  if (tab === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        {header(tab)}
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <div className="mb-4 rounded-2xl border-2 border-primary/20 bg-gradient-to-l from-accent to-white p-4">
            <p className="flex items-center gap-2 text-sm font-black text-primary">
              <FlaskConical className="h-4 w-4" /> كيف يعمل المختبر؟
            </p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              تدخل موقفاً صفياً حقيقياً، وتتخذ قراراتك خطوة بخطوة، فيتحول الموقف بأثرها، ثم ترى تحليل كل قرار وتتأمل في أدائك في «مرآة المعلّم».
            </p>
          </div>

          <button
            onClick={() => {
              clearLab();
              startScenarios();
            }}
            className="mb-4 flex w-full items-center justify-between rounded-2xl border-2 border-border bg-white p-4 text-right"
          >
            <div>
              <p className="text-sm font-black">مواقف سريعة</p>
              <p className="text-xs text-muted-foreground">محاكاة قرار واحد مع تفسيره التربوي</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="space-y-3">
            {LAB_SCENARIOS.map((s) => {
              const st = lastStatusOf(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => startScenario(s)}
                  className="block w-full rounded-2xl border-2 border-border bg-white p-4 text-right transition hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black leading-6">{s.title}</p>
                    {st && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{st}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">{s.skill}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{s.stage}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // ---------- تبويب اختبار الاستقلال ----------
  if (tab === "exam") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        {header(tab)}
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <div className="mb-4 rounded-2xl border-2 border-primary/25 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-black text-primary">
              <ShieldCheck className="h-4 w-4" /> إثبات القرار بمعلم داخلك
            </p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              هنا مواقف جديدة لم تتدرّب عليها ولا تقرأ حلولها. أثناء القرار لا يظهر تقييم ولا نتيجة ولا شرح — التحليل الكامل يفتح عند الختام وحده. ما تحققه هنا هو دليلك الحقيقي على الاستقلال المهني، وهو ما تثبته في خريطة الكفاءات.
            </p>
          </div>
          <div className="space-y-3">
            {LAB_EXAM_SCENARIOS.map((s) => {
              const st = lastStatusOf(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => startScenario(s, true)}
                  className="block w-full rounded-2xl border-2 border-primary/20 bg-white p-4 text-right transition hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black leading-6">{s.title}</p>
                    {st && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">{st}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{s.stage}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">قرارات متتابعة بلا تلميح</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // ---------- تبويب خريطة الكفاءات ----------
  if (tab === "map") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        {header(tab)}
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <p className="mb-4 rounded-2xl border border-border bg-white p-4 text-xs leading-6 text-muted-foreground">
            حالتك هنا تُبنى من أدلة تجاربك لا من درجات: قراراتك في المواقف، ونتائج أسئلة مفاهيم المكتبة المرتبطة بكل كفاءة، واختبار الاستقلال الذي يثبت الأثر. لا تظهر أرقام — الأدلة نصوص من عملك أنت.
          </p>
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.skill} className="rounded-2xl border-2 border-border bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{r.skill}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${labStatusColor[r.status]}`}>
                    {STATUS_WORD[r.status]}
                  </span>
                </div>
                {r.examVerdict && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] leading-5 text-emerald-800">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> {r.examVerdict}
                  </p>
                )}
                {r.evidence.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {r.evidence.map((ev, i) => (
                      <p key={i} className="rounded-xl bg-muted/60 p-2.5 text-[11px] leading-5 text-muted-foreground">
                        {ev}
                      </p>
                    ))}
                  </div>
                )}
                {r.quizEvidence.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {r.quizEvidence.map((ev, i) => (
                      <p key={i} className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] leading-5 text-amber-800">
                        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {ev}
                      </p>
                    ))}
                  </div>
                )}
                {r.scenarioIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.scenarioIds.map((sid) => {
                      const sc = labScenarioById.get(sid);
                      if (!sc) return null;
                      return (
                        <button
                          key={sid}
                          onClick={() => startScenario(sc)}
                          className="rounded-full border border-primary/30 px-3 py-1 text-[11px] font-bold text-primary"
                        >
                          جرّب: {sc.title}
                        </button>
                      );
                    })}
                    {r.examScenarioIds.map((sid) => {
                      const sc = labScenarioById.get(sid);
                      if (!sc) return null;
                      return (
                        <button
                          key={sid}
                          onClick={() => startScenario(sc, true)}
                          className="flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-[11px] font-bold text-primary"
                        >
                          <ShieldCheck className="h-3 w-3" /> اختبر استقلالك: {sc.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ---------- تبويب مرآتي ----------
  const mirrorList = [...labAttempts].sort((a, b) => b.ts - a.ts);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      {header(tab)}
      <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
        {mirrorList.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-white p-6 text-center">
            <Eye className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-black">لا تأملات محفوظة بعد</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              أكمل أي موقف من تبويب «المواقف» أو موقفاً من «الاستقلال»، وأجب عن أسئلة مرآة المعلّم في نهايته — فتجمع تأملاتك هنا لترى تطورك.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mirrorList.map((a, i) => {
              const sc = labScenarioById.get(a.sid);
              return (
                <div key={i} className="rounded-2xl border-2 border-border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-sm font-black">
                      {a.mode === "exam" && <ShieldCheck className="h-4 w-4 text-primary" />}
                      {sc?.title ?? "موقف تدريبي"}
                    </p>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">{sc?.skill}</span>
                  </div>
                  <div className="space-y-1.5 text-xs leading-6">
                    <p>
                      <span className="font-black text-emerald-700">ما نجح: </span>
                      <span className="text-muted-foreground">{a.reflection.success || "—"}</span>
                    </p>
                    <p>
                      <span className="font-black text-red-700">ما لم ينجح: </span>
                      <span className="text-muted-foreground">{a.reflection.failed || "—"}</span>
                    </p>
                    <p>
                      <span className="font-black text-primary">ما سأغيّره: </span>
                      <span className="text-muted-foreground">{a.reflection.change || "—"}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// أدلة نوعية من سجل الأسئلة: لكل كفاءة، مفاهيمها المرتبطة عبر المواقف وآخر إجابة عن أسئلة كل مفهوم
function quizHintsOf(quizAttempts: Record<string, { correct: boolean; ts: number }>): QuizHint[] {
  const bySkill = new Map<string, { wrong: string[]; good: string[] }>();
  for (const [, skills] of skillOfConcept) for (const sk of skills) if (!bySkill.has(sk)) bySkill.set(sk, { wrong: [], good: [] });
  for (const [qid, a] of Object.entries(quizAttempts)) {
    const q = questionById(qid);
    if (!q) continue;
    const skills = skillOfConcept.get(q.conceptId);
    if (!skills?.length) continue;
    const title = conceptById(q.conceptId)?.title;
    if (!title) continue;
    for (const sk of skills) {
      const b = bySkill.get(sk);
      if (!b) continue;
      const arr = a.correct ? b.good : b.wrong;
      if (!arr.includes(title)) arr.push(title);
    }
  }
  return [...bySkill.entries()].map(([skill, b]) => ({ skill, wrong: b.wrong, good: b.good }));
}
