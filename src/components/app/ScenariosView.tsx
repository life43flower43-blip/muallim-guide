"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  School,
  CheckCircle2,
  Circle,
  ChevronLeft,
  Lightbulb,
  Target,
  RotateCcw,
  ShieldAlert,
  ThumbsUp,
  Award,
} from "lucide-react";
import {
  SCENARIOS,
  SCENARIO_CATEGORIES,
  SCENARIO_XP,
  bestIndexOf,
  scoreLabel,
  type Scenario,
  type ScenarioScore,
} from "@/lib/scenarios";
import { buildScenarioRun } from "@/lib/scenarios";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Callout, Card, Chip, Divided, IconTile, OptionButton, PrimaryButton, ProgressBar, Ring, ScreenShell, SecondaryButton, SectionHeader } from "./ui-kit";

const LETTERS = ["أ", "ب", "ج", "د"];

// نتيجة خيار محدد من سجل المستخدم
const chosenScore = (s: Scenario, opt: number): ScenarioScore =>
  s.options[opt]?.score ?? "poor";

// ---------- شاشة الجولة: موقف بقرار ----------
function RunScreen({
  run,
  onFinish,
  onExit,
}: {
  run: Scenario[];
  onFinish: (scores: ScenarioScore[]) => void;
  onExit: () => void;
}) {
  const recordScenarioChoice = useApp((s) => s.recordScenarioChoice);
  const finishSession = useApp((s) => s.finishSession);
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [results, setResults] = useState<ScenarioScore[]>([]);
  const startedAt = useMemo(() => Date.now(), []);

  const sc = run[idx];
  const best = bestIndexOf(sc);
  const graded = choice !== null;
  const isLast = idx === run.length - 1;

  const pick = (i: number) => {
    if (graded) return;
    setChoice(i);
    recordScenarioChoice(sc.id, i);
    setResults((r) => [...r, chosenScore(sc, i)]);
  };

  const next = () => {
    if (!isLast) {
      setIdx((i) => i + 1);
      setChoice(null);
    } else {
      const xp = results.reduce((a, s) => a + SCENARIO_XP[s], 0);
      const bestCount = results.filter((s) => s === "best").length;
      finishSession({
        mode: "scenarios",
        label: "محاكاة الصف — جولة قرارات",
        total: run.length,
        correctCount: bestCount,
        xp,
        durationSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      });
      onFinish(results);
    }
  };

  const verdict =
    graded && choice !== null
      ? {
          best: { text: "قرار ممتاز: هذا ما يفعله المعلم المحترف", tone: "success" as const, icon: ThumbsUp },
          ok: { text: "قرار مقبول، وهناك خيار أفضل", tone: "warning" as const, icon: Lightbulb },
          poor: { text: "قرار فيه مخاطرة، انظر القرار الأفضل", tone: "danger" as const, icon: ShieldAlert },
        }[chosenScore(sc, choice)]
      : null;

  return (
    <ScreenShell
      title="جولة قرارات"
      sub={`الموقف ${ad(idx + 1)} من ${ad(run.length)}`}
      onClose={onExit}
      footer={
        <PrimaryButton disabled={!graded} onClick={next} className="w-full">
          {isLast ? "النتيجة" : "الموقف التالي"} <ChevronLeft className="h-4 w-4" />
        </PrimaryButton>
      }
    >
      <ProgressBar value={((idx + (graded ? 1 : 0)) / run.length) * 100} className="mb-5" />
      <motion.div key={sc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div>
          <Chip tone="primary">{sc.category}</Chip>
          <h2 className="mt-3 font-display text-lg font-semibold leading-8">{sc.title}</h2>
        </div>
        <Card className="p-5">
          <p className="text-base leading-8">{sc.situation}</p>
        </Card>
        <div>
          <p className="mb-3 font-display text-base font-semibold">ماذا ستفعل؟</p>
          <div className="space-y-3">
            {sc.options.map((o, i) => {
              let state: "idle" | "correct" | "wrong" | "dim" | "selected" = "idle";
              if (graded) {
                if (i === best) state = "correct";
                else if (i === choice) state = o.score === "ok" ? "selected" : "wrong";
                else state = "dim";
              }
              return (
                <OptionButton key={i} letter={LETTERS[i]} state={state} disabled={graded} onClick={() => pick(i)}>
                  {o.text}
                  {graded && i === best && <span className="mr-2 inline-block align-middle"><Chip tone="success">الأفضل</Chip></span>}
                </OptionButton>
              );
            })}
          </div>
        </div>
        {verdict && choice !== null && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Callout tone={verdict.tone} icon={verdict.icon} title={verdict.text}>
              {sc.options[choice].feedback}
            </Callout>
            {choice !== best && (
              <Callout tone="success" icon={Award} title={`القرار الأفضل: ${sc.options[best].text}`}>
                {sc.options[best].feedback}
              </Callout>
            )}
          </motion.div>
        )}
      </motion.div>
    </ScreenShell>
  );
}

