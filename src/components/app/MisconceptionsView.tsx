"use client";

// «صحيحة أم خاطئة؟» — المفاهيم الخاطئة الشائعة في التربية:
// عبارة واحدة في كل مرة، يحكم عليها المتعلم ثم يقرأ الصواب وسببه وأثره في الصف.
// العبارات في جولات من عشر، وكل جولة تكمل من حيث انتهت السابقة.
import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { MISCONCEPTIONS } from "@/lib/misconceptions";
import { shuffle } from "@/lib/qbank";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { PrimaryButton, ProgressBar, ScreenShell, SecondaryButton } from "./ui-kit";

const ROUND = 10;

export default function MisconceptionsView() {
  const clear = useUi((s) => s.clearMyths);
  const [order, setOrder] = useState(() => shuffle(MISCONCEPTIONS));
  const [start, setStart] = useState(0);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const end = Math.min(start + ROUND, order.length);
  const done = i >= end;
  const item = order[Math.min(i, order.length - 1)];
  const correct = answer !== null && answer === item.isTrue;

  const choose = (v: boolean) => {
    if (answer !== null) return;
    setAnswer(v);
    if (v === item.isTrue) setScore((s) => s + 1);
  };
  const next = () => { setAnswer(null); setI((n) => n + 1); };
  const nextRound = () => {
    if (end >= order.length) { setOrder(shuffle(MISCONCEPTIONS)); setStart(0); setI(0); }
    else setStart(end);
    setAnswer(null); setScore(0);
  };

  return (
    <ScreenShell title="مفاهيم خاطئة شائعة" onClose={clear}>
      {done ? (
        <div className="space-y-5 py-6 text-center">
          <p className="text-lg font-extrabold">أصبت الحكم في {ad(score)} من {ad(end - start)}</p>
          <p className="leading-7 text-secondary-foreground">أنهيت {ad(end)} من {ad(order.length)} عبارة.</p>
          <PrimaryButton onClick={nextRound} className="w-full">
            {end >= order.length ? <><RotateCcw className="h-4 w-4" /> ابدأ من جديد</> : "الجولة التالية"}
          </PrimaryButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm font-bold text-[var(--t500)]">
            <ProgressBar value={((i - start) / (end - start)) * 100} className="flex-1" />
            <span>{ad(i - start + 1)} من {ad(end - start)}</span>
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
              <PrimaryButton onClick={next} className="w-full">{i + 1 < end ? "التالية" : "النتيجة"}</PrimaryButton>
            </div>
          )}
        </div>
      )}
    </ScreenShell>
  );
}
