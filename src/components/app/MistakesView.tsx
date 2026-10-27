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
import { AlertCircle, BookOpen, CheckCircle2, Eye, PartyPopper, RotateCcw } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { COURSE_COLOR, COURSE_SHORT } from "@/lib/qbank";
import { useMistakes, buildReviewQids, REVIEW_SESSION_SIZE, type MistakeItem } from "@/lib/mistakes-client";
import { ad, arCount, ERROR_OBJ_FORMS, splitReason } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Tab } from "./AppShell";
import { ConceptReader } from "./ConceptsView";
import { EmptyState, PageTitle, PrimaryButton } from "./ui-kit";


function MistakeCard({ item, onConcept }: { item: MistakeItem; onConcept: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const q = item.question;
  const { base } = splitReason(q.reason);
  return (
    <div className="rounded-[22px] border border-[var(--t075)] bg-white p-4 dark:border-border dark:bg-card">
      {/* سطر واحد: المحور، وعدد مرات الخطأ */}
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COURSE_COLOR[item.courseId] ?? "var(--primary)" }} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-bold text-[var(--t500)]">{COURSE_SHORT[item.courseId] ?? "عام"}</span>
        {item.mistakeCount > 1 && <span dir="ltr" className="shrink-0 rounded-full bg-danger-soft px-2 text-xs font-bold leading-6 text-destructive">×{ad(item.mistakeCount)}</span>}
      </div>
      <p className="font-bold leading-8">{q.question}</p>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#FBF1D6] text-sm font-bold text-[#9A6A12] transition active:scale-[0.98]"
        >
          <Eye className="h-4 w-4" /> اكشف الإجابة
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          {item.userAnswer && item.userAnswer !== q.correct && <p className="rounded-[14px] bg-danger-soft px-3 py-2 text-sm text-destructive">إجابتك: {item.userAnswer}</p>}
          <p className="flex items-start gap-2 rounded-[14px] bg-[var(--t100)] px-3 py-2 text-sm font-bold text-[var(--t900)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--t800)]" /> {q.correct}
          </p>
          <p className="text-sm leading-7 text-secondary-foreground">{base}</p>
          {item.concept && (
            <button type="button" onClick={onConcept} className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-[#B8860B]">
              <BookOpen className="h-4 w-4" /> اقرأ المفهوم
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MistakesView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const ui = useUi();
  const { data, isLoading, isError, refetch } = useMistakes();
  const [course, setCourse] = useState<string | null>(null);
    const [readerId, setReaderId] = useState<string | null>(null);

  const items = useMemo(() => (data?.items ?? []).filter((i) => !course || i.courseId === course), [data, course]);
  const sorted = useMemo(() => [...items].sort((a, b) => Number(b.due) - Number(a.due) || b.mistakeCount - a.mistakeCount).slice(0, 30), [items]);

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
    <div className="space-y-4">
      <PageTitle title="أخطائي" />

      {/* زر المراجعة */}
      <PrimaryButton onClick={() => review(course)} className="w-full">
        <RotateCcw className="h-4 w-4" />
        {due > 0 ? `راجع ${arCount(Math.min(due, REVIEW_SESSION_SIZE), ERROR_OBJ_FORMS)}` : "تدرّب عليها قبل موعدها"}
      </PrimaryButton>

      {/* تصفية واحدة حسب المحور */}
      {data.byCourse.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="تصفية حسب المحور">
          {[{ courseId: null as string | null, name: "الكل", count: open }, ...data.byCourse].map((g) => (
            <button
              key={g.courseId ?? "all"}
              type="button"
              role="tab"
              aria-selected={course === g.courseId}
              onClick={() => setCourse(g.courseId)}
              className={cn(
                "min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm font-bold transition-colors",
                course === g.courseId ? "border-transparent bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] text-white" : "border-[#E3D3A0] bg-white text-[var(--t500)] dark:bg-card"
              )}
            >
              {g.courseId ? COURSE_SHORT[g.courseId] ?? g.name : g.name} {ad(g.count)}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {sorted.map((it) => (
          <MistakeCard key={it.id} item={it} onConcept={() => it.concept && setReaderId(it.concept.id)} />
        ))}
      </div>

      {reader}
    </div>
  );
}
