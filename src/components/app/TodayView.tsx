"use client";

// ============================================================================
// «اليوم» — الصفحة الرئيسية
// ============================================================================
// مبنية على أنماط منصات الإعداد العالمية:
//  - الخطوة التالية الواحدة أولًا (Coursera: «تابع التعلّم»)
//  - خطة يومية قصيرة قابلة للإنجاز (UWorld: المخطِّط)
//  - جاهزية محسوبة لكل محور وموعد الاختبار (UWorld/Magoosh: متنبئ الدرجة)
//  - مستويات إتقان لكل مقرر (Khan Academy: لم يبدأ/متعرّف/متمكّن/متقن)
// بلا تحية ولا اسم: الصفحة تبدأ بما يجب فعله الآن.
// ============================================================================

import { useMemo } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Check,
  Clock,
  Layers,
  MessagesSquare,
  RotateCcw,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useApp, xpToday, DAILY_GOAL_XP } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { COURSES, COURSE_COLOR, COURSE_SHORT, chaptersOfCourse, conceptsOfCourse } from "@/lib/qbank";
import {
  chapterSession,
  chapterStats,
  courseMastery,
  courseReadiness,
  nextChapter,
  overallReadiness,
  smartSession,
  topicKey,
  weakChapters,
  MASTERY_LABELS,
  type MasteryLevel,
} from "@/lib/practice-bank";
import { useMistakes, buildReviewQids } from "@/lib/mistakes-client";
import { useWallet } from "@/lib/account-client";
import { ad, arCount, CHAPTER_GEN_FORMS, CONCEPT_FORMS, DAY_FORMS, ERROR_DUE_FORMS, ERROR_OBJ_FORMS, QUESTION_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import { Card, IconTile, PrimaryButton, ProgressBar, Ring, SecondaryButton, SectionHeader, pct } from "./ui-kit";

const DAY_MS = 86_400_000;
const dateFmt = new Intl.DateTimeFormat("ar-u-nu-arab", { weekday: "long", day: "numeric", month: "long" });
const weekdayFmt = new Intl.DateTimeFormat("ar-u-nu-arab", { weekday: "narrow" });

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  0: "var(--muted)",
  1: "color-mix(in srgb, var(--primary) 30%, transparent)",
  2: "color-mix(in srgb, var(--primary) 65%, transparent)",
  3: "var(--primary)",
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`).getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.round((target - today) / DAY_MS);
}

export default function TodayView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const sessions = useApp((s) => s.sessions);
  const goal = useApp((s) => s.goal);
  const examDate = useApp((s) => s.examDate);
  const lastStudy = useApp((s) => s.lastStudy);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const ui = useUi();
  const { data: mistakes } = useMistakes();
  const { streak } = useWallet();

  const due = mistakes?.stats.due ?? 0;
  const readiness = useMemo(() => overallReadiness(attempts) * 100, [attempts]);
  const weak = useMemo(() => weakChapters(attempts, undefined, 1)[0] ?? null, [attempts]);
  const left = daysUntil(examDate);

  // الفصل الذي يُتابَع: آخر ما درسه، وإلا أول فصل في أول مقرر
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
  const minutesLeft = plan.filter((p) => !p.done).reduce((n, p) => n + p.minutes, 0);

  // نشاط الأيام السبعة: الأسئلة المجابة كل يوم
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(new Date().toDateString());
      d.setDate(d.getDate() - (6 - i));
      return { date: d, count: 0 };
    });
    for (const s of sessions) {
      const key = new Date(new Date(s.ts).toDateString()).getTime();
      const day = days.find((d) => d.date.getTime() === key);
      if (day) day.count += s.total;
    }
    return days;
  }, [sessions]);
  const weekMax = Math.max(10, ...week.map((d) => d.count));
  const weekTotal = week.reduce((n, d) => n + d.count, 0);

  // أول بطاقة: الخطوة التالية الواحدة
  const hero =
    due > 0
      ? {
          eyebrow: "الخطوة التالية",
          title: `راجع ${arCount(due, ERROR_OBJ_FORMS)} قبل أن تُنسى`,
          sub: "المراجعة في موعدها أسرع طريق لتثبيت ما أخطأت فيه.",
          cta: "ابدأ المراجعة",
          run: startReview,
          progress: null as number | null,
        }
      : {
          eyebrow: `${lastStudy ? "تابع من حيث توقفت" : "ابدأ من هنا"}، ${COURSE_SHORT[current.courseId] ?? ""}`,
          title: current.chapter,
          sub: `أتقنت ${ad(current.done)} من ${arCount(current.total, CHAPTER_GEN_FORMS)} في هذا المقرر.`,
          cta: lastStudy ? "تابع" : "ابدأ الفصل",
          run: () => startChapter(current.courseId, current.chapter),
          progress: current.total ? (current.done / current.total) * 100 : 0,
        };

  const readinessCard = (
    <Card className="p-5">
      <SectionHeader title="جاهزيتك للاختبار" sub="الدقة في كل محور مضروبة في مقدار ما غطّيته منه" />
      <div className="flex items-center gap-5">
        <Ring value={readiness} size={96} stroke={9}>
          <span className="font-display text-xl font-bold text-primary">{pct(readiness)}</span>
        </Ring>
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          {left !== null && left >= 0 ? (
            <p className="flex items-center gap-2 text-foreground">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              {left === 0 ? "الاختبار اليوم" : `باقٍ على الاختبار ${arCount(left, DAY_FORMS)}`}
            </p>
          ) : (
            <button type="button" onClick={() => onGoTab("profile")} className="flex min-h-[32px] items-center gap-2 font-medium text-primary">
              <CalendarClock className="h-4 w-4" /> حدّد موعد اختبارك
            </button>
          )}
          {weak ? (
            <p className="leading-6 text-muted-foreground">
              الأضعف الآن: <span className="font-medium text-foreground">{weak.chapter}</span>
            </p>
          ) : (
            <p className="leading-6 text-muted-foreground">أجب عن أسئلة أكثر لتظهر نقاط ضعفك بدقة.</p>
          )}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {COURSES.slice(0, 6).map((c) => {
          const r = courseReadiness(c.id, attempts) * 100;
          return (
            <div key={c.id}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="text-secondary-foreground">{COURSE_SHORT[c.id] ?? c.name}</span>
                <span className={cn("font-medium", r > 0 && r < 50 ? "text-warning" : "text-foreground")}>{pct(r)}</span>
              </div>
              <ProgressBar value={r} color={r > 0 && r < 50 ? "var(--warning)" : undefined} />
            </div>
          );
        })}
      </div>
      <SecondaryButton onClick={ui.startExamsim} className="mt-5 w-full">
        <Timer className="h-4 w-4" /> اختبار تجريبي بالوقت
      </SecondaryButton>
    </Card>
  );

  const coursesSection = (
    <section>
      <SectionHeader
        title="مقرراتك"
        sub="مستوى إتقان المفاهيم في كل مقرر"
        action={
          <button type="button" onClick={() => onGoTab("learn")} className="min-h-[36px] text-sm font-medium text-primary">
            كل المقررات
          </button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {COURSES.map((c) => {
          const m = courseMastery(c.id, attempts);
          const total = conceptsOfCourse(c.id).length || 1;
          const color = COURSE_COLOR[c.id] ?? "var(--primary)";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                ui.openCourseTab(c.id);
                onGoTab("learn");
              }}
              className="rounded-2xl border border-border bg-card p-4 text-right card-soft transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-6">{c.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {arCount(total, CONCEPT_FORMS)}، أتقنت {ad(m[3] + m[2])}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {([3, 2, 1] as MasteryLevel[]).map((lv) => (
                  <span key={lv} style={{ width: `${(m[lv] / total) * 100}%`, background: MASTERY_COLORS[lv] }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {([3, 2, 1, 0] as MasteryLevel[]).map((lv) => (
          <span key={lv} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: MASTERY_COLORS[lv] }} />
            {MASTERY_LABELS[lv]}
          </span>
        ))}
      </div>
    </section>
  );

  const tools = [
    { label: "اختبار محاكٍ", sub: "بالوقت والأقسام", icon: Timer, run: ui.startExamsim },
    { label: "مواقف صفية", sub: "قرار وتحليل", icon: MessagesSquare, run: ui.startSim },
    { label: "بطاقات المفاهيم", sub: "مراجعة سريعة", icon: Layers, run: ui.startFlash },
    { label: "المساعد الذكي", sub: "اسأل عن أي مفهوم", icon: Bot, run: ui.startAi },
  ];
  const toolsSection = (
    <section>
      <SectionHeader title="أدوات الإعداد" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.run}
            className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right card-soft transition-colors hover:bg-muted/40"
          >
            <IconTile icon={t.icon} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{t.label}</span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">{t.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted-foreground">{dateFmt.format(new Date())}</p>
          <h1 className="mt-1 font-display text-2xl font-bold lg:text-[28px]">الرئيسية</h1>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {minutesLeft > 0 ? `قرابة ${ad(minutesLeft)} دقيقة متبقية` : "أنجزت خطة اليوم"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* الخطوة التالية */}
          <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <div className="p-5 lg:p-6">
              <p className="text-[13px] opacity-80">{hero.eyebrow}</p>
              <h2 className="mt-2 font-display text-xl font-bold leading-[1.6] lg:text-2xl">{hero.title}</h2>
              <p className="mt-1.5 text-sm leading-6 opacity-90">{hero.sub}</p>
              {hero.progress !== null && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${hero.progress}%` }} />
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={hero.run}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
                >
                  {hero.cta} <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={startSmart}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/30 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4" /> تدريب ذكي ١٠ أسئلة
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
                      <span className={cn("block truncate text-[15px] font-medium", p.done && "text-muted-foreground line-through")}>{p.title}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                        {p.sub}، {ad(p.minutes)} د
                      </span>
                    </span>
                    {!p.done && <span className="text-sm font-semibold text-primary">ابدأ</span>}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* على الجوال تأتي الجاهزية بعد الخطة مباشرة */}
          <div className="lg:hidden">{readinessCard}</div>

          {goal === "teacher" ? toolsSection : coursesSection}
        </div>

        <div className="min-w-0 space-y-6">
          <div className="hidden lg:block">{readinessCard}</div>

          {/* النشاط الأسبوعي */}
          <Card className="p-5">
            <SectionHeader
              title="نشاطك هذا الأسبوع"
              sub={`${arCount(weekTotal, QUESTION_FORMS)}، سلسلة ${arCount(streak, DAY_FORMS)}`}
              action={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
            />
            <div className="flex h-24 items-end gap-2" role="img" aria-label={`عدد الأسئلة في الأيام السبعة الأخيرة: ${week.map((d) => ad(d.count)).join("، ")}`}>
              {week.map((d, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <div
                    className={cn("w-full max-w-7 rounded-md", d.count === 0 ? "bg-muted" : i === 6 ? "bg-primary" : "bg-primary/40")}
                    style={{ height: `${Math.max(6, (d.count / weekMax) * 100)}%` }}
                  />
                  <span className={cn("text-[11px]", i === 6 ? "font-semibold text-primary" : "text-muted-foreground")}>{weekdayFmt.format(d.date)}</span>
                </div>
              ))}
            </div>
          </Card>

          {due > 0 && (
            <Card className="flex items-center gap-4 p-5">
              <IconTile icon={RotateCcw} color="var(--destructive)" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{arCount(due, ERROR_DUE_FORMS)}</p>
                <p className="text-[13px] text-muted-foreground">أخطاؤك المفتوحة: {ad(mistakes?.stats.open ?? 0)}</p>
              </div>
              <button type="button" onClick={() => onGoTab("mistakes")} className="min-h-[44px] text-sm font-semibold text-primary">
                أخطائي
              </button>
            </Card>
          )}
        </div>
      </div>

      {goal === "teacher" ? coursesSection : toolsSection}
    </div>
  );
}
