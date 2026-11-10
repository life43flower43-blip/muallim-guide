"use client";

// اختبار محاكاة الرخصة المهنية: كل أسئلة البنك في مكان واحد، مرتبة بالمحاور ثم الفصول،
// يتابع الطالب فيها من حيث توقف، ويرى كم أنجز من كل محور وكل فصل.
import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, CheckCircle2, PlayCircle, Timer } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { COURSES, COURSE_SHORT, QUESTIONS, chaptersOfCourse, questionsOfChapter } from "@/lib/qbank";
import { topicKey } from "@/lib/practice-bank";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { ProgressBar, ScreenShell } from "./ui-kit";
import type { Attempt } from "@/lib/types";

const SET_SIZE = 20;
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");
const COURSE_EMO: Record<string, string> = {
  M1: "🌱", M2: "🧠", M3: "💡", M4: "📊", M5: "🧑‍🏫", SE1: "🤝", F1: "🏛️", AI1: "🤖", G1: "📚", C1: "🛠️", L1: "🧭", R1: "🧩",
};

type Stat = { total: number; done: number; correct: number };
const stat = (qids: string[], attempts: Record<string, Attempt>): Stat => {
  let done = 0;
  let correct = 0;
  for (const id of qids) {
    const a = attempts[id];
    if (a) {
      done += 1;
      if (a.correct) correct += 1;
    }
  }
  return { total: qids.length, done, correct };
};
const pctOf = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

/** المجموعة التالية: ما لم يُجب عنه بالترتيب، وإن اكتمل كله فما أخطأ فيه، وإلا من البداية */
function nextSet(qids: string[], attempts: Record<string, Attempt>): string[] {
  const fresh = qids.filter((id) => !attempts[id]);
  if (fresh.length) return fresh.slice(0, SET_SIZE);
  const wrong = qids.filter((id) => attempts[id] && !attempts[id].correct);
  if (wrong.length) return wrong.slice(0, SET_SIZE);
  return qids.slice(0, SET_SIZE);
}

