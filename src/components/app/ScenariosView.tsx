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
  Zap,
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
import { Button } from "@/components/ui/button";

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
        label: `محاكاة الصف — ${run.length} موقفاً`,
        total: run.length,
        correctCount: bestCount,
        xp,
        durationSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      });
      onFinish(results);
    }
  };

  const banner =
    graded && choice !== null
      ? {
          best: { text: "قرار ممتاز! هذا ما يفعله المعلم المحترف", cls: "bg-emerald-600", icon: ThumbsUp },
          ok: { text: "قرار مقبول — لكن هناك خيار أزكى", cls: "bg-amber-500", icon: Lightbulb },
          poor: { text: "قرار فيه مخاطرة — انظر القرار الأفضل", cls: "bg-red-500", icon: ShieldAlert },
        }[chosenScore(sc, choice)]
      : null;

  const BannerIcon = banner?.icon ?? ThumbsUp;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="safe-top bg-gradient-to-l from-[#7C2D12] to-[#9A3412] px-4 pb-3 pt-3 text-white">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="rounded-full bg-white/20 p-2" aria-label="إغلاق الجولة">
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold opacity-90">محاكاة الصف — جولة قرارات</p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25">
              <motion.div
                className="h-full rounded-full bg-amber-400"
                animate={{ width: `${((idx + (graded ? 1 : 0)) / run.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
          <span className="text-xs font-black" dir="ltr">
            {idx + 1}/{run.length}
          </span>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <motion.div key={sc.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          <div className="card-soft rounded-3xl border border-border bg-white p-5">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black text-orange-700">
              {sc.category}
            </span>
            <h2 className="mt-2 text-base font-black leading-7">{sc.title}</h2>
            <div className="mt-3 rounded-2xl bg-muted/70 p-4">
              <p className="text-sm leading-8 text-foreground">{sc.situation}</p>
            </div>
          </div>

          <p className="mt-5 mb-2 flex items-center gap-2 text-sm font-black text-foreground">
            <Target className="h-4 w-4 text-primary" /> ماذا ستفعل؟
          </p>

          <div className="space-y-2">
            {sc.options.map((o, i) => {
              let cls = "border-border bg-white";
              if (graded) {
                if (i === choice && o.score === "best") cls = "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600";
                else if (i === choice && o.score === "ok") cls = "border-amber-500 bg-amber-50 ring-1 ring-amber-500";
                else if (i === choice && o.score === "poor") cls = "border-red-500 bg-red-50 ring-1 ring-red-500";
                else if (i === best && choice !== best) cls = "border-emerald-600 bg-emerald-50/70";
                else cls = "border-border bg-muted/30 opacity-60";
              }
              return (
                <motion.button
                  key={i}
                  whileTap={graded ? undefined : { scale: 0.98 }}
                  disabled={graded}
                  onClick={() => pick(i)}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3.5 text-right transition-colors ${cls}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                      graded && (i === choice || (i === best && choice !== best))
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-foreground/70"
                    }`}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="flex-1 text-sm font-bold leading-6 text-foreground">{o.text}</span>
                  {graded && i === best && choice !== best && (
                    <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white">
                      الأفضل
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {graded && banner && choice !== null && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 overflow-hidden rounded-3xl border border-border bg-white"
              >
                <div className={`flex items-center gap-2 ${banner.cls} px-4 py-3 text-white`}>
                  <BannerIcon className="h-5 w-5" />
                  <p className="text-sm font-black">{banner.text}</p>
                  <span className="mr-auto rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-black">
                    +{SCENARIO_XP[chosenScore(sc, choice)]} نقطة
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm leading-8 text-foreground">{sc.options[choice].feedback}</p>
                  {choice !== best && (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-black text-emerald-800">
                        <Award className="h-4 w-4" /> القرار الأفضل: {LETTERS[best]} — {sc.options[best].text}
                      </p>
                      <p className="text-xs leading-7 text-emerald-900/90">{sc.options[best].feedback}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="safe-bottom border-t border-border bg-white px-4 pt-3">
        <Button
          disabled={!graded}
          onClick={next}
          className="h-13 w-full rounded-2xl bg-primary py-3.5 text-base font-black text-primary-foreground disabled:opacity-40"
        >
          {isLast ? "النتيجة النهائية" : "الموقف التالي"} <ChevronLeft className="mr-1 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// ---------- شاشة النتيجة ----------
function ResultScreen({ scores, run, onAgain, onExit }: { scores: ScenarioScore[]; run: Scenario[]; onAgain: () => void; onExit: () => void }) {
  const bestCount = scores.filter((s) => s === "best").length;
  const okCount = scores.filter((s) => s === "ok").length;
  const poorCount = scores.filter((s) => s === "poor").length;
  const xp = scores.reduce((a, s) => a + SCENARIO_XP[s], 0);
  const pct = Math.round((bestCount / run.length) * 100);

  const headline =
    pct >= 80 ? "أنت جاهز للصف!" : pct >= 50 ? "أداء معلم واعد — واصل التدريب" : "الصف مدرسة بحد ذاته — راجع التفسيرات وأعد الجولة";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="safe-top" />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }}>
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
          <School className="h-12 w-12 text-emerald-700" />
        </span>
      </motion.div>
      <h2 className="mt-4 text-2xl font-black">{headline}</h2>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">
        أكملت جولة من {run.length} مواقف صفية
      </p>

      <div className="mt-6 grid w-full max-w-sm grid-cols-3 gap-2">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <p className="text-xl font-black text-emerald-700">{bestCount}</p>
          <p className="text-[10px] font-bold text-emerald-800">قرار ممتاز</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="text-xl font-black text-amber-600">{okCount}</p>
          <p className="text-[10px] font-bold text-amber-700">مقبول</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-3">
          <p className="text-xl font-black text-red-500">{poorCount}</p>
          <p className="text-[10px] font-bold text-red-600">فيه مخاطرة</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full bg-amber-100 px-5 py-2.5">
        <Zap className="h-5 w-5 text-amber-600" />
        <span className="text-sm font-black text-amber-800">+{xp} نقطة خبرة</span>
      </div>

      <div className="mt-8 w-full max-w-sm space-y-2">
        <Button onClick={onAgain} className="h-13 w-full rounded-2xl bg-primary py-3.5 text-base font-black text-primary-foreground">
          <RotateCcw className="ml-2 h-5 w-5" /> جولة جديدة
        </Button>
        <Button onClick={onExit} variant="outline" className="h-12 w-full rounded-2xl border-2 text-sm font-black">
          العودة إلى المحاكاة
        </Button>
      </div>
      </div>
      <div className="safe-bottom" />
    </div>
  );
}

// ---------- الشاشة الرئيسية للمواقف: قائمة + إحصاءات ----------
export default function ScenariosView() {
  const clearScenarios = useUi((s) => s.clearScenarios);
  const scenarioChoices = useApp((s) => s.scenarioChoices);
  const [run, setRun] = useState<Scenario[] | null>(null);
  const [lastScores, setLastScores] = useState<ScenarioScore[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  const solvedCount = Object.keys(scenarioChoices).length;
  const bestRate = useMemo(() => {
    const scores = Object.entries(scenarioChoices)
      .map(([sid, c]) => scenarioByIdSafe(sid, c.opt))
      .filter((x): x is { id: string; score: ScenarioScore } => x !== null)
      .map((x) => x.score);
    if (scores.length === 0) return null;
    return Math.round((scores.filter((s) => s === "best").length / scores.length) * 100);
  }, [scenarioChoices]);

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

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="safe-top bg-gradient-to-l from-[#7C2D12] to-[#9A3412] px-4 pb-5 pt-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <School className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-black">محاكاة الصف الدراسي</h2>
              <p className="text-[11px] opacity-90">موقف حقيقي أمامك، وقرار بيدك — ثم تفسير تربوي</p>
            </div>
          </div>
          <button onClick={clearScenarios} className="rounded-full bg-white/20 p-2" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {/* بطاقة الدعوة */}
        <div className="card-soft rounded-3xl border border-orange-200 bg-gradient-to-l from-orange-50 to-amber-50 p-5">
          <p className="text-sm leading-8 text-orange-950">
            هنا تتحول المعرفة إلى مهنة: موقف صفّي واقعي، أربعة قرارات ممكنة — تختار قرارك فترى{" "}
            <b>نتيجته</b> و<b>التفسير التربوي</b> له، وكيف يفكر المعلم المحترف في الموقف نفسه.
          </p>
          <Button
            onClick={() => startRun(buildScenarioRun(Object.keys(scenarioChoices)))}
            className="mt-4 h-13 w-full rounded-2xl bg-orange-600 py-3.5 text-base font-black text-white hover:bg-orange-500"
          >
            <Target className="ml-2 h-5 w-5" />
            ابدأ جولة ({Math.min(10, SCENARIOS.length)} مواقف)
          </Button>
        </div>

        {/* إحصاءات المستخدم */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="card-soft rounded-2xl border border-border bg-white p-4 text-center">
            <p className="text-xl font-black text-primary">
              {solvedCount}/{SCENARIOS.length}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">مواقف اتخذت فيها قراراً</p>
          </div>
          <div className="card-soft rounded-2xl border border-border bg-white p-4 text-center">
            <p className="text-xl font-black text-emerald-600">{bestRate === null ? "—" : `${bestRate}%`}</p>
            <p className="text-[10px] font-bold text-muted-foreground">نسبة قراراتك الممتازة</p>
          </div>
        </div>

        {/* القائمة حسب التصنيف */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-black">كل المواقف</p>
          <button onClick={() => setShowAll((v) => !v)} className="flex items-center text-xs font-bold text-primary">
            {showAll ? "إخفاء" : "عرض الكل"} <ChevronLeft className={`h-4 w-4 transition-transform ${showAll ? "-rotate-90" : ""}`} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showAll && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                {grouped.map(({ cat, items }) => (
                  <div key={cat}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> {cat} ({items.length})
                    </p>
                    {items.map((s) => {
                      const rec = scenarioChoices[s.id];
                      const sc: ScenarioScore | null = rec ? chosenScore(s, rec.opt) : null;
                      return (
                        <button
                          key={s.id}
                          onClick={() => startRun([s])}
                          className="mb-1.5 flex w-full items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 text-right transition-colors active:bg-accent"
                        >
                          {sc === null ? (
                            <Circle className="h-5 w-5 shrink-0 text-border" />
                          ) : (
                            <CheckCircle2
                              className={`h-5 w-5 shrink-0 ${sc === "best" ? "text-emerald-600" : sc === "ok" ? "text-amber-500" : "text-red-500"}`}
                            />
                          )}
                          <span className="flex-1">
                            <span className="block text-sm font-bold leading-6">{s.title}</span>
                            {sc !== null && (
                              <span className="text-[10px] font-bold text-muted-foreground">
                                آخر قرار: {scoreLabel(sc)}
                              </span>
                            )}
                          </span>
                          <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// تجنب الاستيراد الدائري — نسخة محلية آمنة
function scenarioByIdSafe(id: string, opt: number): { id: string; score: ScenarioScore } | null {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s || s.options[opt] === undefined) return null;
  return { id, score: s.options[opt].score };
}
