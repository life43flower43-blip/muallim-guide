"use client";

// ============================================================================
// دفتري: خريطة ذهنية لكل فصل، وقواعده في جمل قصيرة، وملاحظاتي على المفاهيم
// ============================================================================

import { useMemo, useState } from "react";
import { ArrowDown, ChevronDown, ChevronLeft, ChevronRight, StickyNote } from "lucide-react";
import { useApp } from "@/lib/store";
import { CHAPTER_MAPS, COURSES, COURSE_SHORT, conceptById, conceptsOfCourse, type ChapterMap } from "@/lib/qbank";
import { cn } from "@/lib/utils";
import type { Concept } from "@/lib/types";
import { EmptyState, PageTitle } from "./ui-kit";
import { FitText } from "./FitText";

type Part = "maps" | "rules" | "notes";
const PARTS: { id: Part; label: string }[] = [
  { id: "maps", label: "الخرائط" },
  { id: "rules", label: "القواعد" },
  { id: "notes", label: "ملاحظاتي" },
];

const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

/** خريطة الفصل: كل سلسلة خط عمودي تتتابع عليه الخطوات، والرابط بينها شارة ذهبية صغيرة على الخط */
function CausalMap({ map }: { map: ChapterMap }) {
  return (
    <div className="space-y-3">
      {map.chains.map((ch, i) => (
        <ol key={i} className="rounded-[22px] border border-[var(--t075)] bg-white px-4 py-3 dark:border-border dark:bg-card">
          {ch.steps.map((st, k) => (
            <li key={k} className="relative pr-6">
              {/* الخط العمودي والنقطة */}
              {k < ch.steps.length - 1 && <span className="absolute bottom-0 right-[7px] top-4 w-[2px] bg-[var(--t150)]" aria-hidden="true" />}
              <span
                className={cn("absolute right-0 top-[9px] h-4 w-4 rounded-full border-[3px] border-white dark:border-card", k === 0 ? "bg-[var(--t800)]" : k === ch.steps.length - 1 ? "bg-[#E3B23C]" : "bg-[var(--t300)]")}
                aria-hidden="true"
              />
              <p className={cn("text-base leading-8", k === 0 || k === ch.steps.length - 1 ? "font-extrabold text-[var(--t900)] dark:text-foreground" : "font-bold")}>{st}</p>
              {k < ch.links.length && (
                <span className="my-1 inline-flex items-center gap-1 rounded-full bg-[#FBF1D6] px-2.5 text-xs font-bold leading-6 text-[#9A6A12]">
                  <ArrowDown className="h-3 w-3" strokeWidth={3} />
                  {ch.links[k]}
                </span>
              )}
            </li>
          ))}
        </ol>
      ))}
    </div>
  );
}

function Rules({ concepts }: { concepts: Concept[] }) {
  return (
    <ul className="divide-y divide-[var(--t075)] overflow-hidden rounded-[22px] border border-[var(--t075)] bg-white dark:divide-border dark:border-border dark:bg-card">
      {concepts.map((c) => (
        <li key={c.id} className="border-r-[3px] border-r-[#E3B23C] px-4 py-3">
          <p className="font-extrabold leading-7 text-[var(--t900)] dark:text-foreground">{c.title}</p>
          <p className="mt-0.5 leading-8 text-secondary-foreground">{c.rule}</p>
        </li>
      ))}
    </ul>
  );
}

