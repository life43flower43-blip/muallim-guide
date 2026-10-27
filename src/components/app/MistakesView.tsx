"use client";

// ============================================================================
// «أخطائي» — مراجعة متباعدة على نمط Anki وUWorld
// ============================================================================
// ١) إجراء واحد في الأعلى: مراجعة المستحق الآن، مع تقدم الإصلاح.
// ٢) جدول المراجعة للأيام السبعة القادمة (كم خطأً يعود كل يوم).
// ٣) المفاهيم الأضعف: أين تتجمع أخطاؤك، مع قراءة المفهوم أو التدرب عليه.
// ٤) قائمة الأخطاء بأسلوب «تذكّر أولًا»، وتصفية حسب الحالة والمحور.
// ============================================================================

import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, Dumbbell, Eye, PartyPopper, RotateCcw } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { COURSE_COLOR, COURSE_SHORT, questionsOfConcept, shuffle } from "@/lib/qbank";
import { useMistakes, buildReviewQids, REVIEW_SESSION_SIZE, type MistakeItem } from "@/lib/mistakes-client";
import { ad, arCount, ERROR_OBJ_FORMS, splitReason } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import { ConceptReader } from "./ConceptsView";
import { Card, Chip, EmptyState, PageTitle, PrimaryButton, SectionHeader } from "./ui-kit";

const TIMES = { one: "مرة واحدة", two: "مرتين", few: "مرات", many: "مرة" };
const dateFmt = new Intl.DateTimeFormat("ar-u-nu-arab", { day: "numeric", month: "short" });

