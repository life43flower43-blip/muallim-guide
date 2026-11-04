"use client";
// مراجعة اليوم: ما أجبته صحيحًا وحان موعد تذكّره (بعد يوم، ثم ٣ أيام، ثم أسبوع...)
import { useMemo } from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { spacedDueIds } from "@/lib/srs";
import { arCount, QUESTION_GEN_FORMS } from "@/lib/arabic";
import { FitText } from "./FitText";

export default function DailyReviewCard() {
  const ui = useUi();
  const attempts = useApp((s) => s.attempts);
  const due = useMemo(() => spacedDueIds(attempts), [attempts]);
  if (due.length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => ui.startQuiz({ mode: "training", label: "مراجعة اليوم", qids: due.slice(0, 15) })}
      className="flex w-full min-w-0 items-center gap-3 rounded-[22px] border border-[#ECE3C4] bg-white p-3.5 text-right transition active:scale-[0.98] dark:bg-card"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FBF3DA] text-[#C9971C]">
        <RotateCcw className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <FitText max={16} min={12} className="font-extrabold leading-7">مراجعة اليوم</FitText>
        <FitText max={13} min={10} className="text-secondary-foreground">{`حان موعد تذكّر ${arCount(Math.min(due.length, 15), QUESTION_GEN_FORMS)}`}</FitText>
      </span>
      <ChevronLeft className="h-5 w-5 shrink-0 text-[#C9971C]" />
    </button>
  );
}
