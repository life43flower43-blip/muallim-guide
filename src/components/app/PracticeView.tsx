"use client";

// ============================================================================
// «التدريب» — مركز التدريب (منقول من صفحة «تدرّب» في أوريندو)
// ============================================================================
// إجراء رئيسي واحد أكبر من غيره (تدريب ذكي يبدأ بالأضعف)، ثم لكل مقرر:
// تدريب ذكي، مزيج من فصوله، اختبار شامل بأفضل نتيجة، وفصوله بنجومها.
// مقرر واحد مفتوح في كل مرة. ثم الأنشطة التطبيقية والمراجعة السريعة.
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
  MapPin,
  MessagesSquare,
  NotebookPen,
  Puzzle,
  RotateCcw,
  Ruler,
  Shuffle,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { COURSES, COURSE_COLOR, chaptersOfCourse, questionsOfCourse } from "@/lib/qbank";
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
import { Card, Divided, IconTile, ListRow, PageTitle, PrimaryButton, SecondaryButton, SectionHeader, Stars, pct } from "./ui-kit";

export default function PracticeView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const attempts = useApp((s) => s.attempts);
  const best = useApp((s) => s.best);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const ui = useUi();
  const { data: mistakes } = useMistakes();
  const [open, setOpen] = useState<string | null>(null);

  const due = mistakes?.stats.due ?? 0;
  const weak = useMemo(() => weakChapters(attempts, undefined, 3), [attempts]);

  const startSmart = (courseId?: string, label = "تدريب ذكي") =>
    ui.startQuiz({ mode: "training", label, qids: smartSession(attempts, courseId) });
  const startChapter = (courseId: string, chapter: string) => {
    setLastStudy(courseId, chapter);
    ui.startQuiz({ mode: "training", label: chapter, qids: chapterSession(courseId, chapter, attempts), topicKey: topicKey(courseId, chapter) });
  };

  return (
    <div className="space-y-7">
      <PageTitle title="التدريب" sub="تدرّب على ما درسته، وقِس نفسك باختبارات بمستوى الاختبار الحقيقي." />

      {/* الإجراء الرئيسي */}
      <Card className="p-5 lg:p-6">
        <div className="flex items-start gap-4">
          <IconTile icon={Sparkles} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold">تدريب ذكي</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {weak.length > 0
                ? `عشرة أسئلة تبدأ بأضعف فصولك: ${weak.map((w) => w.chapter).join("، ")}.`
                : "عشرة أسئلة من فصول لم تبدأها بعد، من الأسهل إلى الأصعب."}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <PrimaryButton onClick={() => startSmart()} className="flex-1 sm:flex-none">
            ابدأ التدريب
          </PrimaryButton>
          {due > 0 && mistakes && (
            <SecondaryButton onClick={() => ui.startQuiz({ mode: "review", label: "مراجعة الأخطاء", qids: buildReviewQids(mistakes) })}>
              <RotateCcw className="h-4 w-4" /> مراجعة {arCount(due, ERROR_DUE_FORMS)}
            </SecondaryButton>
          )}
          <SecondaryButton
            onClick={() => ui.startQuiz({ mode: "exam", label: "اختبار تجريبي شامل", qids: fullMockExam(), timeLimitSec: EXAM_SECONDS * 2, topicKey: "ALL::exam" })}
          >
            <Timer className="h-4 w-4" /> اختبار تجريبي شامل
          </SecondaryButton>
        </div>
        {best["ALL::exam"] !== undefined && (
          <p className="mt-3 text-[13px] text-muted-foreground">أفضل نتيجة في الاختبار الشامل: {pct(best["ALL::exam"])}</p>
        )}
      </Card>

      {/* حسب المقرر */}
      <section>
        <SectionHeader title="حسب المقرر" sub="افتح مقررًا لتتدرب على فصوله واحدًا واحدًا" />
        <div className="space-y-3">
          {COURSES.map((c) => {
            const isOpen = open === c.id;
            const chapters = chaptersOfCourse(c.id);
            const stars = chapters.reduce((n, ch) => n + starsFor(best[topicKey(c.id, ch)]), 0);
            const color = COURSE_COLOR[c.id] ?? "var(--primary)";
            return (
              <Card key={c.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-right"
                >
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{c.name}</span>
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {arCount(chapters.length, CHAPTER_FORMS)}، {arCount(questionsOfCourse(c.id).length, QUESTION_FORMS)}
                    </span>
                  </span>
                  <span className="text-[13px] text-gem">★ {ad(stars)}</span>
                  <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="divide-y divide-border border-t border-border">
                    <ListRow icon={Sparkles} title="تدريب ذكي في المقرر" sub="يبدأ بأضعف فصوله" onClick={() => startSmart(c.id, `تدريب ذكي: ${c.name}`)} />
                    <ListRow icon={Shuffle} title="مزيج من الفصول" sub="سؤالان من كل فصل من ثمانية" onClick={() => ui.startQuiz({ mode: "training", label: `مزيج: ${c.name}`, qids: courseMix(c.id) })} />
                    <ListRow
                      icon={ClipboardCheck}
                      title="اختبار المقرر"
                      sub="ثلاثون سؤالًا متوسطًا وصعبًا في ثلاثين دقيقة"
                      meta={best[examKey(c.id)] !== undefined ? pct(best[examKey(c.id)]) : undefined}
                      onClick={() =>
                        ui.startQuiz({ mode: "exam", label: `اختبار: ${c.name}`, qids: courseExam(c.id), timeLimitSec: EXAM_SECONDS, topicKey: examKey(c.id) })
                      }
                    />
                    {chapters.map((ch) => {
                      const st = chapterStats(c.id, ch, attempts);
                      const b = best[topicKey(c.id, ch)];
                      return (
                        <ListRow
                          key={ch}
                          title={ch}
                          sub={`${arCount(st.total, QUESTION_FORMS)}${st.answered ? `، أجبت عن ${ad(st.answered)}` : ""}`}
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
        <Divided>
          <ListRow icon={MessagesSquare} title="مختبر محاكاة الصفوف" sub="كل قرار يغيّر الموقف، والتحليل على كفاءات متعددة" onClick={ui.startSim} />
          <ListRow icon={FlaskConical} title="مختبر المعلّم" sub="قرار متفرع، ثم تحليل وتأمل" onClick={ui.startLab} />
          <ListRow icon={Users} title="مواقف صفية سريعة" sub="ماذا تفعل لو…؟" onClick={ui.startScenarios} />
          <ListRow icon={Puzzle} title="التحديات الذكية" sub="ترتيب وإكمال وإنتاج كتابي" onClick={ui.startChallenges} />
          <ListRow icon={NotebookPen} title="استوديو خطط الدروس" sub="خطة درس كاملة الأركان مع تقييمها" onClick={ui.startStudio} />
          <ListRow icon={MapPin} title="سجل التدريب الميداني" sub="زيارات المشاهدة والتنفيذ وتأملها" onClick={ui.startField} />
          <ListRow icon={Ruler} title="أدوات القياس والتقويم" sub="حاسبات إحصائية تربوية" onClick={ui.startMeasure} />
          <ListRow icon={Heart} title="قلب الصف" sub="سلّم المشاعر التربوي" onClick={ui.startHeart} />
        </Divided>
      </section>

      {/* مراجعة سريعة */}
      <section>
        <SectionHeader title="مراجعة سريعة" />
        <Divided>
          <ListRow icon={Layers} title="بطاقات المفاهيم" sub="بطاقة تنقلب لتعرض الشرح والمثال" onClick={ui.startFlash} />
          <ListRow icon={Brain} title="لعبة المطابقة" sub="مصطلح مقابل شرحه" onClick={ui.startMatch} />
          <ListRow icon={Gauge} title="اختبار تحديد المستوى" sub="اثنا عشر سؤالًا من كل المقررات" onClick={ui.startPlacement} />
          <ListRow icon={Timer} title="محاكي اختبار الرخصة والمسابقات" sub="أقسام بوقت ومحك نجاح" onClick={ui.startExamsim} />
          <ListRow icon={Users} title="تحدّي زميل" sub="أرسل رابط تحدٍّ بالأسئلة نفسها" onClick={ui.startPeer} />
        </Divided>
      </section>

      {due === 0 && (mistakes?.stats.open ?? 0) > 0 && (
        <p className="text-center text-[13px] text-muted-foreground">
          لا أخطاء مستحقة الآن.{" "}
          <button type="button" onClick={() => onGoTab("mistakes")} className="font-medium text-primary">
            عرض أخطائي
          </button>
        </p>
      )}
    </div>
  );
}
