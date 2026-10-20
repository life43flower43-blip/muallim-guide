"use client";

// ============================================================================
// دفتري: خريطة ذهنية لكل فصل، وقواعده في جمل قصيرة، وملاحظاتي على المفاهيم
// ============================================================================

import { useMemo, useState } from "react";
import { ArrowDown, ChevronDown, StickyNote } from "lucide-react";
import { useApp } from "@/lib/store";
import { CHAPTER_MAPS, COURSES, COURSE_COLOR, COURSE_SHORT, conceptById, conceptsOfCourse, type ChapterMap } from "@/lib/qbank";
import { ad, arCount, CONCEPT_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Concept } from "@/lib/types";
import { EmptyState, PageTitle } from "./ui-kit";

type Part = "maps" | "rules" | "notes";
const PARTS: { id: Part; label: string }[] = [
  { id: "maps", label: "خرائط ذهنية" },
  { id: "rules", label: "القواعد" },
  { id: "notes", label: "ملاحظاتي" },
];

const BRANCH_COLORS = ["#E8467C", "#1CB0F6", "#58CC02", "#FF9600", "#A560E8", "#14B8A6", "#F43F5E", "#6366F1"];
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

/** خريطة الفصل: كل سلسلة خطوات متتابعة، وبين كل خطوتين رابطها */
function CausalMap({ map, color }: { map: ChapterMap; color: string }) {
  return (
    <div className="space-y-4">
      {map.chains.map((ch, i) => {
        const bc = BRANCH_COLORS[i % BRANCH_COLORS.length];
        return (
          <ol key={i} className="rounded-2xl p-3" style={{ background: `color-mix(in srgb, ${bc} 7%, var(--card))` }}>
            {ch.steps.map((st, k) => (
              <li key={k}>
                <p
                  className="rounded-xl border-2 border-b-4 bg-card px-3 py-2.5 text-center text-base font-bold leading-7"
                  style={{ borderColor: k === 0 ? color : bc }}
                >
                  {st}
                </p>
                {k < ch.links.length && (
                  <p className="flex flex-col items-center py-1 text-sm font-bold" style={{ color: bc }}>
                    <span>{ch.links[k]}</span>
                    <ArrowDown className="h-4 w-4" strokeWidth={3} />
                  </p>
                )}
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

function Rules({ concepts, color }: { concepts: Concept[]; color: string }) {
  return (
    <ol className="space-y-3">
      {concepts.map((c, i) => (
        <li key={c.id}>
          <div className="flex w-full gap-3 rounded-2xl border-2 border-border bg-card p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: color }}>
              {ad(i + 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold leading-7">{c.title}</span>
              <span className="mt-1 block text-base leading-8 text-secondary-foreground">{c.rule}</span>
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function NotebookView() {
  const lastStudy = useApp((s) => s.lastStudy);
  const notes = useApp((s) => s.notes);
  const [courseId, setCourseId] = useState(lastStudy?.courseId ?? COURSES[0]?.id ?? "M1");
  const [part, setPart] = useState<Part>("maps");
  const [openCh, setOpenCh] = useState<string | null>(null);

  const chapters = useMemo(() => {
    const out: { chapter: string; concepts: Concept[] }[] = [];
    for (const c of conceptsOfCourse(courseId)) {
      const last = out[out.length - 1];
      if (last && last.chapter === c.chapter) last.concepts.push(c);
      else out.push({ chapter: c.chapter, concepts: [c] });
    }
    return out;
  }, [courseId]);
  const color = COURSE_COLOR[courseId] ?? "var(--primary)";

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

      <div role="tablist" aria-label="أقسام الدفتر" className="grid grid-cols-3 gap-2">
        {PARTS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={part === p.id}
            onClick={() => setPart(p.id)}
            className={cn(
              "min-h-[48px] rounded-2xl border-2 border-b-4 text-base font-bold transition active:translate-y-[2px] active:border-b-2",
              part === p.id ? "border-[#1CB0F6] bg-[#DDF4FF] text-[#1478A8] dark:bg-[#1CB0F6]/15 dark:text-[#7DD3FC]" : "border-border bg-card text-secondary-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {part !== "notes" && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {COURSES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCourseId(c.id);
                setOpenCh(null);
              }}
              className={cn("min-h-[40px] shrink-0 rounded-full border-2 px-4 text-sm font-bold transition-colors", courseId === c.id ? "text-white" : "border-border bg-card text-secondary-foreground")}
              style={courseId === c.id ? { background: COURSE_COLOR[c.id], borderColor: COURSE_COLOR[c.id] } : undefined}
            >
              {COURSE_SHORT[c.id] ?? c.name}
            </button>
          ))}
        </div>
      )}

      {part === "notes" ? (
        myNotes.length === 0 ? (
          <EmptyState icon={StickyNote} title="لا ملاحظات بعد" sub="اكتب ملاحظتك أسفل أي مفهوم في «التعلّم»، وستجدها هنا." />
        ) : (
          <ul className="space-y-3">
            {myNotes.map((n) => (
              <li key={n.id}>
                <div className="w-full rounded-2xl border-2 border-[#FFC800] bg-[#FFF8D6] p-4 dark:bg-[#FFC800]/10">
                  <span className="block text-sm font-bold text-[#946200] dark:text-[#FFD84D]">{n.concept!.title}</span>
                  <span className="mt-1 block whitespace-pre-line text-base leading-8">{n.text}</span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-3">
          {chapters.map(({ chapter, concepts }) => {
            const open = openCh === chapter;
            return (
              <section key={chapter} className="overflow-hidden rounded-2xl border-2 border-border bg-card">
                <button type="button" onClick={() => setOpenCh(open ? null : chapter)} aria-expanded={open} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-right">
                  <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold leading-7">{chapterLabel(chapter)}</span>
                    <span className="block text-sm text-muted-foreground">{arCount(concepts.length, CONCEPT_FORMS)}</span>
                  </span>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="border-t-2 border-border p-3">
                    {part === "maps" ? (
                      CHAPTER_MAPS[`${courseId}::${chapter}`] ? (
                        <CausalMap map={CHAPTER_MAPS[`${courseId}::${chapter}`]} color={color} />
                      ) : (
                        <p className="p-3 text-center text-sm text-muted-foreground">خريطة هذا الفصل قيد الإعداد</p>
                      )
                    ) : (
                      <Rules concepts={concepts} color={color} />
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

    </div>
  );
}
