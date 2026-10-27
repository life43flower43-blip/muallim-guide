"use client";

// ============================================================================
// «التدريب» — مركز التدريب على نمط منصات بنوك الأسئلة (UWorld وKaplan)
// ============================================================================
// ١) لوحة أداء: الجاهزية، وما استخدمته من البنك، والدقة، والأخطاء المستحقة.
// ٢) أربعة إجراءات: تدريب ذكي، وأنشئ اختبارك، واختبار شامل، ومحاكي الاختبار الرسمي.
// ٤) حسب المحور: فصوله بنجوم أفضل نتيجة ودقة كل فصل.
// ٥) التطبيق في مواقف حقيقية، والمراجعة السريعة.
// ============================================================================

import { FitText } from "./FitText";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ClipboardCheck,
  Gauge,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { COURSES, COURSE_COLOR, QUESTIONS, chaptersOfCourse } from "@/lib/qbank";
import {
  EXAM_SECONDS,
  chapterSession,
  courseExam,
  courseMix,
  examKey,
  fullMockExam,
  smartSession,
  starsFor,
  topicKey,
} from "@/lib/practice-bank";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import TestBuilder from "./TestBuilder";
import { Divided, PageTitle, Stars, pct } from "./ui-kit";

const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

/** مربع إجراء موحّد: رمز ذهبي في دائرة، والعنوان تحته في سطر واحد */
function Tile({ icon: Icon, title, meta, small, onClick }: { icon: React.ElementType; title: string; meta?: string; small?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-[var(--t075)] bg-white text-[var(--t900)] transition active:scale-[0.97] dark:border-border dark:bg-card dark:text-foreground",
        small ? "min-h-[92px] px-1.5 py-3" : "min-h-[96px] px-2 py-3"
      )}
    >
      <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#FBF1D6] text-[#B8860B]", small ? "h-10 w-10" : "h-11 w-11")}>
        <Icon className={small ? "h-5 w-5" : "h-[22px] w-[22px]"} strokeWidth={2} />
      </span>
      <FitText max={small ? 13 : 15} min={9} group={small ? "tile-sm" : "tile"} className="w-full text-center font-bold">{title}</FitText>
      {meta && <span className="absolute left-2 top-2 rounded-full bg-[var(--t100)] px-1.5 text-[10px] font-bold leading-4 text-[var(--t800)]">{meta}</span>}
    </button>
  );
}

