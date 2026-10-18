"use client";

// ============================================================================
// «أنشئ اختبارك» — منشئ اختبار مخصص على نمط UWorld وKaplan
// ============================================================================
// النمط: تعلّم (شرح بعد كل سؤال) أو اختبار موقوت (الشرح في التقرير).
// مصدر الأسئلة: لم أجب عنها، أو أخطأت فيها، أو الكل. والصعوبة.
// المقررات والفصول باختيار متعدد، ولكل منها عدد الأسئلة المتاحة وفق التصفية.
// ============================================================================

import { useMemo, useState } from "react";
import { Check, ChevronDown, GraduationCap, Minus, Timer } from "lucide-react";
import { COURSES, COURSE_SHORT, chaptersOfCourse, questionsOfChapter, shuffle } from "@/lib/qbank";
import { topicKey } from "@/lib/practice-bank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import type { Difficulty, Question } from "@/lib/types";
import { ad, arCount, MINUTE_FORMS, QUESTION_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { Card, PrimaryButton, ScreenShell, SectionHeader } from "./ui-kit";

type Mode = "tutor" | "timed";
type Pool = "unused" | "wrong" | "all";

const SEC_PER_QUESTION = 60;
const SIZES = [10, 20, 40, 60];
const DIFFS: Difficulty[] = ["سهل", "متوسط", "صعب"];
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; title: string; sub?: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-xl border p-3 text-right transition-colors",
            value === o.id ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:bg-muted/60"
          )}
        >
          <span className="block text-sm font-medium">{o.title}</span>
          {o.sub && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function CheckBox({ state }: { state: "on" | "off" | "some" }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
        state === "off" ? "border-input bg-card" : "border-primary bg-primary text-primary-foreground"
      )}
      aria-hidden="true"
    >
      {state === "on" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {state === "some" && <Minus className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  );
}

