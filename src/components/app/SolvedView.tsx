"use client";
// أسئلة محلولة داخل التطبيق: المحاور أولًا، ثم سؤال واحد في كل شاشة بخياراته،
// ويضغط المتعلم «أظهر الحل» فتظهر الإجابة الصحيحة وشرحها، ثم «التالي» أو «السابق».
import { useMemo, useState } from "react";
import { BookOpen, ChevronLeft, CircleCheck, Lightbulb } from "lucide-react";
import { CONCEPTS, COURSES, COURSE_SHORT, OPTION_LETTERS, QUESTIONS, useQbankDetail } from "@/lib/qbank";
import type { Question } from "@/lib/types";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { ScreenShell } from "./ui-kit";
import { ConceptReader } from "./ConceptsView";

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

function Solve({ title, qs, onBack }: { title: string; qs: Question[]; onBack: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [reader, setReader] = useState<string | null>(null);
  const q = qs[i];
  const open = !!shown[q.id];
  const concept = CONCEPTS.find((c) => c.id === q.conceptId);
  return (
    <ScreenShell
      title={title}
      onBack={onBack}
      footer={
        <>
          <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="h-12 flex-1 rounded-[16px] bg-[#C5E5DF]/50 text-[15px] font-extrabold text-[#14302A] disabled:opacity-40 dark:text-foreground">
            السابق
          </button>
          <button type="button" disabled={i === qs.length - 1} onClick={() => setI(i + 1)} className="h-12 flex-[1.4] rounded-[16px] bg-[#168477] text-[15px] font-extrabold text-white disabled:opacity-40">
            التالي
          </button>
        </>
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-extrabold text-[#168477]">{`السؤال ${ad(i + 1)}`}</p>
        <span className="text-[14px] font-bold text-muted-foreground">{`${ad(i + 1)} / ${ad(qs.length)}`}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#C5E5DF]/60">
        <div className="h-full rounded-full bg-[#168477] transition-[width] duration-300" style={{ width: `${((i + 1) / qs.length) * 100}%` }} />
      </div>

      <h2 className="mt-5 text-[19px] font-extrabold leading-9 text-foreground">{q.question}</h2>

      <div className="mt-4 space-y-2.5">
        {q.options.map((o, k) => {
          const right = open && o.isCorrect;
          return (
            <div
              key={k}
              className={cn(
                "flex items-start gap-3 rounded-[16px] border-2 bg-white px-3 py-3 dark:bg-card",
                right ? "border-[#1E7A45] bg-[#DCF2E3] dark:bg-[#1E7A45]/20" : "border-[var(--t075)] dark:border-border",
                open && !o.isCorrect && "opacity-60"
              )}
            >
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold", right ? "bg-[#1E7A45] text-white" : "bg-[#C5E5DF]/60 text-[#14302A] dark:text-foreground")}>
                {OPTION_LETTERS[k] ?? k + 1}
              </span>
              <span className="pt-0.5 text-[15px] font-bold leading-7 text-foreground">{o.text}</span>
            </div>
          );
        })}
      </div>

      {!open ? (
        <button type="button" onClick={() => setShown((s) => ({ ...s, [q.id]: true }))} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-[#168477] text-[15px] font-extrabold text-[#168477]">
          <CircleCheck className="h-5 w-5" /> أظهر الحل
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="flex gap-2 rounded-[16px] bg-[#F1F8F6] px-4 py-3 text-[15px] leading-8 text-foreground dark:bg-white/5">
            <Lightbulb className="mt-2 h-4 w-4 shrink-0 text-[#168477]" />
            <span>{q.reason}</span>
          </div>
          {concept && (
            <button type="button" onClick={() => setReader(concept.id)} className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#C5E5DF]/50 text-[15px] font-extrabold text-[#14302A] dark:text-foreground">
              <BookOpen className="h-4 w-4" /> اقرأ شرح المفهوم
            </button>
          )}
        </div>
      )}
      {reader && <ConceptReader conceptId={reader} onClose={() => setReader(null)} />}
    </ScreenShell>
  );
}

export default function SolvedView({ onClose }: { onClose: () => void }) {
  const ready = useQbankDetail();
  const groups = useMemo(
    () => (ready ? COURSES.map((c) => ({ id: c.id, name: COURSE_SHORT[c.id] ?? c.name, qs: pick(c.id) })).filter((g) => g.qs.length > 0) : []),
    [ready]
  );
  const [open, setOpen] = useState<string | null>(null);
  const g = groups.find((x) => x.id === open);
  return (
    <>
      <ScreenShell title="أسئلة محلولة" onBack={onClose}>
        {!ready ? (
          <p className="py-10 text-center text-sm text-muted-foreground">جارٍ تحميل الأسئلة…</p>
        ) : (
          <div className="rounded-[18px] border border-[var(--t075)] bg-white px-3 dark:border-border dark:bg-card">
            {groups.map((x) => (
              <button key={x.id} type="button" onClick={() => setOpen(x.id)} className="flex min-h-[52px] w-full items-center gap-2 border-b border-[var(--t075)] px-1 text-right last:border-b-0 active:bg-[var(--t050)] dark:border-border">
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-foreground">{x.name}</span>
                <span className="text-[13px] font-bold text-muted-foreground">{ad(x.qs.length)}</span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </ScreenShell>
      {g && <Solve key={g.id} title={g.name} qs={g.qs} onBack={() => setOpen(null)} />}
    </>
  );
}