/** زر صغير داخل المحور */
function MiniBtn({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-[14px] border border-[#E3D3A0] bg-white text-sm font-bold text-[var(--t900)] transition active:scale-[0.97] dark:bg-card dark:text-foreground">
      <Icon className="h-4 w-4 text-[#C99A06]" />
      {title}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PracticeView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const best = useApp((s) => s.best);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const ui = useUi();
  const [open, setOpen] = useState<string | null>(null);
  const [builder, setBuilder] = useState(false);
  const [view, setView] = useState<"tests" | "courses">("tests");

  const summary = useMemo(() => {
    const all = Object.values(attempts);
    const correct = all.filter((a) => a.correct).length;
    return { answered: all.length, accuracy: all.length ? (correct / all.length) * 100 : null };
  }, [attempts]);
  const bank = QUESTIONS.length;
  const openCourse = COURSES.find((c) => c.id === open);

  const startSmart = (courseId?: string, label = "تدريب ذكي") => ui.startQuiz({ mode: "training", label, qids: smartSession(attempts, courseId) });
  const startChapter = (courseId: string, chapter: string) => {
    setLastStudy(courseId, chapter);
    ui.startQuiz({ mode: "training", label: chapterLabel(chapter), qids: chapterSession(courseId, chapter, attempts), topicKey: topicKey(courseId, chapter) });
  };

  return (
    <div className="space-y-5">
      <PageTitle title="التدريب" />

      {/* البطاقة الرئيسية: تدريب ذكي، ومعه أرقامك في سطر واحد */}
      <button
        type="button"
        onClick={() => startSmart()}
        className="relative block w-full overflow-hidden rounded-[26px] bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] p-4 text-right text-white transition active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-[#FFE27A]">
            <Sparkles className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xl font-extrabold leading-8">تدريب ذكي</span>
            <span className="block whitespace-nowrap text-sm font-medium text-white/80">
              {summary.answered ? `أجبت ${ad(summary.answered)} · الدقة ${summary.accuracy === null ? "—" : pct(summary.accuracy)}` : "ابدأ بعشرة أسئلة"}
            </span>
          </span>
          <ChevronLeft className="h-6 w-6 shrink-0 text-[#FFE27A]" />
        </span>
        <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
          <span className="block h-full rounded-full bg-gradient-to-l from-[#FFE27A] to-[#E3B23C]" style={{ width: `${bank ? Math.max(2, (summary.answered / bank) * 100) : 0}%` }} />
        </span>
      </button>

      {/* قسمان فقط، يظهر واحد منهما في كل مرة */}
      <div role="tablist" aria-label="أقسام التدريب" className="grid grid-cols-2 gap-1 rounded-[22px] border border-[#E3D3A0] bg-white p-1 dark:bg-card">
        {(
          [
            ["tests", "اختبارات"],
            ["courses", "حسب المحور"],
          ] as const
        ).map(([id, lbl]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={cn("min-h-[42px] rounded-[18px] text-base font-bold transition", view === id ? "bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] text-white" : "text-[var(--t500)]")}
          >
            {lbl}
          </button>
        ))}
      </div>

      {view === "tests" ? (
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={SlidersHorizontal} title="أنشئ اختبارك" onClick={() => setBuilder(true)} />
          <Tile icon={Timer} title="اختبار شامل" meta={best["ALL::exam"] !== undefined ? pct(best["ALL::exam"]) : undefined} onClick={() => ui.startQuiz({ mode: "exam", label: "اختبار تجريبي شامل", qids: fullMockExam(), timeLimitSec: EXAM_SECONDS * 2, topicKey: "ALL::exam" })} />
          <Tile icon={Gauge} title="تحديد المستوى" onClick={ui.startPlacement} />
          <Tile icon={Users} title="تحدّي زميل" onClick={ui.startPeer} />
        </div>
      ) : (
        <Divided>
          {COURSES.map((c) => {
            const chapters = chaptersOfCourse(c.id);
            const stars = chapters.reduce((n, ch) => n + starsFor(best[topicKey(c.id, ch)]), 0);
            return (
              <button key={c.id} type="button" onClick={() => setOpen(c.id)} className="flex min-h-[56px] w-full min-w-0 items-center gap-3 px-4 py-2.5 text-right">
                <span className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: COURSE_COLOR[c.id] ?? "var(--primary)" }} aria-hidden="true" />
                <FitText max={16} min={11} className="flex-1 font-bold leading-7">{c.name}</FitText>
                {stars > 0 && <span className="shrink-0 text-sm font-bold text-[#B8860B]">★ {ad(stars)}</span>}
                <ChevronLeft className="h-5 w-5 shrink-0 text-[#C99A06]" />
              </button>
            );
          })}
        </Divided>
      )}

      {/* المحور المختار في ورقة من الأسفل: ثلاثة أزرار ثم فصوله */}
      {openCourse && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setOpen(null)}>
          <div className="safe-bottom max-h-[80dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-4 dark:bg-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={openCourse.name}>
            <span className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
            <FitText max={18} min={12} className="mb-3 text-center font-extrabold">{openCourse.name}</FitText>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <MiniBtn icon={Sparkles} title="ذكي" onClick={() => { setOpen(null); startSmart(openCourse.id, `تدريب ذكي: ${openCourse.name}`); }} />
              <MiniBtn icon={Shuffle} title="مزيج" onClick={() => { setOpen(null); ui.startQuiz({ mode: "training", label: `مزيج: ${openCourse.name}`, qids: courseMix(openCourse.id) }); }} />
              <MiniBtn icon={ClipboardCheck} title="اختبار" onClick={() => { setOpen(null); ui.startQuiz({ mode: "exam", label: `اختبار: ${openCourse.name}`, qids: courseExam(openCourse.id), timeLimitSec: EXAM_SECONDS, topicKey: examKey(openCourse.id) }); }} />
            </div>
            <div className="divide-y divide-[var(--t075)] overflow-hidden rounded-[18px] border border-[var(--t075)] dark:divide-border dark:border-border">
              {chaptersOfCourse(openCourse.id).map((ch) => {
                const b = best[topicKey(openCourse.id, ch)];
                return (
                  <button key={ch} type="button" onClick={() => { setOpen(null); startChapter(openCourse.id, ch); }} className="flex min-h-[48px] w-full min-w-0 items-center gap-2 px-3 text-right">
                    <FitText max={15} min={11} className="flex-1 font-medium">{chapterLabel(ch)}</FitText>
                    {b !== undefined && <Stars count={starsFor(b)} />}
                    <ChevronLeft className="h-4 w-4 shrink-0 text-[#C99A06]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {builder && <TestBuilder onClose={() => setBuilder(false)} />}
    </div>
  );
}