export default function TestBuilder({ onClose }: { onClose: () => void }) {
  const attempts = useApp((s) => s.attempts);
  const startQuiz = useUi((s) => s.startQuiz);
  const [mode, setMode] = useState<Mode>("tutor");
  const [pool, setPool] = useState<Pool>("unused");
  const [diffs, setDiffs] = useState<Difficulty[]>(DIFFS);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(COURSES.flatMap((c) => chaptersOfCourse(c.id).map((ch) => topicKey(c.id, ch)))));
  const [openCourse, setOpenCourse] = useState<string | null>(null);
  const [size, setSize] = useState(20);

  // الأسئلة المتاحة لكل فصل وفق المصدر والصعوبة
  const available = useMemo(() => {
    const keep = (q: Question) => {
      if (!diffs.includes(q.difficulty)) return false;
      const a = attempts[q.id];
      if (pool === "unused") return !a;
      if (pool === "wrong") return !!a && !a.correct;
      return true;
    };
    const map = new Map<string, string[]>();
    for (const c of COURSES) for (const ch of chaptersOfCourse(c.id)) map.set(topicKey(c.id, ch), questionsOfChapter(c.id, ch).filter(keep).map((q) => q.id));
    return map;
  }, [attempts, pool, diffs]);

  const countOf = (keys: string[]) => keys.reduce((n, k) => n + (available.get(k)?.length ?? 0), 0);
  const total = countOf([...picked]);
  const n = Math.min(size, total);

  const toggleKeys = (keys: string[], on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (on) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  const allKeys = COURSES.flatMap((c) => chaptersOfCourse(c.id).map((ch) => topicKey(c.id, ch)));
  const allState = picked.size === 0 ? "off" : picked.size === allKeys.length ? "on" : "some";

  const start = () => {
    const ids = shuffle([...picked].flatMap((k) => available.get(k) ?? [])).slice(0, n);
    if (ids.length === 0) return;
    startQuiz(
      mode === "timed"
        ? { mode: "exam", label: "اختبار مخصص موقوت", qids: ids, timeLimitSec: ids.length * SEC_PER_QUESTION }
        : { mode: "training", label: "اختبار مخصص", qids: ids }
    );
  };

  return (
    <ScreenShell
      wide
      title="أنشئ اختبارك"
      sub="اختر النمط والمصدر والمقررات"
      onClose={onClose}
      footer={
        <>
          <p className="hidden flex-1 items-center text-sm text-muted-foreground sm:flex">
            {total > 0 ? `${arCount(total, QUESTION_FORMS)} متاحة` : "لا أسئلة بهذه الاختيارات"}
            {mode === "timed" && n > 0 && `، والوقت ${arCount(n, MINUTE_FORMS)}`}
          </p>
          <PrimaryButton onClick={start} disabled={n === 0} className="w-full sm:w-auto sm:min-w-[220px]">
            {n > 0 ? `ابدأ، ${arCount(n, QUESTION_FORMS)}` : "لا أسئلة متاحة"}
          </PrimaryButton>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-7">
          <section>
            <SectionHeader title="النمط" />
            <Segmented
              label="النمط"
              value={mode}
              onChange={setMode}
              options={[
                { id: "tutor", title: "تعلّم", sub: "الإجابة والشرح بعد كل سؤال" },
                { id: "timed", title: "اختبار موقوت", sub: "دقيقة لكل سؤال، والشرح في التقرير" },
              ]}
            />
          </section>

          <section>
            <SectionHeader title="مصدر الأسئلة" />
            <Segmented
              label="مصدر الأسئلة"
              value={pool}
              onChange={setPool}
              options={[
                { id: "unused", title: "جديدة", sub: "لم تُجب عنها" },
                { id: "wrong", title: "أخطأت فيها", sub: "آخر إجابة خاطئة" },
                { id: "all", title: "الكل", sub: "كل البنك" },
              ]}
            />
          </section>

          <section>
            <SectionHeader title="الصعوبة" />
            <div className="flex flex-wrap gap-2">
              {DIFFS.map((d) => {
                const on = diffs.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDiffs((prev) => (on ? (prev.length > 1 ? prev.filter((x) => x !== d) : prev) : [...prev, d]))}
                    className={cn(
                      "flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                      on ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-secondary-foreground hover:bg-muted"
                    )}
                  >
                    {on && <Check className="h-4 w-4" />}
                    {d}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionHeader title="عدد الأسئلة" />
            <div role="radiogroup" aria-label="عدد الأسئلة" className="grid grid-cols-4 rounded-xl bg-muted p-1">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={size === s}
                  onClick={() => setSize(s)}
                  className={cn("min-h-[40px] rounded-lg text-sm transition-colors", size === s ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  {ad(s)}
                </button>
              ))}
            </div>
            {total > 0 && total < size && <p className="mt-2 text-[13px] text-muted-foreground">المتاح {arCount(total, QUESTION_FORMS)} فقط بهذه الاختيارات.</p>}
          </section>

          <Card className="flex items-start gap-3 p-4 text-sm leading-6 text-secondary-foreground">
            {mode === "timed" ? <Timer className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
            {mode === "timed"
              ? "كالاختبار الحقيقي: لا تظهر الإجابات حتى تنهي، ثم تقرير يحلل أداءك حسب الفصل والثقة والزمن."
              : "مناسب للتعلّم: بعد كل سؤال ترى الإجابة الصحيحة وسببها، ويمكنك فتح المفهوم دون مغادرة الاختبار."}
          </Card>
        </div>

        <section>
          <SectionHeader title="المقررات والفصول" sub={`اخترت ${ad(picked.size)} من ${ad(allKeys.length)} فصلًا`} />
          <Card className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleKeys(allKeys, allState !== "on")}
              className="flex min-h-[52px] w-full items-center gap-3 border-b border-border bg-muted/40 px-4 text-right"
            >
              <CheckBox state={allState} />
              <span className="flex-1 text-[15px] font-medium">كل المقررات</span>
              <span className="text-[13px] text-muted-foreground">{ad(countOf(allKeys))}</span>
            </button>
            <div className="divide-y divide-border">
              {COURSES.map((c) => {
                const keys = chaptersOfCourse(c.id).map((ch) => topicKey(c.id, ch));
                const on = keys.filter((k) => picked.has(k)).length;
                const state = on === 0 ? "off" : on === keys.length ? "on" : "some";
                const isOpen = openCourse === c.id;
                return (
                  <div key={c.id}>
                    <div className="flex min-h-[56px] items-center">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={state === "some" ? "mixed" : state === "on"}
                        onClick={() => toggleKeys(keys, state !== "on")}
                        className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 px-4 text-right"
                      >
                        <CheckBox state={state} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px]">{COURSE_SHORT[c.id] ?? c.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {ad(on)} من {ad(keys.length)} فصلًا
                          </span>
                        </span>
                        <span className="text-[13px] text-muted-foreground">{ad(countOf(keys))}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenCourse(isOpen ? null : c.id)}
                        aria-expanded={isOpen}
                        aria-label={`فصول ${c.name}`}
                        className="flex h-14 w-12 shrink-0 items-center justify-center text-muted-foreground hover:bg-muted"
                      >
                        <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="divide-y divide-border border-t border-border bg-muted/30">
                        {chaptersOfCourse(c.id).map((ch) => {
                          const k = topicKey(c.id, ch);
                          const isOn = picked.has(k);
                          return (
                            <button
                              key={k}
                              type="button"
                              role="checkbox"
                              aria-checked={isOn}
                              onClick={() => toggleKeys([k], !isOn)}
                              className="flex min-h-[48px] w-full items-center gap-3 pl-4 pr-8 text-right"
                            >
                              <CheckBox state={isOn ? "on" : "off"} />
                              <span className="min-w-0 flex-1 text-sm leading-6">{chapterLabel(ch)}</span>
                              <span className="text-xs text-muted-foreground">{ad(available.get(k)?.length ?? 0)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      </div>
    </ScreenShell>
  );
}
