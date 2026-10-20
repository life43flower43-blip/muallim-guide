"use client";

// ============================================================================
// دفتري: خريطة ذهنية لكل فصل، وقواعده في جمل قصيرة، وملاحظاتي على المفاهيم
// ============================================================================

import { useMemo, useState } from "react";
import { ChevronDown, Network, Plus, StickyNote, Trash2 } from "lucide-react";
import { useApp, type MindMapBranch, type MindMapNote } from "@/lib/store";
import { COURSES, COURSE_COLOR, COURSE_SHORT, conceptById, conceptsOfCourse, questionById } from "@/lib/qbank";
import { ad, arCount, CONCEPT_FORMS } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import type { Concept } from "@/lib/types";
import { EmptyState, PageTitle, PrimaryButton, SecondaryButton } from "./ui-kit";

type Part = "maps" | "rules" | "notes";
const PARTS: { id: Part; label: string }[] = [
  { id: "maps", label: "خرائط ذهنية" },
  { id: "rules", label: "القواعد" },
  { id: "notes", label: "ملاحظاتي" },
];

const BRANCH_COLORS = ["#E8467C", "#1CB0F6", "#58CC02", "#FF9600", "#A560E8", "#14B8A6", "#F43F5E", "#6366F1"];
const MAX_BRANCHES = 8;
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