export default function NotebookView() {
  const lastStudy = useApp((s) => s.lastStudy);
  const notes = useApp((s) => s.notes);
  const [courseId, setCourseId] = useState(lastStudy?.courseId ?? COURSES[0]?.id ?? "M1");
  const [part, setPart] = useState<Part>("maps");
  const [chIndex, setChIndex] = useState(0);
  const [picking, setPicking] = useState(false);

  const chapters = useMemo(() => {
    const out: { chapter: string; concepts: Concept[] }[] = [];
    for (const c of conceptsOfCourse(courseId)) {
      const last = out[out.length - 1];
      if (last && last.chapter === c.chapter) last.concepts.push(c);
      else out.push({ chapter: c.chapter, concepts: [c] });
    }
    return out;
  }, [courseId]);
  const current = chapters[Math.min(chIndex, chapters.length - 1)];

  const myNotes = useMemo(
    () =>
      Object.entries(notes)
        .flatMap(([cid, list]) => list.map((n) => ({ ...n, concept: conceptById(cid) })))
        .filter((n) => n.concept)
        .sort((a, b) => b.ts - a.ts),
    [notes]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageTitle title="دفتري" />

      <div role="tablist" aria-label="أقسام الدفتر" className="grid grid-cols-3 gap-1 rounded-[22px] border border-[#E3D3A0] bg-white p-1 dark:bg-card">
        {PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={part === p.id}
            onClick={() => setPart(p.id)}
            className={cn(
              "min-h-[44px] min-w-0 rounded-[18px] px-1 font-bold transition active:scale-[0.98]",
              part === p.id ? "bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] text-white" : "text-[var(--t500)]"
            )}
          >
            <FitText max={16} min={10} group="nb-tabs" className="text-center">{p.label}</FitText>
          </button>
        ))}
      </div>


      {part === "notes" ? (
        myNotes.length === 0 ? (
          <EmptyState icon={StickyNote} title="لا ملاحظات بعد" sub="اكتب ملاحظتك أسفل أي مفهوم في «المفاهيم التربوية»، وستجدها هنا." />
        ) : (
          <ul className="space-y-3">
            {myNotes.map((n) => (
              <li key={n.id}>
                <div className="w-full rounded-[22px] border border-[#E3D3A0] border-r-[3px] border-r-[#E3B23C] bg-white p-4 dark:bg-card">
                  <span className="block text-sm font-bold text-[#B8860B] dark:text-[#F5C451]">{n.concept!.title}</span>
                  <span className="mt-1 block whitespace-pre-line text-base leading-8">{n.text}</span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : current ? (
        <div className="space-y-4">
          {/* المحور والفصل في محدِّد واحد، وسهمان صغيران للتنقل بين الفصول */}
          <div className="flex items-center gap-1 rounded-[20px] border border-[var(--t075)] bg-white p-1.5 dark:border-border dark:bg-card">
            <button type="button" aria-label="الفصل السابق" disabled={chIndex <= 0} onClick={() => setChIndex(chIndex - 1)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-[#C99A06] disabled:opacity-25">
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setPicking(true)} className="min-w-0 flex-1 rounded-[14px] px-1 py-1 text-center transition active:scale-[0.98]">
              <FitText max={14} min={11} className="text-center font-bold leading-6 text-[#B8860B]">{`${COURSE_SHORT[courseId] ?? ""} ▾`}</FitText>
              <FitText max={20} min={12} className="text-center font-extrabold leading-7 text-[var(--t900)] dark:text-foreground">{chapterLabel(current.chapter)}</FitText>
            </button>
            <button type="button" aria-label="الفصل التالي" disabled={chIndex >= chapters.length - 1} onClick={() => setChIndex(chIndex + 1)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-[#C99A06] disabled:opacity-25">
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          {part === "maps" ? (
            CHAPTER_MAPS[`${courseId}::${current.chapter}`] ? (
              <CausalMap map={CHAPTER_MAPS[`${courseId}::${current.chapter}`]} />
            ) : (
              <p className="p-3 text-center text-sm text-muted-foreground">خريطة هذا الفصل قيد الإعداد</p>
            )
          ) : (
            <Rules concepts={current.concepts} />
          )}


          {picking && (
            <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setPicking(false)}>
              <div className="safe-bottom max-h-[75dvh] w-full overflow-y-auto rounded-t-3xl bg-card p-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="اختر المحور والفصل">
                <span className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-border" aria-hidden="true" />
                <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
                  {COURSES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCourseId(c.id);
                        setChIndex(0);
                      }}
                      className={cn("min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm font-bold", courseId === c.id ? "border-transparent bg-gradient-to-l from-[var(--t600)] to-[var(--t850)] text-white" : "border-[#E3D3A0] bg-white text-[var(--t500)] dark:bg-card")}
                    >
                      {COURSE_SHORT[c.id] ?? c.name}
                    </button>
                  ))}
                </div>
                <ul className="space-y-1.5">
                  {chapters.map(({ chapter }, i) => (
                    <li key={chapter}>
                      <button
                        type="button"
                        onClick={() => {
                          setChIndex(i);
                          setPicking(false);
                        }}
                        className={cn("min-h-[48px] w-full rounded-[16px] px-4 text-right text-base font-bold", i === chIndex ? "bg-[var(--t100)] text-[var(--t900)]" : "hover:bg-muted")}
                      >
                        {chapterLabel(chapter)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
