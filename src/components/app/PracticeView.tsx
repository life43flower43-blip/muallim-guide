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
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  Heart,
  Layers,
  MapPin,
  MessagesSquare,
  NotebookPen,
  Puzzle,
  Ruler,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Award,
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
  weakChapters,
} from "@/lib/practice-bank";
import { useMistakes } from "@/lib/mistakes-client";
import { ad } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import TestBuilder from "./TestBuilder";
import { Card, Divided, ListRow, PageTitle, ProgressBar, SectionHeader, Stars, pct } from "./ui-kit";

const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

function ActionCard({ icon, title, sub, onClick, primary }: { icon: React.ElementType; title: string; sub: string; onClick: () => void; primary?: boolean }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[58px] w-full items-center gap-3 rounded-[22px] border px-3 py-2 text-right transition active:scale-[0.98]",
        primary ? "border-transparent bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] text-white" : "border-[var(--t075)] bg-white text-[var(--t900)] dark:border-border dark:bg-card dark:text-foreground"
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]", primary ? "bg-white/15 text-[#FFE27A]" : "bg-[#FFF5D6] text-[#C99A06]")}>
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">{title}</span>
      </span>
    </button>
  );
}

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
  const { data: mistakes } = useMistakes();
  const [open, setOpen] = useState<string | null>(null);
  const [builder, setBuilder] = useState(false);

  const due = mistakes?.stats.due ?? 0;
  const weak = useMemo(() => weakChapters(attempts, undefined, 3), [attempts]);
  const summary = useMemo(() => {
    const all = Object.values(attempts);
    const correct = all.filter((a) => a.correct).length;
    return { answered: all.length, accuracy: all.length ? (correct / all.length) * 100 : null };
  }, [attempts]);
  const bank = QUESTIONS.length;

  const startSmart = (courseId?: string, label = "تدريب ذكي") => ui.startQuiz({ mode: "training", label, qids: smartSession(attempts, courseId) });
  const startChapter = (courseId: string, chapter: string) => {
    setLastStudy(courseId, chapter);
    ui.startQuiz({ mode: "training", label: chapterLabel(chapter), qids: chapterSession(courseId, chapter, attempts), topicKey: topicKey(courseId, chapter) });
  };

  return (
    <div className="space-y-5">
      <PageTitle title="التدريب" />

      {/* لوحة الأداء: مضغوطة، أرقام صغيرة في صف، وشريط البنك، وأضعف فصل في سطر واحد */}
      <Card className="space-y-2.5 px-4 py-3">
        <div className="grid grid-cols-3 divide-x divide-[#EADFBE] text-center">
          {[
            [ad(summary.answered), "أجبت", false],
            [summary.accuracy === null ? "—" : pct(summary.accuracy), "الدقة", false],
            [ad(due), "للمراجعة", due > 0],
          ].map(([v, l, warn]) => (
            <div key={l as string} className="flex items-baseline justify-center gap-1.5">
              <span className={cn("font-display text-lg font-extrabold", warn ? "text-destructive" : "text-[var(--t800)]")}>{v}</span>
              <span className="whitespace-nowrap text-xs font-bold text-[var(--t450)]">{l}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ProgressBar value={bank ? (summary.answered / bank) * 100 : 0} color="#E3B23C" height={5} className="flex-1" />
          <span className="shrink-0 whitespace-nowrap">
            {ad(summary.answered)} من {ad(bank)}
          </span>
        </div>
        {weak.length > 0 && (
          <FitText max={13} min={10} className="text-muted-foreground">{`الأضعف: ${weak.map((w) => `${chapterLabel(w.chapter)} (${pct(w.accuracy * 100)})`).join("، ")}`}</FitText>
        )}
      </Card>

      {/* ابدأ: تدريب ذكي بارز، وتحته أربعة اختبارات في مربعات متساوية */}
      <section className="space-y-3">
        <ActionCard primary icon={Sparkles} title="تدريب ذكي" sub="" onClick={() => startSmart()} />
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={SlidersHorizontal} title="أنشئ اختبارك" onClick={() => setBuilder(true)} />
          <Tile icon={Timer} title="اختبار شامل" meta={best["ALL::exam"] !== undefined ? pct(best["ALL::exam"]) : undefined} onClick={() => ui.startQuiz({ mode: "exam", label: "اختبار تجريبي شامل", qids: fullMockExam(), timeLimitSec: EXAM_SECONDS * 2, topicKey: "ALL::exam" })} />
          <Tile icon={Award} title="الاختبار الرسمي" onClick={ui.startExamsim} />
          <Tile icon={Gauge} title="تحديد المستوى" onClick={ui.startPlacement} />
        </div>
      </section>

      {/* حسب المحور: كل محور يُفتح على فصوله */}
      <section>
        <SectionHeader title="حسب المحور" />
        <Divided>
          {COURSES.map((c) => {
            const isOpen = open === c.id;
            const chapters = chaptersOfCourse(c.id);
            const stars = chapters.reduce((n, ch) => n + starsFor(best[topicKey(c.id, ch)]), 0);
            const color = COURSE_COLOR[c.id] ?? "var(--primary)";
            return (
              <div key={c.id}>
                <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} className="flex min-h-[58px] w-full min-w-0 items-center gap-3 px-4 py-2.5 text-right">
                  <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                  <FitText max={16} min={11} className="flex-1 font-bold leading-7">{c.name}</FitText>
                  {stars > 0 && <span className="shrink-0 text-sm font-bold text-[#B8860B]">★ {ad(stars)}</span>}
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-[#C99A06] transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="space-y-2 bg-[var(--t025)] px-3 pb-3 pt-1 dark:bg-background">
                    <div className="grid grid-cols-3 gap-2">
                      <MiniBtn icon={Sparkles} title="ذكي" onClick={() => startSmart(c.id, `تدريب ذكي: ${c.name}`)} />
                      <MiniBtn icon={Shuffle} title="مزيج" onClick={() => ui.startQuiz({ mode: "training", label: `مزيج: ${c.name}`, qids: courseMix(c.id) })} />
                      <MiniBtn
                        icon={ClipboardCheck}
                        title="اختبار"
                        onClick={() => ui.startQuiz({ mode: "exam", label: `اختبار: ${c.name}`, qids: courseExam(c.id), timeLimitSec: EXAM_SECONDS, topicKey: examKey(c.id) })}
                      />
                    </div>
                    <div className="divide-y divide-[var(--t075)] overflow-hidden rounded-[18px] bg-white dark:divide-border dark:bg-card">
                      {chapters.map((ch) => {
                        const b = best[topicKey(c.id, ch)];
                        return (
                          <button key={ch} type="button" onClick={() => startChapter(c.id, ch)} className="flex min-h-[48px] w-full min-w-0 items-center gap-2 px-3 text-right">
                            <FitText max={15} min={11} className="flex-1 font-medium">{chapterLabel(ch)}</FitText>
                            {b !== undefined && <Stars count={starsFor(b)} />}
                            <ChevronLeft className="h-4 w-4 shrink-0 text-[#C99A06]" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Divided>
      </section>

      {/* تطبيق عملي: مربعات متساوية بثلاثة أعمدة */}
      <section>
        <SectionHeader title="تطبيق عملي" />
        <div className="grid grid-cols-3 gap-2.5">
          <Tile small icon={MessagesSquare} title="محاكاة الصفوف" onClick={ui.startSim} />
          <Tile small icon={FlaskConical} title="مختبر المعلّم" onClick={ui.startLab} />
          <Tile small icon={Users} title="مواقف سريعة" onClick={ui.startScenarios} />
          <Tile small icon={Puzzle} title="التحديات" onClick={ui.startChallenges} />
          <Tile small icon={NotebookPen} title="خطط الدروس" onClick={ui.startStudio} />
          <Tile small icon={MapPin} title="التدريب الميداني" onClick={ui.startField} />
          <Tile small icon={Ruler} title="أدوات القياس" onClick={ui.startMeasure} />
          <Tile small icon={Heart} title="قلب الصف" onClick={ui.startHeart} />
          <Tile small icon={Layers} title="بطاقات المفاهيم" onClick={ui.startFlash} />
        </div>
      </section>

      <Divided>
        <ListRow icon={Users} title="تحدّي زميل" onClick={ui.startPeer} />
      </Divided>

      {builder && <TestBuilder onClose={() => setBuilder(false)} />}
    </div>
  );
}
