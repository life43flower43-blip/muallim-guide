"use client";

// مختبر المعلّم — تدريب مهني على المواقف: قرار متفرع الأثر ← تحليل ← تأمل ← خريطة كفاءات
// + اختبار الاستقلال: مواقف جديدة تُدار بلا تقييم أثناء القرار، والتحليل بعد الختام
import { FitText } from "./FitText";
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
  ChevronLeft,
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
import { ad } from "@/lib/arabic";
import { Callout, Card, Chip, Divided, EmptyState, IconTile, OptionButton, PrimaryButton, ScreenShell, SectionHeader } from "./ui-kit";

type LabTab = "list" | "exam" | "map" | "mirror";

const ratingIcon: Record<LabRating, typeof CheckCircle2> = {
  good: CheckCircle2,
  ok: MinusCircle,
  poor: CircleAlert,
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

  const conceptChips = (ids: string[]) => (
    <div className="flex flex-wrap gap-2">
      {ids.map((cid) => {
        const c = conceptById(cid);
        if (!c) return null;
        return (
          <button
            key={cid}
            type="button"
            onClick={() => openConceptDeep(cid)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm text-primary hover:bg-accent"
          >
            <BookOpen className="h-3.5 w-3.5" /> {c.title}
          </button>
        );
      })}
    </div>
  );

  // ---------- تشغيل الموقف (تدريب أو اختبار استقلال) ----------
  if (scenario) {
    const finished = nodeKey === "end";
    const footer = pendingOutcome ? (
      <PrimaryButton onClick={proceed} className="w-full">
        ماذا حدث بعد ذلك؟ <ArrowLeft className="h-4 w-4" />
      </PrimaryButton>
    ) : finished ? (
      <PrimaryButton onClick={saveAttempt} className="w-full">
        <CheckCircle2 className="h-4 w-4" /> {examMode ? "احفظ نتيجة الاختبار والتأمل" : "احفظ التجربة والتأمل"}
      </PrimaryButton>
    ) : undefined;
    return (
      <ScreenShell
        title={scenario.title}
        sub={examMode ? "اختبار استقلال: بلا تلميح حتى النهاية" : `${scenario.skill}، ${scenario.stage}`}
        onBack={() => setScenario(null)}
        onClose={clearLab}
        footer={footer}
      >
        {!finished && !pendingOutcome && node && (
          <motion.div key={nodeKey + runId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Chip tone="primary">القرار {ad(steps.length + 1)}</Chip>
              {examMode && (
                <Chip>
                  <ShieldCheck className="h-3.5 w-3.5" /> اختبار استقلال
                </Chip>
              )}
            </div>
            <Card className="p-5">
              <p className="text-base leading-8">{node.text}</p>
            </Card>
            <div>
              <p className="mb-3 font-display text-base font-semibold">{examMode ? "خذ قرارك، والتقييم يظهر بعد الختام" : "ماذا ستفعل؟"}</p>
              <div className="space-y-3">
                {shownOptions.map((o, i) => (
                  <OptionButton key={i} letter={OPTION_LETTERS[i]} onClick={() => choose(i)}>
                    {o.text}
                  </OptionButton>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {pendingOutcome && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {(() => {
              const Icon = ratingIcon[pendingOutcome.rating];
              const tone = pendingOutcome.rating === "good" ? "success" : pendingOutcome.rating === "ok" ? "warning" : "danger";
              return <Callout tone={tone} icon={Icon} title={RATING_WORD[pendingOutcome.rating]} />;
            })()}
            <div>
              <p className="mb-1 text-sm text-muted-foreground">قرارك</p>
              <p className="text-base font-medium leading-7">{pendingOutcome.choice}</p>
            </div>
            <Card className="p-5">
              <p className="mb-1.5 text-sm text-muted-foreground">ما الذي حدث</p>
              <p className="text-base leading-8">{pendingOutcome.outcome}</p>
            </Card>
          </motion.div>
        )}

        {finished && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div>
              <Chip tone="success">
                <CheckCircle2 className="h-3.5 w-3.5" /> {examMode ? "انتهى اختبار الاستقلال" : "اكتمل الموقف"}
              </Chip>
              <p className="mt-3 text-base leading-8 text-secondary-foreground">{scenario.end}</p>
            </div>

            <Card className="p-5">
              <SectionHeader title="قراراتك" />
              <ol className="space-y-3">
                {steps.map((st, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{ad(i + 1)}</span>
                    <span className="min-w-0 flex-1 text-sm leading-6">
                      <span className={`font-semibold ${st.rating === "good" ? "text-success" : st.rating === "ok" ? "text-gem" : "text-destructive"}`}>
                        {RATING_WORD[st.rating]}:{" "}
                      </span>
                      {st.choice}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>

            {scenario.conceptIds.length > 0 && (
              <section>
                <SectionHeader title="مفاهيم مرتبطة بالموقف" />
                {conceptChips(scenario.conceptIds)}
              </section>
            )}

            <Card className="p-5">
              <SectionHeader title="مرآة المعلّم" sub="تأمل قصير يثبّت ما تعلمته من الموقف" />
              <div className="space-y-4">
                {(
                  [
                    ["success", "ما الذي نجح في تصرفاتك؟"],
                    ["failed", "ما القرار الذي لم ينجح؟ ولماذا؟"],
                    ["change", "ما الذي ستغيّره في المرة المقبلة؟"],
                  ] as const
                ).map(([k, lbl]) => (
                  <label key={k} className="block space-y-1.5">
                    <span className="text-sm font-medium text-secondary-foreground">{lbl}</span>
                    <textarea
                      value={reflect[k]}
                      onChange={(e) => setReflect((r) => ({ ...r, [k]: e.target.value }))}
                      rows={2}
                      className="w-full rounded-xl border border-input bg-card p-3 text-base leading-7 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </ScreenShell>
    );
  }

  const tabs = (
    <div role="tablist" aria-label="أقسام المختبر" className="mb-5 grid grid-cols-4 gap-1 rounded-[22px] border border-[#E3D3A0] bg-white p-1 dark:bg-card">
      {(
        [
          ["list", "المواقف", Dumbbell],
          ["exam", "الاستقلال", ShieldCheck],
          ["map", "الكفاءات", MapIcon],
          ["mirror", "تأملاتي", Eye],
        ] as const
      ).map(([id, lbl]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={`flex min-h-[42px] min-w-0 items-center justify-center rounded-[18px] px-1 font-bold transition-colors ${
            tab === id ? "bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] text-white" : "text-[var(--t500)]"
          }`}
        >
          <FitText max={15} min={10} group="lab-tabs" className="text-center">{lbl}</FitText>
        </button>
      ))}
    </div>
  );

  const scenarioRow = (s: LabScenario, asExam: boolean) => {
    const st = lastStatusOf(s.id);
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => startScenario(s, asExam)}
        className="flex w-full min-w-0 items-center gap-3 px-4 py-3.5 text-right transition-colors hover:bg-muted/60"
      >
        <IconTile icon={asExam ? ShieldCheck : FlaskConical} />
        <span className="min-w-0 flex-1">
          <FitText max={17} min={12} className="font-bold leading-7">{s.title}</FitText>
          <span className="mt-1.5 flex min-w-0 items-start gap-1.5 rounded-[12px] bg-[var(--t050)] px-2.5 py-1 text-[var(--t500)]">
            <span className="flex-1 text-[13px] font-medium leading-5">{(asExam ? [s.stage] : [s.skill, s.stage]).join(" · ")}</span>
            {st && <span className="shrink-0 rounded-full bg-[var(--t100)] px-2 text-[11px] font-bold leading-5 text-[var(--t800)]">{st}</span>}
          </span>
        </span>
        <ChevronLeft className="h-4 w-4 shrink-0 text-[#C99A06]" />
      </button>
    );
  };

  const mirrorList = [...labAttempts].sort((a, b) => b.ts - a.ts);

  return (
    <ScreenShell title="مختبر المعلّم" sub="قرار المعلم في مواقف الحصة الحقيقية" onClose={clearLab}>
      {tabs}

      {tab === "list" && (
        <div className="space-y-5">
          <ListRowCard
            onClick={() => {
              clearLab();
              startScenarios();
            }}
          />
          <Divided>{LAB_SCENARIOS.map((s) => scenarioRow(s, false))}</Divided>
        </div>
      )}

      {tab === "exam" && (
        <div className="space-y-5">
          <Callout tone="info" icon={ShieldCheck} title="مواقف جديدة بلا تلميح">
            لم تتدرّب عليها من قبل. لا يظهر تقييم أثناء القرار، والتحليل الكامل في النهاية. نتيجتك هنا هي دليل استقلالك المهني في خريطة الكفاءات.
          </Callout>
          <Divided>{LAB_EXAM_SCENARIOS.map((s) => scenarioRow(s, true))}</Divided>
        </div>
      )}

      {tab === "map" && (
        <div className="space-y-4">
          <p className="text-base leading-7 text-secondary-foreground">
            تُبنى حالة كل كفاءة من قراراتك في المواقف، ومن إجاباتك عن أسئلة المفاهيم المرتبطة بها، ومن اختبار الاستقلال.
          </p>
          {reports.map((r) => (
            <Card key={r.skill} className="p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-base font-semibold">{r.skill}</p>
                <Chip tone={r.status === "strong" ? "success" : r.status === "weak" ? "danger" : r.status === "none" ? "neutral" : "warning"}>
                  {STATUS_WORD[r.status]}
                </Chip>
              </div>
              {r.examVerdict && (
                <Callout tone="success" icon={ShieldCheck} className="mt-3">
                  {r.examVerdict}
                </Callout>
              )}
              {(r.evidence.length > 0 || r.quizEvidence.length > 0) && (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary-foreground">
                  {r.evidence.map((ev, i) => (
                    <li key={`e${i}`} className="flex gap-2">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {ev}
                    </li>
                  ))}
                  {r.quizEvidence.map((ev, i) => (
                    <li key={`q${i}`} className="flex gap-2">
                      <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-gem" />
                      {ev}
                    </li>
                  ))}
                </ul>
              )}
              {(r.scenarioIds.length > 0 || r.examScenarioIds.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.scenarioIds.map((sid) => {
                    const sc = labScenarioById.get(sid);
                    if (!sc) return null;
                    return (
                      <button key={sid} type="button" onClick={() => startScenario(sc)} className="min-h-[36px] rounded-full border border-border px-3 text-sm text-primary hover:bg-accent">
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
                        type="button"
                        onClick={() => startScenario(sc, true)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border px-3 text-sm text-primary hover:bg-accent"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> اختبر استقلالك: {sc.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "mirror" &&
        (mirrorList.length === 0 ? (
          <EmptyState icon={Eye} title="لا تأملات محفوظة بعد" sub="أكمل أي موقف وأجب عن أسئلة مرآة المعلّم في نهايته، فتُجمع تأملاتك هنا لترى تطورك." />
        ) : (
          <div className="space-y-3">
            {mirrorList.map((a, i) => {
              const sc = labScenarioById.get(a.sid);
              return (
                <Card key={i} className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-base font-semibold">
                      {a.mode === "exam" && <ShieldCheck className="h-4 w-4 text-primary" />}
                      {sc?.title ?? "موقف تدريبي"}
                    </p>
                    {sc?.skill && <Chip tone="primary">{sc.skill}</Chip>}
                  </div>
                  <dl className="space-y-2 text-sm leading-6">
                    <div>
                      <dt className="font-medium text-success">ما نجح</dt>
                      <dd className="text-secondary-foreground">{a.reflection.success || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-destructive">ما لم ينجح</dt>
                      <dd className="text-secondary-foreground">{a.reflection.failed || "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-primary">ما سأغيّره</dt>
                      <dd className="text-secondary-foreground">{a.reflection.change || "—"}</dd>
                    </div>
                  </dl>
                </Card>
              );
            })}
          </div>
        ))}
    </ScreenShell>
  );
}

function ListRowCard({ onClick }: { onClick: () => void }) {
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-4 text-right transition-colors hover:bg-muted/60">
        <IconTile icon={Sparkles} color="var(--gem)" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium">مواقف سريعة</span>
        </span>
        <ChevronLeft className="h-4 w-4 shrink-0 text-[#C99A06]" />
      </button>
    </Card>
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
