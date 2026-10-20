"use client";

// ============================================================================
// دفتري: خريطة ذهنية لكل فصل، وقواعده في جمل قصيرة، وملاحظاتي على المفاهيم
// ============================================================================

import { useMemo, useState } from "react";
import { ChevronDown, StickyNote } from "lucide-react";
import { useApp } from "@/lib/store";
import { COURSES, COURSE_COLOR, COURSE_SHORT, conceptById, conceptsOfCourse } from "@/lib/qbank";
import { ad, arCount, CONCEPT_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Concept } from "@/lib/types";
import { ConceptReader } from "./ConceptsView";
import { EmptyState, PageTitle } from "./ui-kit";

type Part = "maps" | "rules" | "notes";
const PARTS: { id: Part; label: string }[] = [
  { id: "maps", label: "خرائط ذهنية" },
  { id: "rules", label: "القواعد" },
  { id: "notes", label: "ملاحظاتي" },
];

const BRANCH_COLORS = ["#E8467C", "#1CB0F6", "#58CC02", "#FF9600", "#A560E8", "#14B8A6", "#F43F5E", "#6366F1"];
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

/** شجرة الفصل: الفكرة في الأعلى، وساق في الوسط، وفرعان في كل صف */
function MindMap({ center, concepts, color, onOpen }: { center: string; concepts: Concept[]; color: string; onOpen: (id: string) => void }) {
  const rows: Concept[][] = [];
  for (let i = 0; i < concepts.length; i += 2) rows.push(concepts.slice(i, i + 2));
  return (
    <div className="rounded-2xl p-3" style={{ background: `color-mix(in srgb, ${color} 6%, transparent)` }}>
      <p className="mx-auto w-fit max-w-full rounded-full px-5 py-2.5 text-center font-display text-base font-bold text-white" style={{ background: color }}>
        {center}
      </p>
      <div className="relative mt-3">
        <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full" style={{ background: `color-mix(in srgb, ${color} 30%, transparent)` }} aria-hidden="true" />
        <div className="relative space-y-3">
          {rows.map((row, r) => (
            <div key={r} className="grid grid-cols-[1fr_28px_1fr] items-center">
              {[0, 1].map((side) => {
                const c = row[side];
                const k = r * 2 + side;
                const bc = BRANCH_COLORS[k % BRANCH_COLORS.length];
                const cell = c ? (
                  <button
                    key={side}
                    type="button"
                    onClick={() => onOpen(c.id)}
                    className="min-h-[48px] rounded-2xl border-2 border-b-4 px-3 py-2 text-sm font-bold leading-6 text-foreground transition active:translate-y-[2px] active:border-b-2"
                    style={{ borderColor: bc, background: `color-mix(in srgb, ${bc} 12%, var(--card))` }}
                  >
                    {c.title}
                  </button>
                ) : (
                  <span key={side} />
                );
                return side === 0 ? [cell, <span key="mid" className="mx-auto h-3 w-3 rounded-full" style={{ background: bc }} aria-hidden="true" />] : cell;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Rules({ concepts, color, onOpen }: { concepts: Concept[]; color: string; onOpen: (id: string) => void }) {
  return (
    <ol className="space-y-3">
      {concepts.map((c, i) => (
        <li key={c.id}>
          <button type="button" onClick={() => onOpen(c.id)} className="flex w-full gap-3 rounded-2xl border-2 border-border bg-card p-4 text-right hover:bg-muted/50">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: color }}>
              {ad(i + 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold leading-7">{c.title}</span>
              <span className="mt-1 block text-base leading-8 text-secondary-foreground">{c.example}</span>
            </span>
          </button>
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
  const [readerId, setReaderId] = useState<string | null>(null);

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
                <button type="button" onClick={() => setReaderId(n.concept!.id)} className="w-full rounded-2xl border-2 border-[#FFC800] bg-[#FFF8D6] p-4 text-right dark:bg-[#FFC800]/10">
                  <span className="block text-sm font-bold text-[#946200] dark:text-[#FFD84D]">{n.concept!.title}</span>
                  <span className="mt-1 block whitespace-pre-line text-base leading-8">{n.text}</span>
                </button>
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
                      <MindMap center={chapterLabel(chapter)} concepts={concepts} color={color} onOpen={setReaderId} />
                    ) : (
                      <Rules concepts={concepts} color={color} onOpen={setReaderId} />
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {readerId && <ConceptReader conceptId={readerId} onClose={() => setReaderId(null)} />}
    </div>
  );
}
