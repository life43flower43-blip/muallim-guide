"use client";
// أسئلة محلولة داخل التطبيق: قائمة المحاور، والضغط على محور يفتح أسئلته في محرك التدريب نفسه:
// إجابة فورية بالصح والخطأ والشرح، وعدّادات، وتُحفظ الأخطاء في «أخطائي».
import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { CONCEPTS, COURSES, COURSE_SHORT, QUESTIONS, useQbankDetail } from "@/lib/qbank";
import type { Question } from "@/lib/types";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { ScreenShell } from "./ui-kit";

const PER_COURSE = 12;

/** أسئلة اختيار من متعدد لها شرح كافٍ، كل سؤال من مفهوم مختلف */
function pick(courseId: string): Question[] {
  const courseOf = new Map(CONCEPTS.map((c) => [c.id, c.courseId]));
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of QUESTIONS) {
    if (out.length >= PER_COURSE) break;
    if (courseOf.get(q.conceptId) !== courseId || q.type !== "mcq" || seen.has(q.conceptId) || (q.reason ?? "").length < 60) continue;
    seen.add(q.conceptId);
    out.push(q);
  }
  return out;
}

export default function SolvedView({ onClose }: { onClose: () => void }) {
  const ready = useQbankDetail();
  const groups = useMemo(
    () => (ready ? COURSES.map((c) => ({ id: c.id, name: COURSE_SHORT[c.id] ?? c.name, qs: pick(c.id) })).filter((g) => g.qs.length > 0) : []),
    [ready]
  );
  const ui = useUi();
  const start = (g: (typeof groups)[number]) => {
    onClose();
    ui.startQuiz({ mode: "training", label: `أسئلة محلولة: ${g.name}`, qids: g.qs.map((q) => q.id) });
  };
  return (
      <ScreenShell title="أسئلة محلولة" onBack={onClose}>
        {!ready ? (
          <p className="py-10 text-center text-sm text-muted-foreground">جارٍ تحميل الأسئلة…</p>
        ) : (
          <div className="rounded-[18px] border border-[var(--t075)] bg-white px-3 dark:border-border dark:bg-card">
            {groups.map((x) => (
              <button key={x.id} type="button" onClick={() => start(x)} className="flex min-h-[52px] w-full items-center gap-2 border-b border-[var(--t075)] px-1 text-right last:border-b-0 active:bg-[var(--t050)] dark:border-border">
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-foreground">{x.name}</span>
                <span className="text-[13px] font-bold text-muted-foreground">{ad(x.qs.length)}</span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </ScreenShell>
  );
}
