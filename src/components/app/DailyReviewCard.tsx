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
      className="flex w-full min-w-0 items-center gap-3 rounded-[18px] border border-[#DCEEEA] bg-[#F4FAF8] p-3 dark:border-border text-right transition active:scale-[0.98] dark:bg-card"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C5E5DF] text-[#168477]">
        <RotateCcw className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <FitText max={15} min={12} className="font-extrabold leading-7">{`مراجعة اليوم · ${arCount(Math.min(due.length, 15), QUESTION_GEN_FORMS)}`}</FitText>
      </span>
      <ChevronLeft className="h-5 w-5 shrink-0 text-[#168477]" />
    </button>
  );
}
