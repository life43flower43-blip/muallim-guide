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
import { Card, PrimaryButton, ScreenShell } from "./ui-kit";

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
    <ScreenShell
      title="لعبة المطابقة"
      sub="صِل كل مصطلح بشرحه المختصر"
      onClose={close}
      footer={
        finished ? (
          <PrimaryButton onClick={restart} className="w-full">
            <RotateCcw className="h-4 w-4" /> جولة جديدة
          </PrimaryButton>
        ) : undefined
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { icon: Timer, value: ad(elapsed), label: "ثانية" },
          { icon: Flame, value: ad(mistakes), label: "أخطاء" },
          { icon: Puzzle, value: `${ad(matchedCount)} من ${ad(6)}`, label: "أزواج" },
        ].map((x) => (
          <Card key={x.label} className="flex flex-col items-center gap-0.5 py-3">
            <span className="flex items-center gap-1.5 text-base font-semibold tabular-nums">
              <x.icon className="h-4 w-4 text-primary" />
              {x.value}
            </span>
            <span className="text-xs text-muted-foreground">{x.label}</span>
          </Card>
        ))}
      </div>

      {finished ? (
        <Card className="flex flex-col items-center p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
            <Trophy className="h-7 w-7" />
          </span>
          <p className="mt-3 font-display text-lg font-semibold">{mistakes === 0 ? "مطابقة كاملة بلا خطأ" : "أكملت المطابقة"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            في {ad(elapsed)} ثانية، وبأخطاء عددها {ad(mistakes)}.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((t) => {
              const st = stateOf(t);
              return (
                <motion.button
                  key={`${round}-${t.key}`}
                  type="button"
                  disabled={st === "matched"}
                  animate={st === "wrong" ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  onClick={() => tap(t)}
                  className={`flex min-h-[96px] items-center justify-center rounded-xl border p-3 text-center leading-6 transition-colors ${
                    t.kind === "term" ? "text-base font-semibold" : "text-sm"
                  } ${
                    st === "matched"
                      ? "border-transparent bg-muted text-muted-foreground/40"
                      : st === "sel"
                        ? "border-primary bg-accent text-accent-foreground ring-2 ring-primary"
                        : st === "wrong"
                          ? "border-destructive bg-danger-soft text-destructive"
                          : "border-border bg-card hover:bg-muted/60"
                  }`}
                >
                  {t.text}
                </motion.button>
              );
            })}
          </div>
          {!started && <p className="mt-4 text-center text-sm text-muted-foreground">يبدأ المؤقت مع أول ضغطة.</p>}
        </>
      )}
    </ScreenShell>
  );
}