/** خريطة الطالب: الفكرة في الأعلى، وساق في الوسط، وفرعان في كل صف، وتحت كل فرع تفاصيله */
function MapView({ map }: { map: Pick<MindMapNote, "center" | "branches"> }) {
  const branches = map.branches.filter((b) => b.text.trim());
  const rows: { b: MindMapBranch; k: number }[][] = [];
  branches.forEach((b, k) => (k % 2 === 0 ? rows.push([{ b, k }]) : rows[rows.length - 1].push({ b, k })));
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <p className="mx-auto w-fit max-w-full rounded-full bg-primary px-5 py-2.5 text-center font-display text-lg font-bold text-primary-foreground">
        {map.center.trim() || "الفكرة المركزية"}
      </p>
      {rows.length > 0 && (
        <div className="relative mt-3">
          <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-primary/25" aria-hidden="true" />
          <div className="relative space-y-3">
            {rows.map((row, r) => (
              <div key={r} className="grid grid-cols-[1fr_28px_1fr] items-start">
                {[0, 1].map((side) => {
                  const cell = row[side];
                  const bc = cell ? BRANCH_COLORS[cell.k % BRANCH_COLORS.length] : "";
                  const box = cell ? (
                    <div
                      key={side}
                      className="rounded-2xl border-2 border-b-4 px-3 py-2"
                      style={{ borderColor: bc, background: `color-mix(in srgb, ${bc} 12%, var(--card))` }}
                    >
                      <p className="text-base font-bold leading-7">{cell.b.text}</p>
                      {cell.b.items.filter((x) => x.trim()).length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {cell.b.items
                            .filter((x) => x.trim())
                            .map((x, i) => (
                              <li key={i} className="flex gap-1.5 text-sm leading-6 text-secondary-foreground">
                                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: bc }} />
                                {x}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <span key={side} />
                  );
                  return side === 0
                    ? [box, <span key="mid" className="mx-auto mt-4 h-3 w-3 rounded-full" style={{ background: BRANCH_COLORS[(r * 2) % BRANCH_COLORS.length] }} aria-hidden="true" />]
                    : box;
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const INPUT = "w-full rounded-xl border-2 border-border bg-card px-3 py-2.5 text-base outline-none focus:border-primary";

function MapEditor({ initial, suggestions, onClose }: { initial: MindMapNote | null; suggestions: { chapters: string[]; concepts: Concept[] }; onClose: () => void }) {
  const saveMindMap = useApp((s) => s.saveMindMap);
  const removeMindMap = useApp((s) => s.removeMindMap);
  const [center, setCenter] = useState(initial?.center ?? "");
  const [branches, setBranches] = useState<MindMapBranch[]>(initial?.branches.length ? initial.branches : [{ text: "", items: [""] }]);
  const setBranch = (i: number, b: MindMapBranch) => setBranches((all) => all.map((x, j) => (j === i ? b : x)));
  const addBranch = (text = "") => setBranches((all) => (all.length >= MAX_BRANCHES ? all : [...all.filter((x) => x.text.trim() || x.items.some((y) => y.trim())), { text, items: [""] }]));
  const save = () => {
    const clean = branches.map((b) => ({ text: b.text.trim(), items: b.items.map((x) => x.trim()).filter(Boolean) })).filter((b) => b.text);
    if (!center.trim() || clean.length === 0) return;
    saveMindMap({ id: initial?.id ?? `M${Date.now()}`, center: center.trim(), branches: clean, ts: Date.now() });
    onClose();
  };
  // اقتراحات الفروع: مفاهيم الفصل المختار في المركز، وإلا آخر ما درسه
  const branchIdeas = (suggestions.concepts.some((c) => chapterLabel(c.chapter) === center.trim())
    ? suggestions.concepts.filter((c) => chapterLabel(c.chapter) === center.trim())
    : suggestions.concepts
  )
    .map((c) => c.title)
    .filter((t) => !branches.some((b) => b.text === t))
    .slice(0, 8);

  return (
    <div className="space-y-4 rounded-2xl border-2 border-border bg-card p-4">
      <label className="block">
        <span className="mb-1.5 block text-base font-bold">الفكرة المركزية</span>
        <input value={center} onChange={(e) => setCenter(e.target.value)} placeholder="مثلًا: نظريات التعلم" className={INPUT} />
      </label>
      {!center.trim() && suggestions.chapters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.chapters.map((ch) => (
            <button key={ch} type="button" onClick={() => setCenter(ch)} className="min-h-[36px] rounded-full border-2 border-border px-3 text-sm font-medium hover:bg-muted">
              {ch}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {branches.map((b, i) => {
          const bc = BRANCH_COLORS[i % BRANCH_COLORS.length];
          return (
            <div key={i} className="space-y-2 rounded-2xl border-2 p-3" style={{ borderColor: bc }}>
              <div className="flex items-center gap-2">
                <input value={b.text} onChange={(e) => setBranch(i, { ...b, text: e.target.value })} placeholder={`الفرع ${ad(i + 1)}`} className={cn(INPUT, "font-bold")} />
                <button type="button" onClick={() => setBranches((all) => all.filter((_, j) => j !== i))} aria-label="احذف الفرع" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              {b.items.map((it, k) => (
                <input
                  key={k}
                  value={it}
                  onChange={(e) => setBranch(i, { ...b, items: b.items.map((x, j) => (j === k ? e.target.value : x)) })}
                  placeholder="تفصيل أو مثال"
                  className={cn(INPUT, "py-2 text-sm")}
                />
              ))}
              {b.items.length < 5 && (
                <button type="button" onClick={() => setBranch(i, { ...b, items: [...b.items, ""] })} className="flex min-h-[36px] items-center gap-1 text-sm font-bold" style={{ color: bc }}>
                  <Plus className="h-4 w-4" /> تفصيل
                </button>
              )}
            </div>
          );
        })}
      </div>

      {branches.length < MAX_BRANCHES && (
        <div className="space-y-2">
          <SecondaryButton onClick={() => addBranch()} className="w-full">
            <Plus className="h-4 w-4" /> فرع جديد
          </SecondaryButton>
          {branchIdeas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="w-full text-sm text-muted-foreground">من دروسك:</span>
              {branchIdeas.map((t) => (
                <button key={t} type="button" onClick={() => addBranch(t)} className="min-h-[36px] rounded-full border-2 border-border px-3 text-sm font-medium hover:bg-muted">
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <MapView map={{ center, branches }} />

      <div className="flex gap-3">
        <PrimaryButton onClick={save} disabled={!center.trim() || !branches.some((b) => b.text.trim())} className="flex-[2]">
          حفظ
        </PrimaryButton>
        <SecondaryButton onClick={onClose} className="flex-1">
          إلغاء
        </SecondaryButton>
      </div>
      {initial && (
        <button
          type="button"
          onClick={() => {
            removeMindMap(initial.id);
            onClose();
          }}
          className="mx-auto flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-destructive"
        >
          <Trash2 className="h-4 w-4" /> احذف الخريطة
        </button>
      )}
    </div>
  );
}

function MapsPart() {
  const mindMaps = useApp((s) => s.mindMaps);
  const conceptReads = useApp((s) => s.conceptReads);
  const attempts = useApp((s) => s.attempts);
  const [editing, setEditing] = useState<MindMapNote | "new" | null>(null);

  // ما درسه الطالب: المفاهيم التي قرأها أو أجاب عن أسئلتها، الأحدث أولًا
  const suggestions = useMemo(() => {
    const ts = new Map<string, number>();
    for (const [cid, t] of Object.entries(conceptReads)) ts.set(cid, Math.max(ts.get(cid) ?? 0, t));
    for (const a of Object.values(attempts)) {
      const cid = questionById(a.qid)?.conceptId;
      if (cid) ts.set(cid, Math.max(ts.get(cid) ?? 0, a.ts));
    }
    const concepts = [...ts].sort((x, y) => y[1] - x[1]).map(([id]) => conceptById(id)).filter(Boolean) as Concept[];
    const chapters = [...new Set(concepts.map((c) => chapterLabel(c.chapter)))].slice(0, 6);
    return { chapters, concepts: concepts.slice(0, 40), all: concepts };
  }, [conceptReads, attempts]);

  // خرائط ما تعلّمه: لكل فصل درس منه شيئًا، فروعها المفاهيم التي درسها وتحت كل فرع قاعدته
  const learned = useMemo(() => {
    const byChapter = new Map<string, Concept[]>();
    for (const c of suggestions.all) {
      const k = `${c.courseId}::${c.chapter}`;
      byChapter.set(k, [...(byChapter.get(k) ?? []), c]);
    }
    return [...byChapter.entries()].slice(0, 6).map(([k, cs]) => {
      const [courseId, chapter] = k.split("::");
      const total = conceptsOfCourse(courseId).filter((c) => c.chapter === chapter).length;
      return {
        key: k,
        map: { center: chapterLabel(chapter), branches: cs.slice(0, MAX_BRANCHES).map((c) => ({ text: c.title, items: c.rule ? [c.rule] : [] })) },
        left: Math.max(0, total - cs.length),
      };
    });
  }, [suggestions]);

  if (editing) return <MapEditor key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? null : editing} suggestions={suggestions} onClose={() => setEditing(null)} />;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">خريطة ما تعلّمته</h2>
        {learned.length === 0 ? (
          <EmptyState icon={Network} title="تُبنى خريطتك مع كل درس" sub="اقرأ مفهومًا أو أجب عن أسئلته، فيظهر هنا في خريطة فصله مع قاعدته." />
        ) : (
          learned.map((l) => (
            <div key={l.key}>
              <MapView map={l.map} />
              {l.left > 0 && <p className="mt-1.5 text-center text-sm text-muted-foreground">بقي في هذا الفصل {arCount(l.left, CONCEPT_FORMS)} لم تدرسها بعد</p>}
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">خرائطي</h2>
        <PrimaryButton onClick={() => setEditing("new")} className="w-full">
          <Plus className="h-5 w-5" /> خريطة جديدة
        </PrimaryButton>
        {mindMaps.map((m) => (
          <button key={m.id} type="button" onClick={() => setEditing(m)} className="block w-full text-right" aria-label={`عدّل خريطة ${m.center}`}>
            <MapView map={m} />
          </button>
        ))}
      </section>
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

      {part === "rules" && (
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

      {part === "maps" ? (
        <MapsPart />
      ) : part === "notes" ? (
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
                    <Rules concepts={concepts} color={color} />
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