function MistakeCard({ item, onConcept }: { item: MistakeItem; onConcept: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const q = item.question;
  const { base } = splitReason(q.reason);
  const next = item.nextReview ? new Date(item.nextReview) : null;
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Chip>
          <span className="h-2 w-2 rounded-full" style={{ background: COURSE_COLOR[item.courseId] ?? "var(--primary)" }} />
          {COURSE_SHORT[item.courseId] ?? "عام"}
        </Chip>
        <Chip tone="danger">أخطأت {arCount(item.mistakeCount, TIMES)}</Chip>
        {item.due ? <Chip tone="warning">مستحق الآن</Chip> : next && <Chip>يعود {dateFmt.format(next)}</Chip>}
      </div>
      <p className="text-base font-medium leading-7">{q.question}</p>

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
          {item.userAnswer && item.userAnswer !== q.correct && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">إجابتك: {item.userAnswer}</p>}
          <p className="flex items-start gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {q.correct}
          </p>
          <p className="text-sm leading-7 text-secondary-foreground">{base}</p>
          {item.concept && (
            <button type="button" onClick={onConcept} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-primary hover:bg-accent">
              <BookOpen className="h-4 w-4" /> اقرأ مفهوم «{item.concept.title}»
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
  const [status, setStatus] = useState<"due" | "all">("all");
  const [readerId, setReaderId] = useState<string | null>(null);

  const items = useMemo(() => (data?.items ?? []).filter((i) => (!course || i.courseId === course) && (status === "all" || i.due)), [data, course, status]);
  const sorted = useMemo(() => [...items].sort((a, b) => Number(b.due) - Number(a.due) || b.mistakeCount - a.mistakeCount).slice(0, 30), [items]);

  // المفاهيم الأضعف: أين تتجمع الأخطاء المفتوحة
  const weakConcepts = useMemo(() => {
    const m = new Map<string, { concept: NonNullable<MistakeItem["concept"]>; count: number; total: number }>();
    for (const it of data?.items ?? []) {
      if (!it.concept) continue;
      const row = m.get(it.concept.id) ?? { concept: it.concept, count: 0, total: 0 };
      row.count++;
      row.total += it.mistakeCount;
      m.set(it.concept.id, row);
    }
    return [...m.values()].sort((a, b) => b.count - a.count || b.total - a.total).slice(0, 5);
  }, [data]);

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
    return <EmptyState icon={AlertCircle} title="تعذّر تحميل أخطائك" sub="تأكد من الاتصال ثم أعد المحاولة." action={<PrimaryButton onClick={() => refetch()}>إعادة المحاولة</PrimaryButton>} />;
  }

  const { due, open, mastered } = data.stats;
  const review = (courseId: string | null) => ui.startQuiz({ mode: "review", label: "مراجعة الأخطاء", qids: buildReviewQids(data, courseId) });
  const reader = readerId && <ConceptReader conceptId={readerId} onClose={() => setReaderId(null)} />;

  if (open === 0 && data.refresh.length === 0) {
    return (
      <div className="space-y-6">
        <PageTitle title="أخطائي" sub="كل خطأ يعود إليك في موعده حتى تجيبه صحيحًا مرتين متباعدتين" />
        <EmptyState
          icon={PartyPopper}
          title="لا أخطاء مفتوحة"
          sub={mastered ? `أصلحت ${arCount(mastered, ERROR_OBJ_FORMS)} حتى الآن. استمر في التدريب.` : "كل إجابة خاطئة في التدريب تظهر هنا مع شرحها، وتعود إليك في موعدها."}
          action={<PrimaryButton onClick={() => onGoTab("practice")}>اذهب إلى التدريب</PrimaryButton>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="أخطائي" sub="كل خطأ يعود إليك في موعده حتى تجيبه صحيحًا مرتين متباعدتين" />

      {/* زر المراجعة وحده */}
      <PrimaryButton onClick={() => review(null)} className="w-full">
        <RotateCcw className="h-4 w-4" />
        {due > 0 ? `راجع ${arCount(Math.min(due, REVIEW_SESSION_SIZE), ERROR_OBJ_FORMS)}` : "تدرّب عليها قبل موعدها"}
      </PrimaryButton>

      {/* المفاهيم الأضعف */}
      {weakConcepts.length > 0 && (
        <section>
          <SectionHeader title="أين تتجمع أخطاؤك" sub="المفاهيم التي تكررت فيها الأخطاء، وابدأ بقراءتها" />
          <Card className="divide-y divide-border overflow-hidden">
            {weakConcepts.map((w) => (
              <div key={w.concept.id} className="flex min-h-[64px] items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft font-display text-sm font-bold text-destructive">{ad(w.count)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">{w.concept.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{COURSE_SHORT[w.concept.courseId]}</p>
                </div>
                <button type="button" onClick={() => setReaderId(w.concept.id)} aria-label={`اقرأ ${w.concept.title}`} className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-accent">
                  <BookOpen className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => ui.startQuiz({ mode: "training", label: `تدريب: ${w.concept.title}`, qids: shuffle(questionsOfConcept(w.concept.id)).map((q) => q.id), conceptId: w.concept.id })}
                  aria-label={`تدرّب على ${w.concept.title}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-accent"
                >
                  <Dumbbell className="h-5 w-5" />
                </button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* القائمة */}
      <section>
        <SectionHeader
          title="أخطاؤك"
          sub="تذكّر الإجابة قبل كشفها: الاسترجاع أقوى من إعادة القراءة"
          action={
            course && (
              <button type="button" onClick={() => review(course)} className="min-h-[36px] text-sm font-medium text-primary">
                راجع هذا المحور
              </button>
            )
          }
        />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="الحالة" className="flex rounded-lg bg-muted p-0.5">
            {(
              [
                ["all", `كلها ${ad(open)}`],
                ["due", `المستحقة ${ad(due)}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={status === id}
                onClick={() => setStatus(id)}
                className={cn("min-h-[36px] rounded-md px-3 text-sm transition-colors", status === id ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
              >
                {label}
              </button>
            ))}
          </div>
          {data.byCourse.length > 1 && (
            <div className="no-scrollbar -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="تصفية حسب المحور">
              {[{ courseId: null as string | null, name: "كل المحاور", count: open }, ...data.byCourse].map((g) => (
                <button
                  key={g.courseId ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={course === g.courseId}
                  onClick={() => setCourse(g.courseId)}
                  className={cn(
                    "min-h-[36px] shrink-0 rounded-full border px-3 text-sm transition-colors",
                    course === g.courseId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-secondary-foreground hover:bg-muted"
                  )}
                >
                  {g.courseId ? COURSE_SHORT[g.courseId] ?? g.name : g.name} {ad(g.count)}
                </button>
              ))}
            </div>
          )}
        </div>
        {sorted.length === 0 ? (
          <p className="rounded-xl bg-muted p-4 text-center text-sm text-muted-foreground">لا أخطاء بهذه التصفية</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {sorted.map((it) => (
              <MistakeCard key={it.id} item={it} onConcept={() => it.concept && setReaderId(it.concept.id)} />
            ))}
          </div>
        )}
      </section>

      {reader}
    </div>
  );
}
