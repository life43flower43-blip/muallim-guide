"use client";

// «صحيحة أم خاطئة؟» — المفاهيم الخاطئة الشائعة في التربية:
// عبارة واحدة في كل مرة، يحكم عليها المتعلم ثم يقرأ الصواب وسببه وأثره في الصف
import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { MISCONCEPTIONS } from "@/lib/misconceptions";
import { shuffle } from "@/lib/qbank";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { PrimaryButton, ProgressBar, ScreenShell, SecondaryButton } from "./ui-kit";

export default function MisconceptionsView() {
  const clear = useUi((s) => s.clearMyths);
  const [order, setOrder] = useState(() => shuffle(MISCONCEPTIONS));
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= order.length;
  const item = order[Math.min(i, order.length - 1)];
  const correct = answer !== null && answer === item.isTrue;

  const choose = (v: boolean) => {
    if (answer !== null) return;
    setAnswer(v);
    if (v === item.isTrue) setScore((s) => s + 1);
  };
  const next = () => { setAnswer(null); setI((n) => n + 1); };
  const restart = () => { setOrder(shuffle(MISCONCEPTIONS)); setI(0); setAnswer(null); setScore(0); };

  return (
    <ScreenShell title="مفاهيم خاطئة شائعة" onClose={clear}>
      {done ? (
        <div className="space-y-5 py-6 text-center">
          <p className="text-lg font-extrabold">أصبت الحكم في {ad(score)} من {ad(order.length)}</p>
          <p className="leading-7 text-secondary-foreground">كل عبارة صححتها هنا تصحح فكرة يتداولها كثير من المعلمين.</p>
          <PrimaryButton onClick={restart} className="w-full"><RotateCcw className="h-4 w-4" /> ابدأ من جديد</PrimaryButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold text-[var(--t500)]">
            <ProgressBar value={(i / order.length) * 100} className="flex-1" />
            <span>{ad(i + 1)} من {ad(order.length)}</span>
          </div>

          <div className="rounded-[22px] border border-[var(--t075)] bg-white p-5 dark:border-border dark:bg-card">
            <p className="mb-2 text-sm font-bold text-[var(--t500)]">هل هذه العبارة صحيحة؟</p>
            <p className="text-lg font-extrabold leading-9">«{item.claim}»</p>
          </div>

          {answer === null ? (
            <div className="grid grid-cols-2 gap-3">
              <SecondaryButton onClick={() => choose(true)}>صحيحة</SecondaryButton>
              <SecondaryButton onClick={() => choose(false)}>خاطئة</SecondaryButton>
            </div>
          ) : (
            <div className="space-y-3">
              <p className={cn("flex items-center gap-2 rounded-[16px] px-4 py-3 font-bold", correct ? "bg-[var(--t100)] text-[var(--t900)]" : "bg-danger-soft text-destructive")}>
                {correct ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                {correct ? "حكم صحيح." : "ليس تمامًا."} العبارة {item.isTrue ? "صحيحة" : "خاطئة"}.
              </p>
              <div className="space-y-3 rounded-[22px] border border-[var(--t075)] bg-white p-5 dark:border-border dark:bg-card">
                <section>
                  <h3 className="mb-1 text-sm font-extrabold text-[var(--t600)]">الصواب</h3>
                  <p className="font-bold leading-8">{item.fact}</p>
                </section>
                <section>
                  <h3 className="mb-1 text-sm font-extrabold text-[var(--t600)]">لماذا؟</h3>
                  <p className="leading-8 text-secondary-foreground">{item.why}</p>
                </section>
                <section>
                  <h3 className="mb-1 text-sm font-extrabold text-[#9A6A12]">في الصف</h3>
                  <p className="leading-8 text-secondary-foreground">{item.classroom}</p>
                </section>
              </div>
              <PrimaryButton onClick={next} className="w-full">{i + 1 < order.length ? "التالية" : "النتيجة"}</PrimaryButton>
            </div>
          )}
        </div>
      )}
    </ScreenShell>
  );
}