// ---------- شاشة النتيجة ----------
function ResultScreen({ scores, run, onAgain, onExit }: { scores: ScenarioScore[]; run: Scenario[]; onAgain: () => void; onExit: () => void }) {
  const bestCount = scores.filter((s) => s === "best").length;
  const pct = Math.round((bestCount / run.length) * 100);

  const headline =
    pct >= 80 ? "أنت جاهز للصف!" : pct >= 50 ? "أداء معلم واعد — واصل التدريب" : "الصف مدرسة بحد ذاته — راجع التفسيرات وأعد الجولة";

  return (
    <ScreenShell
      title="نتيجة الجولة"
      onClose={onExit}
      footer={
        <>
          <SecondaryButton onClick={onExit} className="flex-1">
            كل المواقف
          </SecondaryButton>
          <PrimaryButton onClick={onAgain} className="flex-1">
            <RotateCcw className="h-4 w-4" /> جولة جديدة
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col items-center py-6 text-center">
        <Ring value={pct} size={120} stroke={10}>
          <span className="font-display text-2xl font-bold text-primary">{ad(pct)}٪</span>
        </Ring>
        <h2 className="mt-5 font-display text-xl font-bold">{headline}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          اخترت القرار الأفضل في {ad(bestCount)} من {ad(run.length)} مواقف.
        </p>
      </div>
      <Divided>
        {run.map((sc, i) => {
          const r = scores[i];
          return (
            <div key={sc.id} className="flex items-center gap-3 px-4 py-3">
              {r === "best" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              ) : r === "ok" ? (
                <Lightbulb className="h-5 w-5 shrink-0 text-gem" />
              ) : (
                <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
              )}
              <span className="min-w-0 flex-1 text-[15px]">{sc.title}</span>
              <span className="text-[13px] text-muted-foreground">{r ? scoreLabel(r) : ""}</span>
            </div>
          );
        })}
      </Divided>
    </ScreenShell>
  );
}

// ---------- الشاشة الرئيسية للمواقف ----------
export default function ScenariosView() {
  const clearScenarios = useUi((s) => s.clearScenarios);
  const scenarioChoices = useApp((s) => s.scenarioChoices);
  const [run, setRun] = useState<Scenario[] | null>(null);
  const [lastScores, setLastScores] = useState<ScenarioScore[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  const startRun = (list: Scenario[]) => {
    setLastScores(null);
    setRun(list);
  };

  const finishRun = () => {
    setRun(null);
    setLastScores(null);
  };

  const showResult = (scores: ScenarioScore[]) => {
    setLastScores(scores);
  };

  const grouped = useMemo(
    () =>
      SCENARIO_CATEGORIES.map((cat) => ({
        cat,
        items: SCENARIOS.filter((s) => s.category === cat),
      })),
    []
  );

  if (run && lastScores) {
    return (
      <ResultScreen
        scores={lastScores}
        run={run}
        onAgain={() => startRun(buildScenarioRun(Object.keys(scenarioChoices)))}
        onExit={finishRun}
      />
    );
  }
  if (run) return <RunScreen run={run} onFinish={showResult} onExit={finishRun} />;

  const done = Object.keys(scenarioChoices).length;
  return (
    <ScreenShell title="مواقف صفية سريعة" sub="موقف واحد، وقرار، ثم تفسير تربوي" onClose={clearScenarios}>
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <IconTile icon={Target} size={48} />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-semibold">جولة قرارات</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                مواقف صفية واقعية، لكل منها أربعة قرارات ممكنة. تختار فترى نتيجة قرارك وتفسيره، وكيف يفكر المعلم المحترف.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar value={(done / Math.max(1, SCENARIOS.length)) * 100} className="flex-1" />
            <span className="shrink-0 text-[13px] text-muted-foreground">
              {ad(done)} من {ad(SCENARIOS.length)}
            </span>
          </div>
          <PrimaryButton onClick={() => startRun(buildScenarioRun(Object.keys(scenarioChoices)))} className="mt-4 w-full sm:w-auto">
            ابدأ الجولة
          </PrimaryButton>
        </Card>

        {grouped.map(({ cat, items }) => (
          <section key={cat}>
            <SectionHeader title={cat} />
            <Divided>
              {items.map((s) => {
                const rec = scenarioChoices[s.id];
                const sc: ScenarioScore | null = rec ? chosenScore(s, rec.opt) : null;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => startRun([s])}
                    className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                  >
                    {sc === null ? (
                      <Circle className="h-5 w-5 shrink-0 text-input" />
                    ) : (
                      <CheckCircle2 className={`h-5 w-5 shrink-0 ${sc === "best" ? "text-success" : sc === "ok" ? "text-gem" : "text-destructive"}`} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] leading-6">{s.title}</span>
                      {sc !== null && <span className="text-[13px] text-muted-foreground">آخر قرار: {scoreLabel(sc)}</span>}
                    </span>
                    <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  </button>
                );
              })}
            </Divided>
          </section>
        ))}
      </div>
    </ScreenShell>
  );
}

// تجنب الاستيراد الدائري — نسخة محلية آمنة
function scenarioByIdSafe(id: string, opt: number): { id: string; score: ScenarioScore } | null {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s || s.options[opt] === undefined) return null;
  return { id, score: s.options[opt].score };
}
