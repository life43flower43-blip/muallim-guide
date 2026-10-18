"use client";

// لعبة المطابقة — من نمط Quizlet «ألعاب التذكر المعرفي»:
// ست بطاقات مصطلح وست بطاقات شرح مصغّر مبعثرة، تضرب الزوجين المتقابلين
// قبل أن تنتهي متتاليتك — مؤقت صاعد وعدّاد أخطاء ونقاط خبرة.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Puzzle, Timer, Flame, RotateCcw, Trophy, Sparkles } from "lucide-react";
import { CONCEPTS, conceptById, shuffle } from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import { NewBadge } from "./shared";

interface Tile {
  key: string; // معرف فريد للبلاطة
  cid: string; // معرف المفهوم — أداة المطابقة
  text: string;
  kind: "term" | "def";
}

/** شرح مصغّر للمطابقة: أول جملة من الشرح مقطوعة عند حدود معقولة */
function shortDef(explanation: string): string {
  const end = explanation.search(/[.؛]/);
  const first = end > 20 ? explanation.slice(0, end) : explanation;
  const words = first.split(/\s+/);
  if (words.length > 9) return words.slice(0, 9).join(" ") + " ...";
  return first;
}

export default function MatchGameView() {
  const close = useUi((s) => s.clearMatch);
  const finishSession = useApp((s) => s.finishSession);
  const conceptReads = useApp((s) => s.conceptReads);

  const [round, setRound] = useState(0); // مفتاح الجولة — يجدد التوزيع
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<Record<string, boolean>>({}); // بمفتاح cid
  const [wrongShake, setWrongShake] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tiles: Tile[] = useMemo(() => {
    // المفضلة للمفاهيم المقروءة — وإلا عشوائي من كل المكتبة
    const readIds = Object.keys(conceptReads);
    let pool = CONCEPTS.filter((c) => readIds.includes(c.id) && c.explanation.length > 60);
    if (pool.length < 6) pool = CONCEPTS.filter((c) => c.explanation.length > 60);
    const six = shuffle(pool).slice(0, 6);
    const t: Tile[] = [];
    for (const c of six) {
      t.push({ key: `t-${c.id}`, cid: c.id, text: c.title, kind: "term" });
      t.push({ key: `d-${c.id}`, cid: c.id, text: shortDef(c.explanation), kind: "def" });
    }
    return shuffle(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const matchedCount = Object.keys(matched).length;

  // المؤقت الصاعد
  useEffect(() => {
    if (started && !finished) {
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }
  }, [started, finished]);

  // الإنهاء عند اكتمال الأزواج
  useEffect(() => {
    if (started && matchedCount === 6 && !finished) {
      setFinished(true);
      const xp = Math.max(15, 60 - mistakes * 5);
      finishSession({
        mode: "match",
        label: "لعبة المطابقة",
        total: 6,
        correctCount: 6,
        xp,
        durationSec: elapsed,
      });
    }
  }, [matchedCount, started, finished, mistakes, elapsed, finishSession]);

  const tap = (tile: Tile) => {
    if (finished || matched[tile.cid]) return;
    if (!started) setStarted(true);

    if (selected.length === 0) {
      setSelected([tile.key]);
      return;
    }
    const first = tiles.find((t) => t.key === selected[0]);
    if (!first) {
      setSelected([tile.key]);
      return;
    }
    if (first.key === tile.key) {
      setSelected([]); // نقر البلاطة نفسها — إلغاء
      return;
    }
    if (first.cid === tile.cid && first.kind !== tile.kind) {
      // إصابة
      setMatched((m) => ({ ...m, [tile.cid]: true }));
      setSelected([]);
    } else {
      // خطأ — اهتزاز خاطف
      setMistakes((n) => n + 1);
      setWrongShake(tile.key);
      setTimeout(() => {
        setWrongShake(null);
        setSelected([]);
      }, 480);
    }
  };

  const restart = () => {
    setRound((r) => r + 1);
    setSelected([]);
    setMatched({});
    setMistakes(0);
    setElapsed(0);
    setStarted(false);
    setFinished(false);
  };

  const isSel = (key: string) => selected.includes(key);
  const stateOf = (t: Tile) =>
    matched[t.cid] ? "matched" : wrongShake === t.key ? "wrong" : isSel(t.key) ? "sel" : "idle";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="mx-auto max-w-lg px-4 pb-16 pt-5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Puzzle className="h-5 w-5" /> لعبة المطابقة
            <NewBadge tone="violet" />
          </p>
          <button
            onClick={close}
            aria-label="إغلاق اللعبة"
            className="rounded-full bg-muted p-2.5 text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1.5 text-xs font-bold leading-5 text-muted-foreground">
          صِل كل مصطلح بشرحه المصغّر — البلاطتان المتقابلتان تختفيان، والأخطاء تُحسب عليك
        </p>

        {/* شريط الحالة */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tabular-nums">{ad(elapsed)}</span>
            <span className="text-xs font-bold text-muted-foreground">ثانية</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5">
            <Flame className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold tabular-nums">{ad(mistakes)}</span>
            <span className="text-xs font-bold text-muted-foreground">خطأ</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5">
            <Puzzle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold tabular-nums">{ad(matchedCount)}/{ad(6)}</span>
            <span className="text-xs font-bold text-muted-foreground">أزواج</span>
          </div>
        </div>

        {/* شبكة البلاطات */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {tiles.map((t) => {
            const st = stateOf(t);
            return (
              <motion.button
                key={`${round}-${t.key}`}
                whileTap={st === "idle" || st === "sel" ? { scale: 0.94 } : undefined}
                animate={
                  st === "wrong"
                    ? { x: [0, -6, 6, -4, 4, 0] }
                    : st === "matched"
                      ? { scale: [1, 1.08, 0.96] }
                      : {}
                }
                transition={{ duration: 0.4 }}
                onClick={() => tap(t)}
                className={`flex min-h-[86px] items-center justify-center rounded-2xl border p-2.5 text-center text-[10.5px] font-semibold leading-4 transition-colors ${
                  st === "matched"
                    ? "border-border bg-muted text-muted-foreground/50"
                    : st === "sel"
                      ? t.kind === "term"
                        ? "border-primary bg-primary text-white"
                        : "border-amber-500 bg-amber-400 text-gem"
                      : st === "wrong"
                        ? "border-destructive/40 bg-danger-soft text-destructive"
                        : t.kind === "term"
                          ? "border-primary/25 bg-accent text-foreground"
                          : "border-gem/30 bg-gem-soft text-foreground"
                }`}
              >
                {t.text}
              </motion.button>
            );
          })}
        </div>

        {/* مفتاح الألوان */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-accent ring-1 ring-primary/25" /> المصطلح
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-gem-soft ring-1 ring-amber-200" /> الشرح المصغّر
          </span>
        </div>

        {/* شاشة الختام */}
        {finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-5 rounded-2xl border border-border bg-card p-6 text-center"
          >
            <Trophy className="mx-auto h-10 w-10 text-amber-500" />
            <p className="mt-2 text-lg font-semibold">
              {mistakes === 0 ? "مطابقة كاملة بلا خطأ — ذاكرة صفّية حادة!" : "أكملت المطابقة"}
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              الزمن {ad(elapsed)} ثانية — والأخطاء {ad(mistakes)}
              {mistakes === 0 ? "" : " — أعد الجولة لتخفيضها"}
            </p>
            <p className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> أضيفت لك نقاط خبرة على هذا الأداء
            </p>
            <Button
              onClick={restart}
              className="mt-4 h-12 w-full rounded-2xl bg-primary text-sm font-semibold"
            >
              <RotateCcw className="ml-1.5 h-4 w-4" /> جولة جديدة بمفاهيم أخرى
            </Button>
          </motion.div>
        )}

        {!started && !finished && (
          <p className="mt-4 text-center text-xs font-bold text-muted-foreground">
            اضغط أي بلاطة لتبدأ — المؤقت يتحرك مع أول لمسة
          </p>
        )}
      </div>
    </motion.div>
  );
}
