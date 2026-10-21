"use client";

// ============================================================================
// الرئيسية: الخطوة التالية وخطة اليوم فقط. الجاهزية في «حسابي»، والمحاور في «التعلّم»، والأدوات في «التدريب».
// ============================================================================

import { useMemo } from "react";
import { Check } from "lucide-react";
import { useApp, xpToday, DAILY_GOAL_XP } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { COURSES, COURSE_SHORT, chaptersOfCourse } from "@/lib/qbank";
import { chapterSession, chapterStats, nextChapter, smartSession, topicKey, weakChapters } from "@/lib/practice-bank";
import { useMistakes, buildReviewQids } from "@/lib/mistakes-client";
import { ad, arCount, ERROR_DUE_FORMS, ERROR_OBJ_FORMS, QUESTION_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import { Card, ProgressBar, SectionHeader, pct } from "./ui-kit";

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
  const xp = xpToday(sessions);

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
          {/* الخطوة التالية */}
          <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <div className="p-5 lg:p-6">
              <h2 className="font-display text-2xl font-bold leading-[1.6]">{hero.title}</h2>
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

          {/* خطة اليوم */}
          <Card className="p-5">
            <SectionHeader
              title="خطة اليوم"
              sub={`${ad(plan.filter((p) => p.done).length)} من ${ad(plan.length)}، هدف النقاط ${ad(Math.min(xp, DAILY_GOAL_XP))} من ${ad(DAILY_GOAL_XP)}`}
            />
            <ProgressBar value={(Math.min(xp, DAILY_GOAL_XP) / DAILY_GOAL_XP) * 100} className="mb-2" />
            <ul className="divide-y divide-border">
              {plan.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={p.run} className="flex min-h-[60px] w-full items-center gap-3 py-3 text-right">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                        p.done ? "border-success bg-success text-white" : "border-input"
                      )}
                      aria-label={p.done ? "منجز" : "غير منجز"}
                    >
                      {p.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-base font-medium", p.done && "text-muted-foreground line-through")}>{p.title}</span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {p.sub}
                      </span>
                    </span>
                    {!p.done && <span className="text-sm font-semibold text-primary">ابدأ</span>}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

    </div>
  );
}
