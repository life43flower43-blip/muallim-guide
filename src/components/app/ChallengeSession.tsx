"use client";

// جلسة التحديات الذكية — ثلاثة تفاعلات فوق الاختيار من متعدد:
// ترتيب: نقر الرقاقات لترتيبها في خطوط مرقمة — إكمال: اختيار كلمة الفراغ من رقاقات —
// إنتاج: كتابة مع قائمة عناصر واجبة حية ثم مقارنة بالنموذج وحكم ذاتي.
// تصميم متوافق مع أسلوب جلسة الأسئلة: تقدم، تغذية فورية، اهتزاز لطيف، شاشة نتيجة.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  X,
  Brain,
  PenLine,
  ListOrdered,
  Puzzle,
  Sparkles,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { Callout, Card, Chip, Divided, PrimaryButton, ProgressBar, Ring, ScreenShell, SecondaryButton } from "./ui-kit";
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
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad, arCount, WORD_FORMS } from "@/lib/arabic";
import {
  buildChallengeSet,
  CHALLENGE_KIND_LABEL,
  CHALLENGE_XP,
  produceCheck,
  produceSatisfied,
  wordCountOf,
  type Challenge,
  type FillChallenge,
  type OrderChallenge,
  type ProduceChallenge,
} from "@/lib/challenges";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function KindBadge({ kind }: { kind: Challenge["kind"] }) {
  const map = {
    order: { icon: ListOrdered, cls: "bg-accent text-accent-foreground" },
    fill: { icon: Puzzle, cls: "bg-muted text-secondary-foreground" },
    produce: { icon: PenLine, cls: "bg-gem-soft text-gem" },
  } as const;
  const M = map[kind];
  const Icon = M.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${M.cls}`}>
      <Icon className="h-3.5 w-3.5" /> {CHALLENGE_KIND_LABEL[kind]}
    </span>
  );
}

// ---------- تفاعل الترتيب ----------
function OrderPlay({
  c,
  graded,
  onAnswer,
}: {
  c: OrderChallenge;
  graded: null | boolean;
  onAnswer: (ok: boolean) => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const pool = useMemo(() => shuffle(c.items), [c]);
  const remaining = pool.filter((p) => !placed.includes(p));
  const full = placed.length === c.items.length;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold leading-8">{c.title}</h2>
      {/* الخطوط المرقمة */}
      <div className="space-y-2">
        {c.items.map((_, i) => {
          const item = placed[i];
          const isRight = graded !== null && item === c.items[i];
          const isWrongSpot = graded === false && item !== undefined && item !== c.items[i];
          return (
            <div
              key={i}
              className={`flex min-h-[52px] items-center gap-3 rounded-2xl border border-dashed p-2 ${
                graded !== null && item !== undefined
                  ? isRight
                    ? "border-success/40 bg-success-soft"
                    : isWrongSpot
                      ? "border-destructive/40 bg-danger-soft"
                      : "border-border bg-card"
                  : "border-border bg-card"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-primary">
                {ad(i + 1)}
              </span>
              {item ? (
                <button
                  disabled={graded !== null}
                  onClick={() => setPlaced((p) => p.filter((x) => x !== item))}
                  className="flex flex-1 items-center justify-between rounded-xl bg-accent px-3 py-2 text-right text-sm font-bold text-primary"
                >
                  {item}
                  {graded === null && <X className="h-4 w-4 text-muted-foreground" />}
                </button>
              ) : (
                <span className="text-xs font-bold text-muted-foreground">الموضع {ad(i + 1)}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* الرقاقات المتبقية */}
      {graded === null && remaining.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {remaining.map((r) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={r}
              onClick={() => setPlaced((p) => [...p, r])}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold"
            >
              {r}
            </motion.button>
          ))}
        </div>
      )}
      {graded === null && (
        <PrimaryButton
          disabled={!full}
          onClick={() => onAnswer(placed.every((p, i) => p === c.items[i]))}
          className="w-full"
        >
          تحقق من الترتيب
        </PrimaryButton>
      )}
    </div>
  );
}

// ---------- تفاعل الإكمال ----------
function FillPlay({
  c,
  graded,
  onAnswer,
}: {
  c: FillChallenge;
  graded: null | boolean;
  onAnswer: (ok: boolean) => void;
}) {
  const tokens = useMemo(() => shuffle([c.right, ...c.decoys]), [c]);
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold leading-8">أكمل الفراغ بالكلمة الأنسب:</h2>
      <p className="rounded-xl border border-border bg-card p-5 text-base leading-9">
        {c.before}{" "}
        <span
          className={`mx-1 inline-block min-w-24 rounded-xl border border-dashed px-3 py-0.5 text-center ${
            chosen
              ? graded !== null
                ? chosen === c.right
                  ? "border-success/40 bg-success-soft text-success"
                  : "border-destructive/40 bg-danger-soft text-destructive"
                : "border-primary bg-accent text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          {chosen ?? "ـــــــ"}
        </span>{" "}
        {c.after}
      </p>
      {graded === null && (
        <div className="flex flex-wrap gap-2">
          {tokens.map((t) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={t}
              onClick={() => setChosen(t)}
              className={`rounded-full border px-4 py-2 text-sm font-bold ${
                chosen === t ? "border-primary bg-accent text-primary" : "border-border bg-card"
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      )}
      {graded === null && (
        <PrimaryButton
          disabled={!chosen}
          onClick={() => onAnswer(chosen === c.right)}
          className="w-full"
        >
          تحقق من الإكمال
        </PrimaryButton>
      )}
    </div>
  );
}

