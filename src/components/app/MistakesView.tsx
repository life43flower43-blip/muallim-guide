"use client";

// ============================================================================
// «أخطائي» — منقول من صفحة الأخطاء في أوريندو
// ============================================================================
// إجراء واحد في الأعلى: مراجعة المستحق الآن (اثنا عشر خطأً بحد أقصى).
// ثم تقدم الإصلاح، وتصفية حسب المقرر، والأخطاء الأكثر تكرارًا بأسلوب
// «تذكّر أولًا»: الإجابة الصحيحة لا تظهر إلا بعد الضغط.
// ============================================================================

import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, Eye, PartyPopper, RotateCcw } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { COURSE_COLOR } from "@/lib/qbank";
import { useMistakes, buildReviewQids, REVIEW_SESSION_SIZE, type MistakeItem } from "@/lib/mistakes-client";
import { ad, arCount, ERROR_DUE_FORMS, ERROR_OBJ_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import { Card, EmptyState, PageTitle, PrimaryButton, ProgressBar, SecondaryButton, SectionHeader } from "./ui-kit";

const TIMES = { one: "مرة واحدة", two: "مرتين", few: "مرات", many: "مرة" };

function MistakeCard({ item, onConcept }: { item: MistakeItem; onConcept: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const q = item.question;
  return (
    <Card className="p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-secondary-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: COURSE_COLOR[item.courseId] ?? "var(--primary)" }} />
          {item.concept?.chapter ?? "عام"}
        </span>
        <span className="rounded-md bg-danger-soft px-2 py-1 font-medium text-destructive">أخطأت {arCount(item.mistakeCount, TIMES)}</span>
        {item.due && <span className="rounded-md bg-gem-soft px-2 py-1 font-medium text-gem">مستحق</span>}
      </div>
      <p className="text-[15px] font-medium leading-7">{q.question}</p>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          <Eye className="h-4 w-4" /> تذكّر الإجابة ثم اكشفها
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          {item.userAnswer && item.userAnswer !== q.correct && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">إجابتك: {item.userAnswer}</p>
          )}
          <p className="flex items-start gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {q.correct}
          </p>
          <p className="text-[13px] leading-6 text-muted-foreground">{q.reason}</p>
          {item.concept && (
            <button type="button" onClick={onConcept} className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-primary">
              <BookOpen className="h-4 w-4" /> راجع مفهوم «{item.concept.title}»
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

export default function MistakesView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const ui = useUi();
  const { data, isLoading, isError, refetch } = useMistakes();
  const [course, setCourse] = useState<string | null>(null);

  const items = useMemo(() => (data?.items ?? []).filter((i) => !course || i.courseId === course), [data, course]);
  const repeated = useMemo(() => [...items].sort((a, b) => Number(b.due) - Number(a.due) || b.mistakeCount - a.mistakeCount).slice(0, 20), [items]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="تعذّر تحميل أخطائك"
        sub="تأكد من الاتصال ثم أعد المحاولة."
        action={<PrimaryButton onClick={() => refetch()}>إعادة المحاولة</PrimaryButton>}
      />
    );
  }

  const { due, open, mastered } = data.stats;
  const review = (courseId: string | null) =>
    ui.startQuiz({ mode: "review", label: "مراجعة الأخطاء", qids: buildReviewQids(data, courseId) });

  return (
    <div className="space-y-6">
      <PageTitle title="أخطائي" sub="كل خطأ يعود إليك في موعده حتى تجيبه صحيحًا مرتين متباعدتين." />

      {open === 0 && data.refresh.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="لا أخطاء مفتوحة"
          sub={mastered ? `أصلحت ${arCount(mastered, ERROR_OBJ_FORMS)} حتى الآن. استمر في التدريب.` : "كل إجابة خاطئة في التدريب تظهر هنا مع شرحها."}
          action={<PrimaryButton onClick={() => onGoTab("practice")}>اذهب إلى التدريب</PrimaryButton>}
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "مستحقة الآن", value: due, cls: due > 0 ? "text-destructive" : "" },
              { label: "مفتوحة", value: open, cls: "" },
              { label: "أصلحتها", value: mastered, cls: "text-success" },
            ].map((s) => (
              <Card key={s.label} className="px-3 py-4 text-center">
                <p className={cn("font-display text-2xl font-bold", s.cls)}>{s.value === null ? "—" : ad(s.value)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <p className="font-display text-lg font-semibold">
              {due > 0 ? `لديك ${arCount(due, ERROR_DUE_FORMS)}` : "لا مراجعة مستحقة الآن"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {due > 0 ? "قرابة سبع دقائق، وتكسب بها جواهر." : "يمكنك التدرب على أخطائك المفتوحة قبل موعدها."}
            </p>
            {mastered !== null && mastered + open > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[13px] text-muted-foreground">
                  <span>تقدم الإصلاح</span>
                  <span>
                    {ad(mastered)} من {ad(mastered + open)}
                  </span>
                </div>
                <ProgressBar value={(mastered / (mastered + open)) * 100} color="var(--success)" />
              </div>
            )}
            <PrimaryButton onClick={() => review(null)} className="mt-4 w-full sm:w-auto">
              <RotateCcw className="h-4 w-4" />
              {due > 0 ? `راجع ${arCount(Math.min(due, REVIEW_SESSION_SIZE), ERROR_OBJ_FORMS)}` : "تدرّب عليها الآن"}
            </PrimaryButton>
            {data.refresh.length > 0 && (
              <p className="mt-3 text-[13px] text-muted-foreground">
                وتدخل الجلسة {arCount(data.refresh.length, ERROR_OBJ_FORMS)} أصلحتها من قبل، للتثبيت.
              </p>
            )}
          </Card>

          {data.isGuest && (
            <Card className="flex flex-wrap items-center gap-3 p-4">
              <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">أخطاؤك محفوظة على هذا الجهاز فقط. سجّل الدخول لتحفظها في حسابك وتراها على أي جهاز.</p>
              <SecondaryButton onClick={() => onGoTab("profile")}>تسجيل الدخول</SecondaryButton>
            </Card>
          )}

          {data.byCourse.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="تصفية حسب المقرر">
              {[{ courseId: null as string | null, name: "الكل", count: open }, ...data.byCourse].map((g) => (
                <button
                  key={g.courseId ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={course === g.courseId}
                  onClick={() => setCourse(g.courseId)}
                  className={cn(
                    "min-h-[40px] shrink-0 rounded-full border px-4 text-sm transition-colors",
                    course === g.courseId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-secondary-foreground hover:bg-muted"
                  )}
                >
                  {g.name}، {ad(g.count)}
                </button>
              ))}
            </div>
          )}

          <section>
            <SectionHeader
              title="الأكثر تكرارًا"
              sub="تذكّر الإجابة قبل كشفها: الاسترجاع أقوى من إعادة القراءة"
              action={
                course && (
                  <button type="button" onClick={() => review(course)} className="min-h-[36px] text-sm font-medium text-primary">
                    راجع هذا المقرر
                  </button>
                )
              }
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {repeated.map((it) => (
                <MistakeCard
                  key={it.id}
                  item={it}
                  onConcept={() => {
                    if (!it.concept) return;
                    ui.openCourseTab(it.concept.courseId);
                    ui.openConcept(it.concept.id);
                    onGoTab("learn");
                  }}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
