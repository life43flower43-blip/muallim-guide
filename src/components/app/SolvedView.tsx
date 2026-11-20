"use client";
// أسئلة محلولة داخل التطبيق: قائمة المحاور، والضغط على محور يفتح أسئلته في محرك التدريب نفسه:
// إجابة فورية بالصح والخطأ والشرح، وعدّادات، وتُحفظ الأخطاء في «أخطائي».
import { useMemo } from "react";
import { CONCEPTS, COURSES, COURSE_SHORT, QUESTIONS, useQbankDetail } from "@/lib/qbank";
import type { Question } from "@/lib/types";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { GameTile, ScreenShell } from "./ui-kit";

const EMO: Record<string, string> = {
  M1: "🌱", M2: "🧠", M3: "💡", M4: "📊", M5: "🧑‍🏫", SE1: "🤝", F1: "🏛️", AI1: "🤖", G1: "📚", C1: "🛠️", L1: "🧭", R1: "🧩",
};

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
          <div className="grid grid-cols-2 gap-2.5">
            {groups.map((x, k) => (
              <GameTile key={x.id} tone={k} emoji={EMO[x.id] ?? "📚"} title={x.name} meta={ad(x.qs.length)} onClick={() => start(x)} />
            ))}
          </div>
        )}
      </ScreenShell>
  );
}
