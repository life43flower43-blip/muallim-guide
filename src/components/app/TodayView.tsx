"use client";

// ============================================================================
// الرئيسية: الخطوة التالية وخطة اليوم فقط. الجاهزية في «حسابي»، والمحاور في «التعلّم»، والأدوات في «التدريب».
// ============================================================================

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, Check, Dumbbell, RotateCcw, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { COURSES, COURSE_COLOR, COURSE_SHORT, chaptersOfCourse, questionById, questionsOfCourse } from "@/lib/qbank";
import { chapterSession, chapterStats, nextChapter, smartSession, topicKey, weakChapters } from "@/lib/practice-bank";
import { useMistakes, buildReviewQids, recordMistake } from "@/lib/mistakes-client";
import { enablePush, usePushState } from "@/lib/push-client";
import { arCount, splitReason, ERROR_DUE_FORMS, ERROR_OBJ_FORMS, QUESTION_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import { pct } from "./ui-kit";

export default function TodayView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const sessions = useApp((s) => s.sessions);
  const lastStudy = useApp((s) => s.lastStudy);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const ui = useUi();
  const { data: mistakes } = useMistakes();

  const due = mistakes?.stats.due ?? 0;
  const weak = useMemo(() => weakChapters(attempts, undefined, 1)[0] ?? null, [attempts]);

  // الفصل الذي يُتابَع: آخر ما درسه، وإلا أول فصل في أول محور
  const current = useMemo(() => {
    const courseId = lastStudy?.courseId ?? COURSES[0]?.id ?? "M1";
    const last = lastStudy?.chapter;
    const chapter = last && chapterStats(courseId, last, attempts).level < 2 ? last : nextChapter(courseId, attempts) ?? last ?? "";
    const chapters = chaptersOfCourse(courseId);
    const done = chapters.filter((ch) => chapterStats(courseId, ch, attempts).level >= 2).length;
    return { courseId, chapter, stats: chapterStats(courseId, chapter, attempts), done, total: chapters.length };
  }, [lastStudy, attempts]);

  const startChapter = (courseId: string, chapter: string) => {
    setLastStudy(courseId, chapter);
    ui.startQuiz({ mode: "training", label: chapter, qids: chapterSession(courseId, chapter, attempts), topicKey: topicKey(courseId, chapter) });
  };
  const startReview = () => {
    if (!mistakes) return;
    ui.startQuiz({ mode: "review", label: "مراجعة الأخطاء", qids: buildReviewQids(mistakes) });
  };
  const startSmart = () => ui.startQuiz({ mode: "training", label: "تدريب ذكي", qids: smartSession(attempts) });

  // ما أُنجز اليوم
  const today = new Date().toDateString();
  const todaySessions = sessions.filter((s) => new Date(s.ts).toDateString() === today);
  const reviewedToday = todaySessions.some((s) => s.mode === "review");
  const practicedToday = todaySessions.some((s) => s.mode !== "review");

  const plan = [
    due > 0 || reviewedToday
      ? {
          id: "review",
          title: due > 0 ? `مراجعة ${arCount(due, ERROR_DUE_FORMS)}` : "مراجعة الأخطاء",
          sub: "المراجعة المتباعدة تثبّت ما نسيته",
          minutes: Math.max(3, Math.min(12, due)),
          done: reviewedToday && due === 0,
          run: startReview,
        }
      : null,
    {
      id: "chapter",
      title: current.chapter,
      sub: `${COURSE_SHORT[current.courseId] ?? ""}، ${arCount(current.stats.total, QUESTION_FORMS)}`,
      minutes: 10,
      done: practicedToday,
      run: () => startChapter(current.courseId, current.chapter),
    },
    weak
      ? {
          id: "weak",
          title: `تقوية: ${weak.chapter}`,
          sub: `دقتك فيه ${pct(weak.accuracy * 100)} — أدنى من ٧٠٪`,
          minutes: 8,
          done: false,
          run: () => startChapter(weak.courseId, weak.chapter),
        }
      : {
          id: "smart",
          title: "تدريب ذكي متنوع",
          sub: "أسئلة من فصول لم تبدأها بعد",
          minutes: 8,
          done: false,
          run: startSmart,
        },
  ].filter(Boolean) as { id: string; title: string; sub: string; minutes: number; done: boolean; run: () => void }[];


  // أول بطاقة: الخطوة التالية الواحدة
  const hero =
    due > 0
      ? {
          title: `راجع ${arCount(due, ERROR_OBJ_FORMS)} قبل أن تُنسى`,
          cta: "ابدأ المراجعة",
          run: startReview,
        }
      : {
          title: current.chapter,
          cta: lastStudy ? "تابع" : "ابدأ الفصل",
          run: () => startChapter(current.courseId, current.chapter),
        };

  const PLAN_ICON: Record<string, { icon: React.ElementType; color: string }> = {
    review: { icon: RotateCcw, color: "#FF4B4B" },
    chapter: { icon: BookOpen, color: COURSE_COLOR[current.courseId] ?? "#0E7C86" },
    weak: { icon: Dumbbell, color: "#FF9600" },
    smart: { icon: Sparkles, color: "#A560E8" },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* الخطوة التالية */}
      <section className="overflow-hidden rounded-2xl border-b-4 border-black/20 bg-primary text-primary-foreground">
        <div className="p-5">
          <h2 className="font-display text-2xl font-bold leading-[1.6]">{hero.title}</h2>
          {due === 0 && current.stats.total > 0 && (
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/25" aria-hidden="true">
              <div className="h-full rounded-full bg-[#FFC800]" style={{ width: `${(current.stats.answered / current.stats.total) * 100}%` }} />
            </div>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={hero.run}
              className="min-h-[52px] rounded-2xl bg-white px-3 text-base font-bold text-primary shadow-[0_4px_0_rgba(0,0,0,0.18)] transition active:translate-y-[4px] active:shadow-none"
            >
              {hero.cta}
            </button>
            <button
              type="button"
              onClick={startSmart}
              className="min-h-[52px] rounded-2xl border-2 border-b-4 border-white/40 px-3 text-base font-bold text-white transition active:translate-y-[2px] active:border-b-2"
            >
              تدريب ذكي
            </button>
          </div>
        </div>
      </section>

      <PushInvite />

      {/* خطة اليوم */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">خطة اليوم</h2>
        <ul className="space-y-3">
          {plan.map((p) => {
            const meta = PLAN_ICON[p.id] ?? PLAN_ICON.smart;
            const Icon = meta.icon;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={p.run}
                  className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-border bg-card p-3 text-right transition active:translate-y-[2px] active:border-b-2"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: p.done ? "#58CC02" : meta.color }}>
                    {p.done ? <Check className="h-6 w-6" strokeWidth={3} /> : <Icon className="h-6 w-6" strokeWidth={2.2} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-base font-bold leading-7", p.done && "text-muted-foreground line-through")}>{p.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{p.sub}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <DailyQuestion courseId={current.courseId} onOpenConcept={(id) => { ui.openConcept(id); onGoTab("learn"); }} />
    </div>
  );
}

/** دعوة لطيفة لتفعيل التذكير اليومي، تختفي بعد التفعيل أو «لاحقًا» */
function PushInvite() {
  const push = usePushState();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem("turbawy-push-invite") === "no";
    } catch {
      return false;
    }
  });
  if (push !== "off" || hidden) return null;
  const later = () => {
    setHidden(true);
    try {
      localStorage.setItem("turbawy-push-invite", "no");
    } catch {}
  };
  return (
    <section className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-[#FFC800] bg-[#FFF8D6] p-4 dark:bg-[#FFC800]/10">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFC800] text-white">
        <Bell className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-7">ذكّرني كل مساء</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => enablePush()} className="min-h-[40px] rounded-xl bg-[#FF9600] px-4 text-sm font-bold text-white shadow-[0_3px_0_#C76E00] active:translate-y-[3px] active:shadow-none">
            فعّل التذكير
          </button>
          <button type="button" onClick={later} className="min-h-[40px] rounded-xl px-3 text-sm font-bold text-muted-foreground">
            لاحقًا
          </button>
        </div>
      </div>
    </section>
  );
}

/** ترتيب ثابت للخيارات طوال اليوم، فلا يكون الصحيح أولًا دائمًا */
const hash = (t: string) => [...t].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);

/** سؤال اليوم: سؤال واحد ثابت طوال اليوم من المحور الحالي، يُجاب عنه في مكانه */
function DailyQuestion({ courseId, onOpenConcept }: { courseId: string; onOpenConcept: (id: string) => void }) {
  const recordAttempt = useApp((s) => s.recordAttempt);
  const queryClient = useQueryClient();
  const day = new Date().toDateString();
  const [qid] = useState<string | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("turbawy-dq") ?? "null");
      if (saved?.day === day && questionById(saved.qid)) return saved.qid;
    } catch {}
    const pool = questionsOfCourse(courseId).filter((q) => !useApp.getState().attempts[q.id]);
    const list = pool.length ? pool : questionsOfCourse(courseId);
    if (!list.length) return null;
    const pick = list[Math.floor(Date.now() / 86_400_000) % list.length].id;
    try {
      localStorage.setItem("turbawy-dq", JSON.stringify({ day, qid: pick }));
    } catch {}
    return pick;
  });
  const q = qid ? questionById(qid) : undefined;
  const [chosen, setChosen] = useState<string | null>(() => {
    const a = qid ? useApp.getState().attempts[qid] : undefined;
    return a && new Date(a.ts).toDateString() === day ? a.answer ?? null : null;
  });
  if (!q) return null;
  const answered = chosen !== null;
  const ok = chosen === q.correct;
  const choose = (text: string) => {
    if (answered) return;
    setChosen(text);
    const right = text === q.correct;
    recordAttempt(q.id, right, text);
    if (!right) recordMistake(q.id, text, queryClient);
  };

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold">سؤال اليوم</h2>
      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <p className="text-lg font-bold leading-8">{q.question}</p>
        <div className={cn("mt-4", q.type === "tf" ? "grid grid-cols-2 gap-2" : "space-y-2")}>
          {(q.type === "mcq" && !q.fixedOrder ? [...q.options].sort((a, b) => hash(q.id + a.text) - hash(q.id + b.text)) : q.options).map((o) => {
            const state = !answered ? "idle" : o.isCorrect ? "right" : o.text === chosen ? "wrong" : "dim";
            return (
              <button
                key={o.text}
                type="button"
                disabled={answered}
                onClick={() => choose(o.text)}
                className={cn(
                  "min-h-[52px] w-full rounded-2xl border-2 border-b-4 px-4 py-2 text-right text-base font-medium leading-7 transition",
                  q.type === "tf" && "text-center font-bold",
                  state === "idle" && "border-border bg-card active:translate-y-[2px] active:border-b-2",
                  state === "right" && "border-[#58CC02] bg-[#D7FFB8] text-[#3C7A00] dark:bg-[#58CC02]/15 dark:text-[#9BE15D]",
                  state === "wrong" && "border-[#FF4B4B] bg-[#FFDFE0] text-[#B3261E] dark:bg-[#FF4B4B]/15 dark:text-[#FF8A8A]",
                  state === "dim" && "border-border opacity-50"
                )}
              >
                {o.text}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="mt-4 space-y-3">
            <p className={cn("text-base font-bold", ok ? "text-[#3C7A00] dark:text-[#9BE15D]" : "text-[#B3261E] dark:text-[#FF8A8A]")}>
              {ok ? "أحسنت! عُد غدًا لسؤال جديد." : "أضفناه إلى «أخطائي» ليعود إليك في موعده."}
            </p>
            <p className="text-base leading-8 text-secondary-foreground">{splitReason(q.reason).base}</p>
            <button type="button" onClick={() => onOpenConcept(q.conceptId)} className="min-h-[40px] text-sm font-bold text-primary">
              اقرأ المفهوم
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
