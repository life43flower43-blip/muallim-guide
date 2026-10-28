"use client";

// مختبر محاكاة الصفوف — الجيل الجديد: كل قرار يغيّر الموقف، والتحليل متعدد الكفاءات
// السلسلة: الموقف ← قرار ← عاقبة وتحليل (لماذا، المخاطر، الأدلة) ← تطور الموقف ← تقرير كفاءات ← تمرين مستهدف
// القواعد الصارمة: واجهة عربية خالصة، أرقام مشرقية، تنصيص «» — بلا لاتيني ولا CJK
import { FitText } from "./FitText";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, BookOpen, ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, MinusCircle, Sparkles, Quote, Compass, Users, Target, RotateCcw, FlaskConical, Gauge, Eye, Play, ChevronLeft, Zap, Heart } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { useApp } from "@/lib/store";
import { ad } from "@/lib/arabic";
import {
  SIM_SCENARIOS,
  SIM_SESSION_SIZE,
  SIM_RATING_WORD,
  SIM_STATUS_WORD,
  simStatusColor,
  simProfile,
  simAggregate,
  pickSessionScenarios,
  weakestSkill,
  buildRecommendation,
  type SimRating,
  type SimScenario,
  type SimAttempt,
  type SimSkillScore,
} from "@/lib/sim";
import { LAB_ALL, isExamScenario } from "@/lib/lab";
import { Callout, Card, Chip, Divided, IconTile, OptionButton, PrimaryButton, ProgressBar, ScreenShell, SecondaryButton, SectionHeader, SkillBar, ToolTiles } from "./ui-kit";
import { conceptById, OPTION_LETTERS } from "@/lib/qbank";

const ratingIcon: Record<SimRating, typeof CheckCircle2> = {
  good: CheckCircle2,
  ok: MinusCircle,
  poor: CircleAlert,
};
const ratingTxt: Record<SimRating, string> = {
  good: "text-success",
  ok: "text-gem",
  poor: "text-destructive",
};


// المرحلة الدراسية من وصف الموقف: «الابتدائي العليا — حصة النشاط» ← «الابتدائي»
const LEVELS = ["الكل", "الروضة", "الابتدائي", "المتوسط", "الثانوي"] as const;
type Level = (typeof LEVELS)[number];
const levelOf = (stage: string): Level => LEVELS.find((l) => l !== "الكل" && stage.startsWith(l)) ?? "الكل";

