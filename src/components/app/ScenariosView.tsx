"use client";
import { pickEmojis } from "@/lib/emoji-pick";

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
import { Callout, Card, Chip, Divided, IconTile, OptionButton, PrimaryButton, ProgressBar, Ring, ScreenShell, SecondaryButton, SectionHeader, GameTile, SceneCard, AskHeading } from "./ui-kit";

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
      <motion.div key={sc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div>
          <Chip tone="primary">{sc.category}</Chip>
          <h2 className="mt-2 font-display text-[17px] font-extrabold leading-7">{sc.title}</h2>
        </div>
        <SceneCard>{sc.situation}</SceneCard>
        <div>
          <AskHeading>ماذا ستفعل؟</AskHeading>
          <div className="space-y-2.5">
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
          <span className="font-display text-2xl font-bold text-foreground">{ad(pct)}٪</span>
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
              <span className="min-w-0 flex-1 text-base">{sc.title}</span>
              <span className="text-sm text-muted-foreground">{r ? scoreLabel(r) : ""}</span>
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
  const emoList = pickEmojis(SCENARIOS.map((x) => x.title));
  const emo: Record<string, string> = Object.fromEntries(SCENARIOS.map((x, i) => [x.id, emoList[i]]));
  return (
    <ScreenShell title="مواقف صفية سريعة" onClose={clearScenarios}>
      <div className="space-y-6">
        <PrimaryButton onClick={() => startRun(buildScenarioRun(Object.keys(scenarioChoices)))} className="w-full">
          ابدأ الجولة · {ad(done)} من {ad(SCENARIOS.length)}
        </PrimaryButton>

        {grouped.map(({ cat, items }) => (
          <section key={cat}>
            <SectionHeader title={cat} />
            <div className="space-y-2.5">
              {items.map((s, k) => {
                const rec = scenarioChoices[s.id];
                const sc: ScenarioScore | null = rec ? chosenScore(s, rec.opt) : null;
                return <GameTile key={s.id} tone={k} emoji={sc === null ? emo[s.id] : sc === "best" ? "✅" : sc === "ok" ? "🟡" : "🔁"} title={s.title} meta={sc !== null ? scoreLabel(sc) : undefined} onClick={() => startRun([s])} />;
              })}
            </div>
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
