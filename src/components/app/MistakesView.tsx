"use client";

// ============================================================================
// «أخطائي» — مراجعة متباعدة على نمط Anki وUWorld
// ============================================================================
// ١) إجراء واحد في الأعلى: مراجعة المستحق الآن، مع تقدم الإصلاح.
// ٢) جدول المراجعة للأيام السبعة القادمة (كم خطأً يعود كل يوم).
// ٣) المفاهيم الأضعف: أين تتجمع أخطاؤك، مع قراءة المفهوم أو التدرب عليه.
// ٤) قائمة الأخطاء بأسلوب «تذكّر أولًا»، مرتبة في أقسام حسب المحور، لكل قسم زر مراجعته.
// ============================================================================

import { useMemo, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, ChevronDown, Eye, PartyPopper, RotateCcw } from "lucide-react";
import { useUi } from "@/lib/ui-store";
import { COURSE_COLOR, COURSE_SHORT } from "@/lib/qbank";
import { useMistakes, buildReviewQids, REVIEW_SESSION_SIZE, type MistakeCourseGroup, type MistakeItem } from "@/lib/mistakes-client";
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
      {/* سطر واحد: الفصل (المحور في عنوان القسم)، وعدد مرات الخطأ */}
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COURSE_COLOR[item.courseId] ?? "var(--primary)" }} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-bold text-[var(--t500)]">{item.concept?.chapter ?? COURSE_SHORT[item.courseId] ?? "عام"}</span>
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

// قسم محور واحد: عنوان بلونه وعدده وزر مراجعته، ثم أول أخطائه مع «عرض الكل»
const SECTION_PREVIEW = 4;
function CourseSection({ group, items, expanded, onToggle, onReview, onConcept }: {
  group: MistakeCourseGroup; items: MistakeItem[]; expanded: boolean; onToggle: () => void; onReview: () => void; onConcept: (id: string) => void;
}) {
  const shown = expanded ? items.slice(0, 30) : items.slice(0, SECTION_PREVIEW);
  return (
    <section className="space-y-3" aria-label={COURSE_SHORT[group.courseId] ?? group.name}>
      <div className="flex items-center gap-2 rounded-[18px] border border-[var(--t075)] bg-white px-3 py-2 dark:border-border dark:bg-card">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COURSE_COLOR[group.courseId] ?? "var(--primary)" }} aria-hidden="true" />
        <h2 className="min-w-0 flex-1 truncate text-base font-bold">{COURSE_SHORT[group.courseId] ?? group.name}</h2>
        <span className="shrink-0 rounded-full bg-danger-soft px-2 text-sm font-bold leading-6 text-destructive" aria-label={arCount(group.count, ERROR_OBJ_FORMS)}>{ad(group.count)}</span>
        <button type="button" onClick={onReview} className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-full bg-[var(--t100)] px-3 text-sm font-bold text-[var(--t900)] transition active:scale-[0.97]">
          <RotateCcw className="h-3.5 w-3.5" /> راجع
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {shown.map((it) => (
          <MistakeCard key={it.id} item={it} onConcept={() => it.concept && onConcept(it.concept.id)} />
        ))}
      </div>
      {items.length > SECTION_PREVIEW && (
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-h-[40px] w-full items-center justify-center gap-1 text-sm font-bold text-[#B8860B]">
          {expanded ? "عرض أقل" : `عرض الكل (${ad(items.length)})`}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </section>
  );
}

export default function MistakesView({ onGoTab }: { onGoTab: (t: Tab) => void }) {
  const ui = useUi();
  const { data, isLoading, isError, refetch } = useMistakes();
  const [course, setCourse] = useState<string | null>(null);
  const [readerId, setReaderId] = useState<string | null>(null);

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // أخطاء كل محور مرتبة: المستحق أولًا ثم الأكثر تكرارًا
  const byCourse = useMemo(() => {
    const m = new Map<string, MistakeItem[]>();
    for (const it of data?.items ?? []) m.set(it.courseId, [...(m.get(it.courseId) ?? []), it]);
    for (const list of m.values()) list.sort((a, b) => Number(b.due) - Number(a.due) || b.mistakeCount - a.mistakeCount);
    return m;
  }, [data]);
  const groups = (data?.byCourse ?? []).filter((g) => !course || g.courseId === course);
  const toggleSection = (id: string) => setOpenSections((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

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

      {groups.map((g) => (
        <CourseSection
          key={g.courseId}
          group={g}
          items={byCourse.get(g.courseId) ?? []}
          expanded={!!course || openSections.has(g.courseId)}
          onToggle={() => toggleSection(g.courseId)}
          onReview={() => review(g.courseId)}
          onConcept={setReaderId}
        />
      ))}

      {reader}
    </div>
  );
}
