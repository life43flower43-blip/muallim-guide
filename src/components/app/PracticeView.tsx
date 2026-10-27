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
import { COURSES, COURSE_COLOR, QUESTIONS, chaptersOfCourse, questionsOfCourse } from "@/lib/qbank";
import {
  EXAM_SECONDS,
  chapterSession,
  chapterStats,
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
import { ad, arCount, CHAPTER_FORMS, QUESTION_FORMS } from "@/lib/arabic";
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
        "flex min-h-[58px] items-center gap-3 rounded-[22px] border px-3 py-2 text-right transition active:scale-[0.98]",
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
      <PageTitle title="التدريب" sub="تدرّب على ما درسته، وقِس نفسك باختبارات بمستوى الاختبار الحقيقي" />

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

      {/* الإجراءات */}
      <section className="grid gap-3 sm:grid-cols-2">
        <ActionCard primary icon={Sparkles} title="تدريب ذكي" sub="عشرة أسئلة تبدأ بأضعف فصولك" onClick={() => startSmart()} />
        <ActionCard icon={SlidersHorizontal} title="أنشئ اختبارك" sub="اختر المحاور والعدد والنمط" onClick={() => setBuilder(true)} />
        <ActionCard
          icon={Timer}
          title="اختبار شامل"
          sub={best["ALL::exam"] !== undefined ? `ستون سؤالًا، وأفضل نتيجة ${pct(best["ALL::exam"])}` : "ستون سؤالًا في ساعة"}
          onClick={() => ui.startQuiz({ mode: "exam", label: "اختبار تجريبي شامل", qids: fullMockExam(), timeLimitSec: EXAM_SECONDS * 2, topicKey: "ALL::exam" })}
        />
        <ActionCard icon={Award} title="الاختبار الرسمي" sub="محاكاة اختبارات التوظيف العربية" onClick={ui.startExamsim} />
      </section>

      {/* حسب المحور */}
      <section>
        <SectionHeader title="حسب المحور" sub="افتح محورًا لتتدرب على فصوله" />
        <div className="space-y-3">
          {COURSES.map((c) => {
            const isOpen = open === c.id;
            const chapters = chaptersOfCourse(c.id);
            const stars = chapters.reduce((n, ch) => n + starsFor(best[topicKey(c.id, ch)]), 0);
            const color = COURSE_COLOR[c.id] ?? "var(--primary)";
            return (
              <Card key={c.id} className="overflow-hidden">
                <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-right">
                  <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{c.name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {arCount(chapters.length, CHAPTER_FORMS)}، {arCount(questionsOfCourse(c.id).length, QUESTION_FORMS)}
                    </span>
                  </span>
                  <span className="text-sm text-gem">★ {ad(stars)}</span>
                  <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="divide-y divide-border border-t border-border">
                    <ListRow icon={Sparkles} title="تدريب ذكي في المحور" sub="يبدأ بأضعف فصوله" onClick={() => startSmart(c.id, `تدريب ذكي: ${c.name}`)} />
                    <ListRow icon={Shuffle} title="مزيج من الفصول" sub="سؤالان من كل فصل من ثمانية" onClick={() => ui.startQuiz({ mode: "training", label: `مزيج: ${c.name}`, qids: courseMix(c.id) })} />
                    <ListRow
                      icon={ClipboardCheck}
                      title="اختبار المحور"
                      sub="ثلاثون سؤالًا متوسطًا وصعبًا في ثلاثين دقيقة"
                      meta={best[examKey(c.id)] !== undefined ? pct(best[examKey(c.id)]) : undefined}
                      onClick={() => ui.startQuiz({ mode: "exam", label: `اختبار: ${c.name}`, qids: courseExam(c.id), timeLimitSec: EXAM_SECONDS, topicKey: examKey(c.id) })}
                    />
                    {chapters.map((ch) => {
                      const st = chapterStats(c.id, ch, attempts);
                      const b = best[topicKey(c.id, ch)];
                      return (
                        <ListRow
                          key={ch}
                          title={chapterLabel(ch)}
                          sub={`${arCount(st.total, QUESTION_FORMS)}${st.answered ? `، أجبت عن ${ad(st.answered)} بدقة ${pct((st.accuracy ?? 0) * 100)}` : ""}`}
                          meta={b !== undefined ? <Stars count={starsFor(b)} /> : undefined}
                          onClick={() => startChapter(c.id, ch)}
                        />
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* أنشطة تطبيقية */}
      <section>
        <SectionHeader title="تطبيق في مواقف حقيقية" sub="من المعرفة إلى القرار داخل الصف" />
        <div className="grid gap-3 lg:grid-cols-2">
          <Divided>
            <ListRow icon={MessagesSquare} title="مختبر محاكاة الصفوف" sub="كل قرار يغيّر الموقف" onClick={ui.startSim} />
            <ListRow icon={FlaskConical} title="مختبر المعلّم" sub="قرار متفرع، ثم تحليل وتأمل" onClick={ui.startLab} />
            <ListRow icon={Users} title="مواقف صفية سريعة" sub="ماذا تفعل لو…؟" onClick={ui.startScenarios} />
            <ListRow icon={Puzzle} title="التحديات الذكية" sub="ترتيب وإكمال وإنتاج كتابي" onClick={ui.startChallenges} />
          </Divided>
          <Divided>
            <ListRow icon={NotebookPen} title="استوديو خطط الدروس" sub="خطة درس كاملة مع تقييمها" onClick={ui.startStudio} />
            <ListRow icon={MapPin} title="سجل التدريب الميداني" sub="زيارات المشاهدة والتنفيذ" onClick={ui.startField} />
            <ListRow icon={Ruler} title="أدوات القياس والتقويم" sub="حاسبات إحصائية تربوية" onClick={ui.startMeasure} />
            <ListRow icon={Heart} title="قلب الصف" sub="مشاعر الطلاب خلف تصرفاتهم" onClick={ui.startHeart} />
          </Divided>
        </div>
      </section>

      {/* مراجعة سريعة */}
      <section>
        <SectionHeader title="مراجعة سريعة" />
        <Divided>
          <ListRow icon={Layers} title="بطاقات المفاهيم" sub="بطاقة تنقلب لتعرض الشرح والمثال" onClick={ui.startFlash} />
          <ListRow icon={Gauge} title="اختبار تحديد المستوى" sub="اثنا عشر سؤالًا من كل المحاور" onClick={ui.startPlacement} />
          <ListRow icon={Users} title="تحدّي زميل" sub="أرسل رابط تحدٍّ بالأسئلة نفسها" onClick={ui.startPeer} />
        </Divided>
      </section>

      {due === 0 && (mistakes?.stats.open ?? 0) > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          لا أخطاء مستحقة الآن.{" "}
          <button type="button" onClick={() => onGoTab("mistakes")} className="font-medium text-primary">
            عرض أخطائي
          </button>
        </p>
      )}

      {builder && <TestBuilder onClose={() => setBuilder(false)} />}
    </div>
  );
}
