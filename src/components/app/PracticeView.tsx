"use client";

// ============================================================================
// «التدريب» — مركز التدريب على نمط منصات بنوك الأسئلة (UWorld وKaplan)
// ============================================================================
// ١) لوحة أداء: الجاهزية، وما استخدمته من البنك، والدقة، والأخطاء المستحقة.
// ٢) أربعة إجراءات: تدريب ذكي، وأنشئ اختبارك، واختبار شامل، ومحاكي الاختبار الرسمي.
// ٣) اختباراتك السابقة بنتائجها.
// ٤) حسب المحور: فصوله بنجوم أفضل نتيجة ودقة كل فصل.
// ٥) التطبيق في مواقف حقيقية، والمراجعة السريعة.
// ============================================================================

import { useMemo, useState } from "react";
import {
  Brain,
  ChevronDown,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  Heart,
  Layers,
  ListChecks,
  MapPin,
  MessagesSquare,
  NotebookPen,
  Puzzle,
  RotateCcw,
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
import { useMistakes, buildReviewQids } from "@/lib/mistakes-client";
import { ad, arCount, CHAPTER_FORMS, ERROR_DUE_FORMS, QUESTION_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import TestBuilder from "./TestBuilder";
import { Card, Divided, ListRow, PageTitle, ProgressBar, SecondaryButton, SectionHeader, Stars, pct } from "./ui-kit";

const TEST_MODES = new Set(["training", "exam", "review", "redo", "proficiency", "quick", "intensive"]);
const dateFmt = new Intl.DateTimeFormat("ar-u-nu-arab", { day: "numeric", month: "short" });
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");
const fmtDur = (s: number) => (s < 60 ? `${ad(s)} ث` : `${ad(Math.round(s / 60))} د`);

function ActionCard({ icon, title, sub, onClick, primary }: { icon: React.ElementType; title: string; sub: string; onClick: () => void; primary?: boolean }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[76px] items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-right transition active:translate-y-[2px] active:border-b-2",
        primary ? "border-[color-mix(in_srgb,var(--primary)_70%,black)] bg-primary text-primary-foreground" : "border-border bg-card"
      )}
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", primary ? "bg-white/15" : "bg-accent text-primary")}>
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold">{title}</span>
        <span className={cn("mt-0.5 block text-sm leading-5", primary ? "text-primary-foreground/85" : "text-muted-foreground")}>{sub}</span>
      </span>
    </button>
  );
}

export default function PracticeView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const best = useApp((s) => s.best);
  const sessions = useApp((s) => s.sessions);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const ui = useUi();
  const { data: mistakes } = useMistakes();
  const [open, setOpen] = useState<string | null>(null);
  const [builder, setBuilder] = useState(false);
  const [showAllTests, setShowAllTests] = useState(false);

  const due = mistakes?.stats.due ?? 0;
  const weak = useMemo(() => weakChapters(attempts, undefined, 3), [attempts]);
  const summary = useMemo(() => {
    const all = Object.values(attempts);
    const correct = all.filter((a) => a.correct).length;
    return { answered: all.length, accuracy: all.length ? (correct / all.length) * 100 : null };
  }, [attempts]);
  const bank = QUESTIONS.length;
  const tests = useMemo(() => [...sessions].filter((s) => TEST_MODES.has(s.mode) && s.total > 0).sort((a, b) => b.ts - a.ts), [sessions]);

  const startSmart = (courseId?: string, label = "تدريب ذكي") => ui.startQuiz({ mode: "training", label, qids: smartSession(attempts, courseId) });
  const startChapter = (courseId: string, chapter: string) => {
    setLastStudy(courseId, chapter);
    ui.startQuiz({ mode: "training", label: chapterLabel(chapter), qids: chapterSession(courseId, chapter, attempts), topicKey: topicKey(courseId, chapter) });
  };

  return (
    <div className="space-y-8">
      <PageTitle title="التدريب" sub="تدرّب على ما درسته، وقِس نفسك باختبارات بمستوى الاختبار الحقيقي" />

      {/* لوحة الأداء */}
      <Card className="p-5 lg:p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid min-w-[220px] flex-1 grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-xl font-bold">{ad(summary.answered)}</p>
              <p className="text-xs text-muted-foreground">سؤالًا أجبت عنه</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold">{summary.accuracy === null ? "—" : pct(summary.accuracy)}</p>
              <p className="text-xs text-muted-foreground">الدقة</p>
            </div>
            <div>
              <p className={cn("font-display text-xl font-bold", due > 0 && "text-destructive")}>{ad(due)}</p>
              <p className="text-xs text-muted-foreground">خطأ مستحق</p>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-sm text-muted-foreground">
            <span>ما استخدمته من بنك الأسئلة</span>
            <span>
              {ad(summary.answered)} من {ad(bank)}
            </span>
          </div>
          <ProgressBar value={bank ? (summary.answered / bank) * 100 : 0} />
        </div>
        {weak.length > 0 && (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            أضعف فصولك الآن: <span className="text-foreground">{weak.map((w) => `${chapterLabel(w.chapter)} (${pct(w.accuracy * 100)})`).join("، ")}</span>
          </p>
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

      {due > 0 && mistakes && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <RotateCcw className="h-5 w-5 shrink-0 text-destructive" />
          <p className="min-w-0 flex-1 text-sm">لديك {arCount(due, ERROR_DUE_FORMS)} للمراجعة، والمراجعة في موعدها تثبّت ما تعلمته.</p>
          <SecondaryButton onClick={() => ui.startQuiz({ mode: "review", label: "مراجعة الأخطاء", qids: buildReviewQids(mistakes) })}>راجع الآن</SecondaryButton>
        </Card>
      )}

      {/* الاختبارات السابقة */}
      {tests.length > 0 && (
        <section>
          <SectionHeader
            title="اختباراتك السابقة"
            action={
              tests.length > 5 && (
                <button type="button" onClick={() => setShowAllTests((v) => !v)} className="min-h-[36px] text-sm font-medium text-primary">
                  {showAllTests ? "أقل" : `عرض الكل (${ad(tests.length)})`}
                </button>
              )
            }
          />
          <Divided>
            {(showAllTests ? tests.slice(0, 30) : tests.slice(0, 5)).map((t) => {
              const v = (t.correctCount / t.total) * 100;
              return (
                <div key={t.id} className="flex min-h-[60px] items-center gap-3 px-4 py-3">
                  <ListChecks className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">{t.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {dateFmt.format(new Date(t.ts))}، {arCount(t.total, QUESTION_FORMS)}، {fmtDur(t.durationSec)}
                    </p>
                  </div>
                  <span className={cn("rounded-md px-2 py-1 text-sm font-semibold", v >= 70 ? "bg-success-soft text-success" : v >= 50 ? "bg-gem-soft text-gem" : "bg-danger-soft text-destructive")}>{pct(v)}</span>
                </div>
              );
            })}
          </Divided>
        </section>
      )}

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
          <ListRow icon={Brain} title="لعبة المطابقة" sub="مصطلح مقابل شرحه" onClick={ui.startMatch} />
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