export default function LicenseBankView() {
  const close = useUi((s) => s.clearBank);
  const startQuiz = useUi((s) => s.startQuiz);
  const startExamsim = useUi((s) => s.startExamsim);
  const attempts = useApp((s) => s.attempts);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const [open, setOpen] = useState<string | null>(null);

  // ترتيب البنك: المحاور، ثم فصول كل محور، ثم أسئلة كل فصل
  const tree = useMemo(
    () =>
      COURSES.map((c) => {
        const chapters = chaptersOfCourse(c.id).map((ch) => ({ ch, qids: questionsOfChapter(c.id, ch).map((q) => q.id) }));
        return { course: c, chapters, qids: chapters.flatMap((x) => x.qids) };
      }).filter((x) => x.qids.length > 0),
    []
  );
  const allIds = useMemo(() => tree.flatMap((x) => x.qids), [tree]);
  const all = stat(allIds, attempts);

  const run = (label: string, qids: string[], key?: string) => startQuiz({ mode: "training", label, qids, topicKey: key });

  const resumeAll = () => {
    // أول فصل فيه أسئلة لم يُجب عنها، بالترتيب
    for (const t of tree)
      for (const c of t.chapters)
        if (c.qids.some((id) => !attempts[id])) {
          setLastStudy(t.course.id, c.ch);
          return run(`${COURSE_SHORT[t.course.id] ?? t.course.name} · ${chapterLabel(c.ch)}`, nextSet(c.qids, attempts), topicKey(t.course.id, c.ch));
        }
    run("مراجعة ما أخطأت فيه", nextSet(allIds, attempts));
  };

  return (
    <ScreenShell title="اختبار محاكاة الرخصة المهنية" onClose={close}>
      <div className="space-y-5">
        {/* البطاقة الكبرى: حجم البنك وما أنجزه الطالب */}
        <section className="rounded-[24px] bg-[var(--t800)] p-5 text-white">
          <p className="text-[13px] font-bold text-[#F3DC8E]">بنك أسئلة الرخصة المهنية كاملًا</p>
          <p className="mt-1 font-display text-[30px] font-extrabold leading-[1.3]">{ad(all.total)} سؤالًا</p>
          <p className="text-[13.5px] leading-6 text-white/80">مرتبة في {ad(tree.length)} محورًا، ولكل سؤال شرح لإجابته.</p>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[13px] font-bold">
              <span>أنجزت {ad(all.done)} من {ad(all.total)}</span>
              <span>{all.done ? `الدقة ${ad(pctOf(all.correct, all.done))}٪` : ""}</span>
            </div>
            <ProgressBar value={Math.max(all.done ? 1.5 : 0, pctOf(all.done, all.total))} color="#D4A017" height={8} className="bg-white/20" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 tiles2">
            <button type="button" onClick={resumeAll} className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-[16px] bg-[#F3DC8E] px-3 font-extrabold text-[#3a2c05]">
              <PlayCircle className="h-5 w-5" /> {all.done ? "تابع من حيث توقفت" : "ابدأ من السؤال الأول"}
            </button>
            <button type="button" onClick={startExamsim} className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-[16px] bg-white/15 px-3 font-bold text-white">
              <Timer className="h-5 w-5" /> اختبار بوقت حقيقي
            </button>
          </div>
        </section>

        {/* المحاور: كل محور يفتح فصوله */}
        <section className="space-y-2.5">
          {tree.map(({ course, chapters, qids }) => {
            const s = stat(qids, attempts);
            const isOpen = open === course.id;
            return (
              <div key={course.id} className="overflow-hidden rounded-[20px] border-2 border-[#E3EDE8] bg-white dark:border-border dark:bg-card">
                <button type="button" onClick={() => setOpen(isOpen ? null : course.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-3.5 text-right">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--t100)] text-[22px]" aria-hidden="true">{COURSE_EMO[course.id] ?? "📚"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold leading-6 text-foreground">{course.name}</span>
                    <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                      {ad(s.total)} سؤالًا · {ad(chapters.length)} فصلًا · أنجزت {ad(pctOf(s.done, s.total))}٪
                    </span>
                    <ProgressBar value={pctOf(s.done, s.total)} height={4} className="mt-1.5" />
                  </span>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <ul className="divide-y divide-[var(--t075)] border-t border-[var(--t075)] dark:divide-border dark:border-border">
                    {chapters.map(({ ch, qids: cq }, i) => {
                      const cs = stat(cq, attempts);
                      const complete = cs.done === cs.total;
                      return (
                        <li key={ch}>
                          <button
                            type="button"
                            onClick={() => {
                              setLastStudy(course.id, ch);
                              run(chapterLabel(ch), nextSet(cq, attempts), topicKey(course.id, ch));
                            }}
                            className="flex w-full items-center gap-3 px-3.5 py-3 text-right active:bg-[var(--t050)]"
                          >
                            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold", complete ? "bg-[var(--t700)] text-white" : "bg-muted text-foreground")}>
                              {complete ? <CheckCircle2 className="h-4 w-4" /> : ad(i + 1)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14.5px] font-bold leading-6 text-foreground">{chapterLabel(ch)}</span>
                              <span className="block text-[12px] text-muted-foreground">
                                {ad(cs.done)} من {ad(cs.total)} سؤالًا{cs.done ? ` · الدقة ${ad(pctOf(cs.correct, cs.done))}٪` : ""}
                              </span>
                            </span>
                            <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
        <p className="text-center text-[12.5px] leading-6 text-muted-foreground">كل فصل يُعرض في مجموعات من {ad(SET_SIZE)} سؤالًا بالترتيب، ثم تُعاد عليك الأسئلة التي أخطأت فيها.</p>
      </div>
    </ScreenShell>
  );
}
