"use client";

// مختبر محاكاة الصفوف — الجيل الجديد: كل قرار يغيّر الموقف، والتحليل متعدد الكفاءات
// السلسلة: الموقف ← قرار ← عاقبة وتحليل (لماذا، المخاطر، الأدلة) ← تطور الموقف ← تقرير كفاءات ← تمرين مستهدف
// القواعد الصارمة: واجهة عربية خالصة، أرقام مشرقية، تنصيص «» — بلا لاتيني ولا CJK
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  MinusCircle,
  Sparkles,
  Quote,
  Compass,
  Users,
  Target,
  RotateCcw,
  FlaskConical,
  Gauge,
  Eye,
} from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { useApp } from "@/lib/store";
import { ad } from "@/lib/arabic";
import {
  SIM_SCENARIOS,
  SIM_RATING_WORD,
  SIM_STATUS_WORD,
  simStatusColor,
  simProfile,
  simAggregate,
  weakestSkill,
  buildRecommendation,
  type SimRating,
  type SimScenario,
  type SimAttempt,
  type SimSkillScore,
} from "@/lib/sim";
import { LAB_ALL, isExamScenario } from "@/lib/lab";
import { conceptById, OPTION_LETTERS } from "@/lib/qbank";

const ratingIcon: Record<SimRating, typeof CheckCircle2> = {
  good: CheckCircle2,
  ok: MinusCircle,
  poor: CircleAlert,
};
const ratingCls: Record<SimRating, string> = {
  good: "text-indigo-600 border-indigo-200 bg-indigo-50",
  ok: "text-amber-600 border-amber-200 bg-amber-50",
  poor: "text-red-600 border-red-200 bg-red-50",
};
const ratingTxt: Record<SimRating, string> = {
  good: "text-indigo-700",
  ok: "text-amber-700",
  poor: "text-red-700",
};

const barColorOf = (p: SimSkillScore) =>
  p.status === "strong" ? "bg-emerald-500" : p.status === "improving" ? "bg-amber-500" : p.status === "weak" ? "bg-red-400" : "bg-muted";

