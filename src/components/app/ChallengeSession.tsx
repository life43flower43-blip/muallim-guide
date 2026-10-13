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
    order: { icon: ListOrdered, cls: "bg-violet-100 text-violet-700" },
    fill: { icon: Puzzle, cls: "bg-sky-100 text-sky-700" },
    produce: { icon: PenLine, cls: "bg-amber-100 text-amber-700" },
  } as const;
  const M = map[kind];
  const Icon = M.icon;
  return (
    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${M.cls}`}>
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
      <h2 className="text-lg font-extrabold leading-8">{c.title}</h2>
      {/* الخطوط المرقمة */}
      <div className="space-y-2">
        {c.items.map((_, i) => {
          const item = placed[i];
          const isRight = graded !== null && item === c.items[i];
          const isWrongSpot = graded === false && item !== undefined && item !== c.items[i];
          return (
            <div
              key={i}
              className={`flex min-h-[52px] items-center gap-3 rounded-2xl border-2 border-dashed p-2 ${
                graded !== null && item !== undefined
                  ? isRight
                    ? "border-indigo-400 bg-indigo-50"
                    : isWrongSpot
                      ? "border-red-300 bg-red-50"
                      : "border-border bg-white"
                  : "border-border bg-white"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-black text-primary">
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
              className="rounded-full border-2 border-border bg-white px-4 py-2 text-sm font-bold shadow-sm"
            >
              {r}
            </motion.button>
          ))}
        </div>
      )}
      {graded === null && (
        <Button
          disabled={!full}
          onClick={() => onAnswer(placed.every((p, i) => p === c.items[i]))}
          className="h-13 w-full rounded-2xl bg-primary py-3 text-lg font-black text-primary-foreground"
        >
          تحقق من الترتيب
        </Button>
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
      <h2 className="text-lg font-extrabold leading-8">أكمل الفراغ بالكلمة الأنسب:</h2>
      <p className="rounded-2xl border border-border bg-white p-4 text-base font-bold leading-9">
        {c.before}{" "}
        <span
          className={`mx-1 inline-block min-w-24 rounded-xl border-2 border-dashed px-3 py-0.5 text-center ${
            chosen
              ? graded !== null
                ? chosen === c.right
                  ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                  : "border-red-300 bg-red-50 text-red-700"
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
              className={`rounded-full border-2 px-4 py-2 text-sm font-bold shadow-sm ${
                chosen === t ? "border-primary bg-accent text-primary" : "border-border bg-white"
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      )}
      {graded === null && (
        <Button
          disabled={!chosen}
          onClick={() => onAnswer(chosen === c.right)}
          className="h-13 w-full rounded-2xl bg-primary py-3 text-lg font-black text-primary-foreground"
        >
          تحقق من الإكمال
        </Button>
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
      <h2 className="text-lg font-extrabold leading-8">{c.prompt}</h2>
      {graded === null && !submitted && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-amber-900">
              <Sparkles className="h-3.5 w-3.5" /> عناصر يجب أن تظهر في كتابتك — تُرصد وهي حية
            </p>
            <ul className="space-y-1.5">
              {checks.map((g, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-2 text-xs font-bold ${
                    g.ok ? "text-indigo-700" : "text-amber-800"
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
                  words >= c.minWords ? "text-indigo-700" : "text-amber-800"
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
            className="w-full resize-none rounded-2xl border-2 border-border bg-white p-4 text-base leading-8 outline-none focus:border-primary"
          />
          <Button
            disabled={!allOk}
            onClick={() => setSubmitted(true)}
            className="h-12 w-full rounded-2xl bg-primary py-3 text-lg font-black text-primary-foreground"
          >
            أرسل إجابتي
          </Button>
          <p className="text-center text-[11px] font-bold text-muted-foreground">
            يُفتح الزر عند استيفاء كل العناصر — بعد الإرسال قارن بنموذج الإجابة واحكم على نفسك بأمانة
          </p>
        </>
      )}

      {(submitted || graded !== null) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="mb-1 text-xs font-black text-muted-foreground">كتابتك</p>
            <p className="whitespace-pre-wrap text-sm font-bold leading-8">{text}</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <button
              onClick={() => setShowModel((s) => !s)}
              className="flex w-full items-center justify-between text-sm font-black text-indigo-900"
            >
              <span>نموذج إجابة للمقارنة</span>
              <ArrowLeft className={`h-4 w-4 transition-transform ${showModel ? "rotate-90" : ""}`} />
            </button>
            {showModel && <p className="mt-2 text-sm leading-8 text-indigo-950">{c.model}</p>}
          </div>
          {graded === null && (
            <>
              {!showModel && (
                <p className="rounded-2xl bg-muted p-3 text-center text-xs font-bold leading-6 text-muted-foreground">
                  افتح النموذج واقرأ كتابتك ثم قارن — هل استوفيت الفكرة وجميع عناصرها؟
                </p>
              )}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => onAnswer(true)}
                  className="h-12 w-full rounded-2xl bg-indigo-600 text-base font-black text-white hover:bg-indigo-700"
                >
                  <Trophy className="ml-2 h-5 w-5" /> أنجزت بجدارة — احتسبها صحيحة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onAnswer(false)}
                  className="h-12 w-full rounded-2xl border-2 border-amber-300 bg-amber-50 text-base font-black text-amber-900 hover:bg-amber-100"
                >
                  <RotateCcw className="ml-2 h-5 w-5" /> تحتاج إعادة — احتسبها غير مكتملة
                </Button>
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
      <div className="flex h-dvh flex-col bg-background">
        <div className="safe-top flex items-center justify-between px-4 pb-2">
          <p className="text-lg font-black text-primary">نتيجة التحديات</p>
          <button onClick={clearChallenges} className="rounded-full bg-muted p-2" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
          <div className="pop-in flex flex-col items-center gap-3 py-4">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Trophy className="h-12 w-12" />
            </span>
            <h2 className="text-xl font-black">{msg}</h2>
          </div>
          <p className="mb-2 mt-4 px-1 text-sm font-extrabold text-muted-foreground">مراجعة التحديات</p>
          <div className="space-y-2">
            {review.map((r) => {
              const rc = set.find((x) => x.id === r.id)!;
              return (
                <div key={r.id} className="card-soft rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-start gap-3">
                    {r.ok ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-6">
                        {rc.kind === "order"
                          ? rc.title
                          : rc.kind === "fill"
                            ? `${rc.before} ـــــــ ${rc.after}`
                            : rc.prompt}
                      </p>
                      {!r.ok && rc.kind === "order" && (
                        <p className="mt-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold leading-6 text-indigo-800">
                          الترتيب الصحيح: {rc.items.join(" ← ")}
                        </p>
                      )}
                      {!r.ok && rc.kind === "fill" && (
                        <p className="mt-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800">
                          الإجابة: {rc.right}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="safe-bottom border-t border-border bg-white px-4 pt-3">
          <Button
            onClick={clearChallenges}
            className="h-14 w-full rounded-2xl bg-primary text-lg font-black text-primary-foreground"
          >
            <Trophy className="ml-2 h-5 w-5" /> متابعة رحلة التعلم
          </Button>
        </div>
      </div>
    );
  }

  // ---------- شاشة التحدي ----------
  const progress = (idx / set.length) * 100;

  return (
    <div className="tap-none flex h-dvh flex-col bg-background">
      <div className="safe-top px-4 pb-2 pt-2">
        <div className="mb-2 flex items-center gap-3">
          <button onClick={() => (review.length === 0 ? clearChallenges() : setExiting(true))} className="rounded-full p-1.5 text-muted-foreground" aria-label="خروج">
            <X className="h-6 w-6" />
          </button>
          <div className="progress-track h-3.5 flex-1">
            <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
            {ad(idx + 1)} من {ad(set.length)}
          </span>
        </div>
        <p className="text-center text-xs font-bold text-muted-foreground">التحديات الذكية</p>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <KindBadge kind={c.kind} />
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {c.domain}
              </span>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
                نقاط: {ad(CHALLENGE_XP[c.kind])}
              </span>
            </div>

            {c.kind === "order" && <OrderPlay c={c} graded={graded} onAnswer={answer} />}
            {c.kind === "fill" && <FillPlay c={c} graded={graded} onAnswer={answer} />}
            {c.kind === "produce" && <ProducePlay c={c} graded={graded} onAnswer={answer} />}

            <AnimatePresence>
              {graded !== null && c.kind !== "produce" && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div
                    className={`flex items-center gap-3 rounded-2xl border p-4 ${
                      graded ? "border-indigo-200 bg-indigo-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    {graded ? (
                      <CheckCircle2 className="h-8 w-8 shrink-0 text-indigo-600" />
                    ) : (
                      <XCircle className="h-8 w-8 shrink-0 text-red-500" />
                    )}
                    <div>
                      <p className={`font-black ${graded ? "text-indigo-800" : "text-red-700"}`}>
                        {graded ? "أحسنت! تحدٍّ مكتمل" : "لم يكتمل الترتيب كما ينبغي"}
                      </p>
                      {!graded && c.kind === "order" && (
                        <p className="mt-1 text-sm leading-7 text-red-700">
                          الترتيب الصحيح: {c.items.join(" ← ")}
                        </p>
                      )}
                      {!graded && c.kind === "fill" && (
                        <p className="mt-1 text-sm text-red-700">
                          الإجابة الصحيحة: <b>{c.right}</b>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm leading-7 text-sky-950">
                    <b className="text-sky-900">التفسير التربوي: </b>
                    {c.explain}
                  </p>
                </motion.div>
              )}
              {graded !== null && c.kind === "produce" && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm leading-7 text-sky-950">
                    <b className="text-sky-900">عناصر الإتقان في هذا التحدي: </b>
                    {c.tips.join(" • ")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="safe-bottom border-t border-border bg-white px-4 pt-3">
        {graded !== null && (
          <Button onClick={next} className="h-14 w-full rounded-2xl text-lg font-black text-primary-foreground bg-primary hover:bg-primary/90">
            {idx + 1 >= set.length ? "عرض النتيجة" : "التحدي التالي"}
          </Button>
        )}
        {graded === null && (
          <div className="flex h-11 items-center justify-center gap-2 text-xs font-bold text-muted-foreground">
            <Brain className="h-4 w-4" />
            تحدٍّ جديد من بنك التحديات — يُبنى عشوائيًا في كل جلسة
          </div>
        )}
      </div>

      <AlertDialog open={exiting} onOpenChange={setExiting}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>الخروج من التحديات؟</AlertDialogTitle>
            <AlertDialogDescription>تقدمك في هذه الجلسة سيُهدر، ويمكنك بدء جلسة جديدة في أي وقت.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">متابعة الجلسة</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-red-500 hover:bg-red-600"
              onClick={clearChallenges}
            >
              خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