// ---------- تفاعل الإنتاج الكتابي ----------
function ProducePlay({
  c,
  graded,
  onAnswer,
}: {
  c: ProduceChallenge;
  graded: null | boolean;
  onAnswer: (ok: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const words = wordCountOf(text);
  const checks = produceCheck(text, c.requires);
  const allOk = produceSatisfied(text, c, words);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold leading-8">{c.prompt}</h2>
      {graded === null && !submitted && (
        <>
          <div className="rounded-2xl border border-gem/30 bg-gem-soft p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gem">
              <Sparkles className="h-3.5 w-3.5" /> عناصر يجب أن تظهر في كتابتك — تُرصد وهي حية
            </p>
            <ul className="space-y-1.5">
              {checks.map((g, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-xs font-bold ${
                    g.ok ? "text-success" : "text-gem"
                  }`}
                >
                  {g.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>{g.anyOf.map((k) => `«${k}»`).join(" أو ")}</span>
                </li>
              ))}
              <li
                className={`flex items-center gap-2 text-xs font-bold ${
                  words >= c.minWords ? "text-success" : "text-gem"
                }`}
              >
                {words >= c.minWords ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>عدد الكلمات: {arCount(words, WORD_FORMS)} — الحد الأدنى {arCount(c.minWords, WORD_FORMS)}</span>
              </li>
            </ul>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="اكتب إجابتك هنا بلغتك الخاصة..."
            className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-base leading-8 outline-none focus:border-primary"
          />
          <PrimaryButton disabled={!allOk} onClick={() => setSubmitted(true)} className="w-full">
            أرسل إجابتي
          </PrimaryButton>
          <p className="text-center text-xs font-bold text-muted-foreground">
            يُفتح الزر عند استيفاء كل العناصر — بعد الإرسال قارن بنموذج الإجابة واحكم على نفسك بأمانة
          </p>
        </>
      )}

      {(submitted || graded !== null) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">كتابتك</p>
            <p className="whitespace-pre-wrap text-sm font-bold leading-8">{text}</p>
          </div>
          <div className="rounded-2xl border border-success/40 bg-success-soft p-4">
            <button
              onClick={() => setShowModel((s) => !s)}
              className="flex w-full items-center justify-between text-sm font-semibold text-success"
            >
              <span>نموذج إجابة للمقارنة</span>
              <ArrowLeft className={`h-4 w-4 transition-transform ${showModel ? "rotate-90" : ""}`} />
            </button>
            {showModel && <p className="mt-2 text-sm leading-8 text-success">{c.model}</p>}
          </div>
          {graded === null && (
            <>
              {!showModel && (
                <p className="rounded-2xl bg-muted p-3 text-center text-xs font-bold leading-6 text-muted-foreground">
                  افتح النموذج واقرأ كتابتك ثم قارن — هل استوفيت الفكرة وجميع عناصرها؟
                </p>
              )}
              <div className="grid grid-cols-1 gap-2">
                <PrimaryButton onClick={() => onAnswer(true)} className="w-full">
                  <CheckCircle2 className="h-4 w-4" /> استوفيت الفكرة، احتسبها صحيحة
                </PrimaryButton>
                <SecondaryButton onClick={() => onAnswer(false)} className="w-full">
                  <RotateCcw className="h-4 w-4" /> تحتاج إعادة، احتسبها غير مكتملة
                </SecondaryButton>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ---------- الجلسة ----------

export default function ChallengeSession() {
  const clearChallenges = useUi((s) => s.clearChallenges);
  const finishSession = useApp((s) => s.finishSession);
  const addChallengeStat = useApp((s) => s.addChallengeStat);
  const haptics = useApp((s) => s.haptics);

  const [set] = useState<Challenge[]>(() => buildChallengeSet());
  const [idx, setIdx] = useState(0);
  const [graded, setGraded] = useState<null | boolean>(null);
  const [review, setReview] = useState<{ id: string; ok: boolean }[]>([]);
  const [sessionXp, setSessionXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const startedAt = useRef(Date.now());

  const c = set[idx];

  useEffect(() => {
    if (finished && !recorded) {
      setRecorded(true);
      const correctCount = review.filter((r) => r.ok).length;
      finishSession({
        mode: "challenges",
        label: "التحديات الذكية",
        total: set.length,
        correctCount,
        xp: sessionXp,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      });
    }
  }, [finished, recorded, review, sessionXp, set.length, finishSession]);

  if (!c) return null;

  const answer = (ok: boolean) => {
    setGraded(ok);
    try {
      if ("vibrate" in navigator && haptics) navigator.vibrate(ok ? 35 : [60, 40, 60]);
    } catch {}
    if (ok) setSessionXp((x) => x + CHALLENGE_XP[c.kind]);
    addChallengeStat(c.id, ok);
    setReview((r) => [...r, { id: c.id, ok }]);
  };

  const next = () => {
    setGraded(null);
    if (idx + 1 >= set.length) setFinished(true);
    else setIdx((i) => i + 1);
  };

  // ---------- شاشة النتيجة ----------
  if (finished) {
    const correctCount = review.filter((r) => r.ok).length;
    const pct = (correctCount / set.length) * 100;
    const msg =
      pct === 100 ? "تحدي مكتمل! قمة الأداء" : pct >= 70 ? "أداء قوي، استمر" : "لا بأس — التحدي طريق الإتقان";
    return (
      <ScreenShell
        title="نتيجة التحديات"
        onClose={clearChallenges}
        footer={
          <PrimaryButton onClick={clearChallenges} className="w-full">
            إنهاء
          </PrimaryButton>
        }
      >
        <div className="flex flex-col items-center py-6 text-center">
          <Ring value={pct} size={120} stroke={10}>
            <span className="font-display text-2xl font-bold text-primary">{ad(Math.round(pct))}٪</span>
          </Ring>
          <h2 className="mt-5 font-display text-xl font-bold">{msg}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ad(correctCount)} من {ad(set.length)} صحيحة
          </p>
        </div>
        <Divided>
          {review.map((r) => {
            const rc = set.find((x) => x.id === r.id)!;
            return (
              <div key={r.id} className="flex items-start gap-3 px-4 py-4">
                {r.ok ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-7">{rc.kind === "order" ? rc.title : rc.kind === "fill" ? `${rc.before} ـــــ ${rc.after}` : rc.prompt}</p>
                  {!r.ok && rc.kind === "order" && <p className="mt-1 text-sm leading-6 text-success">الترتيب الصحيح: {rc.items.join("، ثم ")}</p>}
                  {!r.ok && rc.kind === "fill" && <p className="mt-1 text-sm text-success">الإجابة: {rc.right}</p>}
                </div>
              </div>
            );
          })}
        </Divided>
      </ScreenShell>
    );
  }

  // ---------- شاشة التحدي ----------
  const progress = (idx / set.length) * 100;

  return (
    <>
    <ScreenShell
      title="التحديات الذكية"
      sub={`التحدي ${ad(idx + 1)} من ${ad(set.length)}`}
      onClose={() => (review.length === 0 ? clearChallenges() : setExiting(true))}
      footer={
        graded !== null ? (
          <PrimaryButton onClick={next} className="w-full">
            {idx + 1 >= set.length ? "النتيجة" : "التحدي التالي"}
          </PrimaryButton>
        ) : undefined
      }
    >
      <ProgressBar value={progress} className="mb-5" />
      <AnimatePresence mode="wait">
        <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={c.kind} />
            <Chip>{c.domain}</Chip>
          </div>

          {c.kind === "order" && <OrderPlay c={c} graded={graded} onAnswer={answer} />}
          {c.kind === "fill" && <FillPlay c={c} graded={graded} onAnswer={answer} />}
          {c.kind === "produce" && <ProducePlay c={c} graded={graded} onAnswer={answer} />}

          {graded !== null && c.kind !== "produce" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <Callout tone={graded ? "success" : "danger"} icon={graded ? CheckCircle2 : XCircle} title={graded ? "أحسنت، تحدٍّ مكتمل" : "الإجابة غير مكتملة"}>
                {!graded && c.kind === "order" && <>الترتيب الصحيح: {c.items.join("، ثم ")}</>}
                {!graded && c.kind === "fill" && (
                  <>
                    الإجابة الصحيحة: <b>{c.right}</b>
                  </>
                )}
              </Callout>
              <Callout tone="info" icon={Brain} title="التفسير التربوي">
                {c.explain}
              </Callout>
            </motion.div>
          )}
          {graded !== null && c.kind === "produce" && (
            <Callout tone="info" icon={Brain} title="عناصر الإتقان في هذا التحدي">
              <ul className="list-disc space-y-1 pr-5">
                {c.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Callout>
          )}
        </motion.div>
      </AnimatePresence>
    </ScreenShell>

      <AlertDialog open={exiting} onOpenChange={setExiting}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>الخروج من التحديات؟</AlertDialogTitle>
            <AlertDialogDescription>تقدمك في هذه الجلسة سيُهدر، ويمكنك بدء جلسة جديدة في أي وقت.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">متابعة الجلسة</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive hover:bg-destructive"
              onClick={clearChallenges}
            >
              خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