export default function SimLabView() {
  const clearSim = useUi((s) => s.clearSim);
  const startLab = useUi((s) => s.startLab);
  const openConcept = useUi((s) => s.openConcept);
  const simAttempts = useApp((s) => s.simAttempts);
  const addSimAttempt = useApp((s) => s.addSimAttempt);
  const labAttempts = useApp((s) => s.labAttempts);

  const [scenario, setScenario] = useState<SimScenario | null>(null);
  const [runId, setRunId] = useState(0);
  const [nodeKey, setNodeKey] = useState("start");
  const [steps, setSteps] = useState<SimAttempt["steps"]>([]);
  const [pendingOutcome, setPendingOutcome] = useState<SimAttempt["steps"][number] | null>(null);
  const [pendingOpt, setPendingOpt] = useState<(SimScenario["nodes"][string]["options"])[number] | null>(null);
  const savedRef = useRef(false);

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
    if (ratings.every((r) => r === "good")) return "متقن في آخر تجربة";
    if (ratings.every((r) => r === "poor")) return "يحتاج إعادة نظر في آخر تجربة";
    return "في تحسّن في آخر تجربة";
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
      addSimAttempt({ sid: scenario.id, ts: Date.now(), steps: nextSteps });
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

  const header = (
    <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-sm">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-black text-foreground">مختبر محاكاة الصفوف</h1>
            <p className="text-xs text-muted-foreground">ادخل صفًا افتراضيًا — كل قرار يغيّر الموقف ويُحلَّل</p>
          </div>
        </div>
        <button
          onClick={clearSim}
          aria-label="إغلاق"
          className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  // ================== قائمة المواقف ==================
  if (!scenario) {
    const doneCount = new Set(simAttempts.map((a) => a.sid)).size;
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        {header}
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          {/* شريط الفلسفة */}
          <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-bl from-indigo-50 to-violet-50 p-5">
            <p className="flex items-center gap-2 text-sm font-black text-primary">
              <FlaskConical className="h-4.5 w-4.5" /> من يعرف المعلومات… إلى معلم يتصرف بذكاء
            </p>
            <p className="mt-2 text-xs font-bold leading-6 text-gray-700">
              في كل موقف ستقرأ مشهدًا صفًا حيًا، وتختار قرارك، ثم يتحول الموقف وفقًا لقرارك — وبعد الختام يُعرض
              تحليل كفاءاتك: إدارة الصف، والتواصل، وفهم المتعلم، واتخاذ القرار، والتقويم — مع تمرين مستهدف لنقطة
              ضعفك. هذه الأدلة محسوبة من قراراتك لا من درجات حفظ.
            </p>
            <p className="mt-3 text-[11px] font-black text-primary">
              أكملت {ad(doneCount)} من {ad(SIM_SCENARIOS.length)} مواقف
            </p>
          </div>

          {/* بطاقة كفاءتك المجمعة — أين أدلتك الآن؟ */}
          <div className="mt-4 rounded-3xl border border-border bg-white p-5 shadow-soft">
            <p className="flex items-center gap-2 text-sm font-black">
              <Gauge className="h-4.5 w-4.5 text-primary" /> خريطة كفاءتك من أدلة المحاكاة
            </p>
            {aggregate.length ? (
              <div className="mt-3 space-y-2.5">
                {aggregate.map((p) => (
                  <div key={p.skill}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-800">{p.skill}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${simStatusColor[p.status]}`}>
                        {SIM_STATUS_WORD[p.status]}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColorOf(p)}`}
                        style={{ width: `${Math.max(p.ratio * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs font-bold leading-6 text-muted-foreground">
                لا أدلة بعد — أول موقف تُكمله سيبدأ برسم خريطتك من قراراتك الفعلية، لا من درجات الحفظ.
              </p>
            )}
          </div>

          {/* المواقف */}
          <p className="mb-2 mt-5 flex items-center gap-1.5 text-sm font-black">
            <Target className="h-4.5 w-4.5 text-primary" /> مواقف الحصة الحقيقية
          </p>
          <div className="space-y-3">
            {SIM_SCENARIOS.map((s, idx) => {
              const st = lastStatusOf(s.id);
              return (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => startScenario(s)}
                  className="flex w-full items-start gap-3 rounded-3xl border border-border bg-white p-4 text-right shadow-soft transition hover:border-primary/40"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-black text-primary">
                    {ad(idx + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-black text-gray-900">{s.title}</span>
                      {st && <span className="shrink-0 text-[10px] font-black text-primary">{st}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-bold text-gray-500">{s.stage}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {s.skills.map((k) => (
                        <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-gray-700">
                          {k}
                        </span>
                      ))}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // ================== التشغيل والتقرير ==================
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
            <ArrowLeft className="h-4 w-4" /> {finished ? "عودة إلى المواقف" : "خروج من الموقف"}
          </button>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-primary">{scenario.stage}</span>
        </div>

        <h2 className="text-lg font-black leading-8">{scenario.title}</h2>

        {!finished && !pendingOutcome && (
          <motion.div key={nodeKey + runId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
            {nodeKey === "start" && (
              <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-bl from-indigo-50 to-violet-50 p-4 text-sm font-bold leading-7 text-gray-800">
                {scenario.intro}
              </div>
            )}
            {node && (
              <div className="rounded-2xl border-2 border-primary/20 bg-white p-4 text-sm font-bold leading-7">{node.text}</div>
            )}
            <p className="pt-1 text-sm font-black text-primary">ماذا ستفعل؟</p>
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
              {SIM_RATING_WORD[pendingOutcome.rating]}
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 text-sm leading-7 font-bold">{pendingOutcome.outcome}</div>
            <div className="rounded-2xl border-2 border-primary/20 bg-accent p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-primary">
                <Eye className="h-4 w-4" /> لماذا هذا القرار؟
              </p>
              <p className="text-xs leading-6 font-bold text-gray-800">{pendingOpt?.insight}</p>
              {pendingOpt?.risks && (
                <p className="mt-2 text-xs leading-6 font-bold text-gray-700">{pendingOpt.risks}</p>
              )}
              {pendingOpt?.evidence && (
                <p className="mt-2 text-xs leading-6 font-bold text-gray-700">{pendingOpt.evidence}</p>
              )}
            </div>
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
            <div className="rounded-2xl border-2 border-primary/30 bg-accent p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
                <Sparkles className="h-4 w-4" /> قراراتك في هذا الموقف
              </p>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div key={i} className="rounded-xl bg-white p-3 text-xs leading-6">
                    <span className={`mr-1 font-black ${ratingTxt[s.rating]}`}>{SIM_RATING_WORD[s.rating]}: </span>
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

            {/* كفاءاتك في هذا الموقف */}
            <div className="rounded-2xl border-2 border-border bg-white p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-black">
                <Gauge className="h-4.5 w-4.5 text-primary" /> كفاءاتك في هذا الموقف — من قراراتك لا من حفظك
              </p>
              <div className="space-y-2.5">
                {profile.map((p) => (
                  <div key={p.skill}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-800">{p.skill}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${simStatusColor[p.status]}`}>
                        {SIM_STATUS_WORD[p.status]}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColorOf(p)}`}
                        style={{ width: `${Math.max(p.ratio * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* التمرين المستهدف */}
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-black text-amber-800">
                <Target className="h-4.5 w-4.5" /> تمرينك التالي — مستهدف من أضعف أدلتك
              </p>
              {recommendation ? (
                <div className="space-y-2.5">
                  <p className="text-xs font-black text-gray-800">
                    الكفاءة المستهدفة: {recommendation.skill}
                  </p>
                  <p className="text-xs leading-6 font-bold text-gray-700">{recommendation.exercise}</p>
                  {recommendation.labTitle && (
                    <button
                      onClick={() => {
                        clearSim();
                        startLab();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground"
                    >
                      <FlaskConical className="h-4 w-4" /> افتح مختبر المعلّم — موقف «{recommendation.labTitle}»
                    </button>
                  )}
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black text-gray-700">
                      <BookOpen className="h-3.5 w-3.5 text-primary" /> مفاهيم للمراجعة قبل التمرين
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.concepts.map((cid) => {
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
                </div>
              ) : (
                <p className="text-xs leading-6 font-bold text-gray-700">
                  أداؤك متوازن في كل كفاءات هذا الموقف — افتح موقفًا جديدًا لوسّع أدلتك، فالخريطة تكتمل بالتنوع.
                </p>
              )}
            </div>

            {/* مفاهيم المكتبة المرتبطة */}
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

            <div className="flex gap-2.5">
              <button
                onClick={() => startScenario(scenario)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-primary/40 bg-white py-3 text-sm font-black text-primary"
              >
                <RotateCcw className="h-4.5 w-4.5" /> أعد المحاولة
              </button>
              <button
                onClick={() => setScenario(null)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground"
              >
                <Users className="h-4.5 w-4.5" /> موقف آخر
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