export default function SimLabView() {
  const clearSim = useUi((s) => s.clearSim);
  const startLab = useUi((s) => s.startLab);
  const openConcept = useUi((s) => s.openConcept);
  const simAttempts = useApp((s) => s.simAttempts);
  const addSimAttempt = useApp((s) => s.addSimAttempt);
  const labAttempts = useApp((s) => s.labAttempts);

  const [scenario, setScenario] = useState<SimScenario | null>(null);
  const [level, setLevel] = useState<Level>("الكل");
  const [runId, setRunId] = useState(0);
  const [nodeKey, setNodeKey] = useState("start");
  const [steps, setSteps] = useState<SimAttempt["steps"]>([]);
  const [pendingOutcome, setPendingOutcome] = useState<SimAttempt["steps"][number] | null>(null);
  const [pendingOpt, setPendingOpt] = useState<(SimScenario["nodes"][string]["options"])[number] | null>(null);
  const savedRef = useRef(false);

  // الجلسة الموسعة: ثلاثة مواقف متتابعة تعطي نحو ثلاثين قراراً بتقرير مجمّع
  const [sessionQueue, setSessionQueue] = useState<SimScenario[]>([]);
  const [sessionIdx, setSessionIdx] = useState(0);
  const [sessionAttempts, setSessionAttempts] = useState<SimAttempt[]>([]);
  const sessionActive = sessionQueue.length > 0;

  // خريطة كفاءتك المجمّعة من آخر أدلة كل موقف
  const aggregate = useMemo(() => simAggregate(simAttempts), [simAttempts]);

  // مرشحو مختبر المعلّم للتوصية المستهدفة
  const labCandidates = useMemo(
    () =>
      LAB_ALL.filter((s) => !isExamScenario(s.id)).map((s) => ({
        sid: s.id,
        title: s.title,
        skill: s.skill,
        attempted: labAttempts.some((a) => a.sid === s.id),
      })),
    [labAttempts],
  );

  const lastStatusOf = (sid: string) => {
    const rel = simAttempts.filter((a) => a.sid === sid).sort((a, b) => a.ts - b.ts);
    if (!rel.length) return null;
    const ratings = rel[rel.length - 1].steps.map((s) => s.rating);
    if (ratings.every((r) => r === "good")) return { word: "متقن", cls: "bg-[#E3F4EA] text-[#1F7A4D]" };
    if (ratings.every((r) => r === "poor")) return { word: "أعده", cls: "bg-danger-soft text-destructive" };
    return { word: "في تحسّن", cls: "bg-[#FBF1D6] text-[#9A6A12]" };
  };

  const startScenario = (s: SimScenario) => {
    setScenario(s);
    setRunId((n) => n + 1);
    setNodeKey("start");
    setSteps([]);
    setPendingOutcome(null);
    setPendingOpt(null);
    savedRef.current = false;
  };

  // بدء جلسة موسعة: ينتقي ثلاثة مواقف يفضل غير المجرب فيها
  const startSession = () => {
    const queue = pickSessionScenarios(simAttempts.map((a) => a.sid));
    if (!queue.length) return;
    setSessionQueue(queue);
    setSessionIdx(0);
    setSessionAttempts([]);
    startScenario(queue[0]);
  };

  const advanceSession = () => {
    const nextIdx = sessionIdx + 1;
    if (nextIdx >= sessionQueue.length) return;
    setSessionIdx(nextIdx);
    startScenario(sessionQueue[nextIdx]);
  };

  const endSession = () => {
    setSessionQueue([]);
    setSessionIdx(0);
    setSessionAttempts([]);
    setScenario(null);
  };

  const node = scenario ? scenario.nodes[nodeKey] : null;
  const finished = nodeKey === "end";

  // خلط عرض الخيارات حتميًا ببذرة الجلسة — يكسر نمط «القرار الأفضل في موضع ثابت»
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
    if (!scenario || !node || pendingOutcome) return;
    const opt = node.options.find((o) => o.text === shownOptions[optIndex].text);
    if (!opt) return;
    setPendingOpt(opt);
    setPendingOutcome({ node: nodeKey, choice: opt.text, rating: opt.rating, outcome: opt.outcome, delta: opt.delta });
  };

  const proceed = () => {
    if (!scenario || !pendingOutcome || !pendingOpt) return;
    const nextSteps = [...steps, pendingOutcome];
    setSteps(nextSteps);
    setPendingOutcome(null);
    setPendingOpt(null);
    const nk = pendingOpt.next;
    if (nk === "end" && !savedRef.current) {
      // حفظ تلقائي فور الختام — لا تضيع الأدلة بإغلاق متعجل
      const attempt: SimAttempt = { sid: scenario.id, ts: Date.now(), steps: nextSteps };
      addSimAttempt(attempt);
      if (sessionActive) setSessionAttempts((prev) => [...prev, attempt]);
      savedRef.current = true;
    }
    setNodeKey(nk === "end" ? "end" : nk);
  };

  const openConceptDeep = (cid: string) => {
    clearSim();
    openConcept(cid);
  };

  // بروفايل هذا الموقف والتوصية المستهدفة في نهايته
  const profile = useMemo(
    () => (scenario && finished ? simProfile(scenario, steps) : []),
    [scenario, finished, steps],
  );
  const recommendation = useMemo(
    () => (finished ? buildRecommendation(weakestSkill(profile), labCandidates) : null),
    [finished, profile, labCandidates],
  );

  // خلاصة الجلسة الموسعة عند إتمام آخر موقف فيها
  const sessionDone = sessionActive && finished && sessionIdx >= sessionQueue.length - 1;
  const sessionProfile = useMemo(
    () => (sessionDone && sessionAttempts.length ? simAggregate(sessionAttempts) : []),
    [sessionDone, sessionAttempts],
  );
  const sessionDecisions = sessionAttempts.reduce((n, a) => n + a.steps.length, 0);

  const toneOf = (p: SimSkillScore) =>
    p.status === "strong" ? "success" : p.status === "improving" ? "warning" : p.status === "weak" ? "danger" : "muted";
  const skillBars = (list: SimSkillScore[]) => (
    <div className="space-y-4">
      {list.map((p) => (
        <SkillBar key={p.skill} label={p.skill} value={Math.max(p.ratio * 100, 3)} status={SIM_STATUS_WORD[p.status]} tone={toneOf(p)} />
      ))}
    </div>
  );
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

  // ================== قائمة المواقف ==================
  if (!scenario) {
    const doneCount = new Set(simAttempts.map((a) => a.sid)).size;
    const shown = SIM_SCENARIOS.filter((x) => level === "الكل" || levelOf(x.stage) === level);
    return (
      <ScreenShell title="المواقف الصفية" onClose={clearSim}>
        <div className="space-y-6">
          {/* الجلسة المتتابعة مع تقدّمك في كل المواقف */}
          <button
            type="button"
            onClick={startSession}
            className="block w-full overflow-hidden rounded-[26px] bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] p-4 text-right text-white transition active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-[#FFE27A]">
                <Play className="h-6 w-6 fill-current" />
              </span>
              <span className="min-w-0 flex-1">
                <FitText max={19} min={14} className="font-extrabold leading-8">جلسة متتابعة</FitText>
                <FitText max={14} min={10} className="font-medium text-white/80">{`${ad(SIM_SESSION_SIZE)} مواقف ثم تقرير كفاءاتك`}</FitText>
              </span>
              <ChevronLeft className="h-6 w-6 shrink-0 text-[#FFE27A]" />
            </span>
            <span className="mt-3 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
                <span className="block h-full rounded-full bg-gradient-to-l from-[#FFE27A] to-[#E3B23C]" style={{ width: `${doneCount ? Math.max(3, (doneCount / Math.max(1, SIM_SCENARIOS.length)) * 100) : 0}%` }} />
              </span>
              <span className="shrink-0 text-xs font-bold text-white/85">أنجزت {ad(doneCount)} من {ad(SIM_SCENARIOS.length)}</span>
            </span>
          </button>

          <ToolTiles
            items={[
              { icon: Zap, title: "مواقف سريعة", onClick: () => { clearSim(); useUi.getState().startScenarios(); } },
              { icon: Heart, title: "قلب الصف", onClick: () => { clearSim(); useUi.getState().startHeart(); } },
            ]}
          />

          {/* خريطة الكفاءات تظهر بعد أول موقف */}
          {aggregate.length > 0 && (
            <section className="rounded-[24px] border border-[var(--t075)] bg-white p-4 dark:border-border dark:bg-card">
              <SectionHeader title="خريطة كفاءاتك" action={<Gauge className="h-5 w-5 shrink-0 text-[var(--t500)]" />} />
              {skillBars(aggregate)}
            </section>
          )}

          <section>
            <SectionHeader title="المواقف" action={<span className="shrink-0 text-sm font-bold text-[var(--t500)]">{ad(shown.length)}</span>} />
            {/* تصفية حسب المرحلة الدراسية */}
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="المرحلة">
              {LEVELS.filter((l) => l === "الكل" || SIM_SCENARIOS.some((x) => levelOf(x.stage) === l)).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={level === l}
                  onClick={() => setLevel(l)}
                  className={`min-h-[38px] shrink-0 rounded-full border px-4 text-sm font-bold transition ${level === l ? "border-transparent bg-[var(--t700)] text-white" : "border-[var(--t075)] bg-white text-[var(--t700)] dark:border-border dark:bg-card"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="space-y-2.5">
              {shown.map((x) => {
                const st = lastStatusOf(x.id);
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => startScenario(x)}
                    className="flex w-full min-w-0 items-center gap-3 rounded-[22px] border border-[var(--t075)] bg-white p-3 text-right transition active:scale-[0.98] dark:border-border dark:bg-card"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--t050)] text-[var(--t700)]">
                      <Users className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <FitText max={16} min={11} className="font-bold leading-7">{x.title}</FitText>
                      <FitText max={13} min={9} className="leading-5 text-muted-foreground">{[levelOf(x.stage), ...x.skills.slice(0, 2)].join(" · ")}</FitText>
                    </span>
                    {st && <span className={`shrink-0 rounded-full px-2.5 text-xs font-bold leading-6 ${st.cls}`}>{st.word}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </ScreenShell>
    );
  }

  // ================== التشغيل والتقرير ==================
  const back = () => (sessionActive ? endSession() : setScenario(null));
  const decisionNo = steps.length + 1;
  const footer = pendingOutcome ? (
    <PrimaryButton onClick={proceed} className="w-full">
      ماذا حدث بعد ذلك؟ <ArrowLeft className="h-4 w-4" />
    </PrimaryButton>
  ) : finished ? (
    sessionActive && !sessionDone ? (
      <>
        <SecondaryButton onClick={endSession}>إنهاء الجلسة</SecondaryButton>
        <PrimaryButton onClick={advanceSession} className="flex-1">
          الموقف التالي ({ad(sessionIdx + 2)} من {ad(SIM_SESSION_SIZE)})
        </PrimaryButton>
      </>
    ) : (
      <>
        <SecondaryButton onClick={() => (sessionDone ? endSession() : startScenario(scenario))} className="flex-1">
          <RotateCcw className="h-4 w-4" /> {sessionDone ? "إنهاء الجلسة" : "أعد الموقف"}
        </SecondaryButton>
        <PrimaryButton onClick={() => setScenario(null)} className="flex-1">
          موقف آخر
        </PrimaryButton>
      </>
    )
  ) : undefined;

  return (
    <ScreenShell
      title={scenario.title}
      sub={sessionActive ? `الجلسة: الموقف ${ad(sessionIdx + 1)} من ${ad(SIM_SESSION_SIZE)}` : scenario.stage}
      onBack={back}
      onClose={clearSim}
      footer={footer}
    >
      {!finished && !pendingOutcome && (
        <motion.div key={nodeKey + runId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="primary">القرار {ad(decisionNo)}</Chip>
            <Chip>{scenario.stage}</Chip>
          </div>
          {nodeKey === "start" && <p className="text-base leading-8 text-secondary-foreground">{scenario.intro}</p>}
          {node && (
            <Card className="p-5">
              <p className="text-base leading-8">{node.text}</p>
            </Card>
          )}
          <div>
            <p className="mb-3 font-display text-base font-semibold">ماذا ستفعل؟</p>
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
            return <Callout tone={tone} icon={Icon} title={SIM_RATING_WORD[pendingOutcome.rating]} />;
          })()}
          <div>
            <p className="mb-1 text-sm text-muted-foreground">قرارك</p>
            <p className="text-base font-medium leading-7">{pendingOutcome.choice}</p>
          </div>
          <Card className="p-5">
            <p className="mb-1.5 text-sm text-muted-foreground">ما الذي حدث</p>
            <p className="text-base leading-8">{pendingOutcome.outcome}</p>
          </Card>
          <Callout tone="info" icon={Eye} title="لماذا؟">
            <p>{pendingOpt?.insight}</p>
            {pendingOpt?.risks && <p className="mt-2">{pendingOpt.risks}</p>}
            {pendingOpt?.evidence && <p className="mt-2">{pendingOpt.evidence}</p>}
          </Callout>
        </motion.div>
      )}

      {finished && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div>
            <Chip tone="success">
              <CheckCircle2 className="h-3.5 w-3.5" /> اكتمل الموقف
            </Chip>
            <p className="mt-3 text-base leading-8 text-secondary-foreground">{scenario.end}</p>
          </div>

          {sessionDone && (
            <Card className="p-5">
              <SectionHeader title="خلاصة الجلسة" sub={`${ad(SIM_SESSION_SIZE)} مواقف، و${ad(sessionDecisions)} قرارًا`} />
              {skillBars(sessionProfile)}
            </Card>
          )}

          <Card className="p-5">
            <SectionHeader title="كفاءاتك في هذا الموقف" />
            {skillBars(profile)}
          </Card>

          <Card className="p-5">
            <SectionHeader title="قراراتك" />
            <ol className="space-y-3">
              {steps.map((st, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{ad(i + 1)}</span>
                  <span className="min-w-0 flex-1 text-sm leading-6">
                    <span className={`font-semibold ${ratingTxt[st.rating]}`}>{SIM_RATING_WORD[st.rating]}: </span>
                    {st.choice}
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <Callout tone="warning" icon={Target} title="تمرينك التالي">
            {recommendation ? (
              <div className="space-y-3">
                <p>
                  <span className="font-semibold">الكفاءة: </span>
                  {recommendation.skill}
                </p>
                <p>{recommendation.exercise}</p>
                {recommendation.labTitle && (
                  <SecondaryButton
                    onClick={() => {
                      clearSim();
                      startLab();
                    }}
                    className="w-full"
                  >
                    <FlaskConical className="h-4 w-4" /> مختبر المعلّم: «{recommendation.labTitle}»
                  </SecondaryButton>
                )}
                {recommendation.concepts.length > 0 && conceptChips(recommendation.concepts)}
              </div>
            ) : (
              <p>أداؤك متوازن في كل كفاءات هذا الموقف. جرّب موقفًا جديدًا لتكتمل خريطتك.</p>
            )}
          </Callout>

          {scenario.conceptIds.length > 0 && (
            <section>
              <SectionHeader title="مفاهيم مرتبطة بالموقف" />
              {conceptChips(scenario.conceptIds)}
            </section>
          )}
        </motion.div>
      )}
    </ScreenShell>
  );
}
