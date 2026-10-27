"use client";

// اختباراتك السابقة: آخر الجلسات بنتائجها — تُعرض في «حسابي»
import { useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { useApp } from "@/lib/store";
import { ad, arCount, QUESTION_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { Divided, SectionHeader, pct } from "./ui-kit";
import { FitText } from "./FitText";

const TEST_MODES = new Set(["training", "exam", "review", "redo", "proficiency", "quick", "intensive"]);
const dateFmt = new Intl.DateTimeFormat("ar-u-nu-arab", { day: "numeric", month: "short" });
const fmtDur = (s: number) => (s < 60 ? `${ad(s)} ث` : `${ad(Math.round(s / 60))} د`);

export default function PastTests() {
  const sessions = useApp((s) => s.sessions);
  const [showAll, setShowAll] = useState(false);
  const tests = useMemo(() => [...sessions].filter((s) => TEST_MODES.has(s.mode) && s.total > 0).sort((a, b) => b.ts - a.ts), [sessions]);
  if (tests.length === 0) return null;
  return (
    <section>
      <SectionHeader
        title="اختباراتك السابقة"
        action={
          tests.length > 5 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="min-h-[36px] text-sm font-bold text-[#B8860B]">
              {showAll ? "أقل" : `عرض الكل (${ad(tests.length)})`}
            </button>
          )
        }
      />
      <Divided>
        {(showAll ? tests.slice(0, 30) : tests.slice(0, 5)).map((t) => {
          const v = (t.correctCount / t.total) * 100;
          return (
            <div key={t.id} className="flex min-h-[60px] min-w-0 items-center gap-3 px-4 py-3">
              <ListChecks className="h-5 w-5 shrink-0 text-[var(--t700)]" />
              <div className="min-w-0 flex-1">
                <FitText max={17} min={12} className="font-bold leading-7">{t.label}</FitText>
                <p className="text-sm text-muted-foreground">
                  {dateFmt.format(new Date(t.ts))}، {arCount(t.total, QUESTION_FORMS)}، {fmtDur(t.durationSec)}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-sm font-bold", v >= 70 ? "bg-[var(--t100)] text-[var(--t800)]" : v >= 50 ? "bg-[#FBF1D6] text-[#9A6A12]" : "bg-danger-soft text-destructive")}>{pct(v)}</span>
            </div>
          );
        })}
      </Divided>
    </section>
  );
}
