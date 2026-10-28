"use client";

// ============================================================================
// البوصلة: خريطة ذهنية لكل فصل، وقواعده في جمل قصيرة، وأمثلة واقعية من الصف
// ============================================================================

import { useMemo, useState } from "react";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { CHAPTER_MAPS, COURSES, COURSE_SHORT, conceptsOfCourse, type ChapterMap } from "@/lib/qbank";
import { cn } from "@/lib/utils";
import type { Concept } from "@/lib/types";
import { PageTitle } from "./ui-kit";
import { FitText } from "./FitText";

type Part = "maps" | "rules" | "examples";
const PARTS: { id: Part; label: string }[] = [
  { id: "maps", label: "الخرائط" },
  { id: "rules", label: "القواعد" },
  { id: "examples", label: "مواقف" },
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
              <p className="text-base font-bold leading-8 text-foreground">{st}</p>
              {k < ch.links.length && (
                <span className="my-0.5 inline-flex items-center gap-0.5 rounded-full bg-[#FBF1D6] px-1.5 text-[11px] font-bold leading-[18px] text-[#9A6A12]">
                  <ArrowDown className="h-2.5 w-2.5" strokeWidth={3} />
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

// المثال يُعرض فقط حين يكون موقفًا صفيًّا حقيقيًّا: فيه معلم، وطلاب أو صف أو حصة — والمفاهيم النظرية بلا مثال
const TEACHER = /(معلم|معلمة|مدرس|مدرسة)/;
const CLASSROOM = /(الصف|صفه|صفها|الحصة|حصة|الدرس|درس|طلاب|طالبات|تلاميذ|طالب|طالبة|تلميذ)/;
const THEORY = /^(تعريف|مفهوم|نشأة|تاريخ|أنواع|مراحل|خصائص|أهمية|أهداف|مصادر|أسس|معنى|مجالات|نظرية|نظريات|العلاقة|الفرق|طبيعة)/;
const classroomExample = (c: Concept) => (THEORY.test(c.title) ? undefined : (c.examples ?? []).find((e) => TEACHER.test(e) && CLASSROOM.test(e)));

/** مواقف صفية واقعية من الفصل: المفهوم في شارة ذهبية، والموقف تحته */
function Examples({ concepts }: { concepts: Concept[] }) {
  const items = concepts.map((c) => ({ c, ex: classroomExample(c) })).filter((x) => x.ex);
  if (items.length === 0) return <p className="p-3 text-center text-sm text-muted-foreground">لا مواقف صفية في هذا الفصل</p>;
  return (
    <ul className="space-y-3">
      {items.map(({ c, ex }) => (
        <li key={c.id} className="rounded-[22px] border border-[var(--t075)] bg-white p-4 dark:border-border dark:bg-card">
          <p className="inline-flex rounded-full bg-[#FBF1D6] px-3 text-sm font-bold leading-7 text-[#9A6A12]">{c.title}</p>
          <p className="mt-2 leading-8">{ex}</p>
        </li>
      ))}
    </ul>
  );
}

function Rules({ concepts }: { concepts: Concept[] }) {
  return (
    <ul className="divide-y divide-[var(--t075)] overflow-hidden rounded-[22px] border border-[var(--t075)] bg-white dark:divide-border dark:border-border dark:bg-card">
      {concepts.map((c) => (
        <li key={c.id} className="border-r-[3px] border-r-[#E3B23C] px-4 py-3">
          <p className="font-extrabold leading-7 text-foreground">{c.title}</p>
          <p className="mt-0.5 leading-8 text-foreground">{c.rule}</p>
        </li>
      ))}
    </ul>
  );
}

export default function NotebookView() {
  const lastStudy = useApp((s) => s.lastStudy);
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

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageTitle title="البوصلة" />

      {/* مدخل الخرائط الذهنية المتحركة: بطاقة داكنة مميزة فيها شبكة أفكار تنبض بهدوء */}
      <button
        type="button"
        onClick={() => useUi.getState().startMind()}
        className="mind-card relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] bg-gradient-to-l from-[#0F4634] via-[#103B3A] to-[#0B2236] p-3.5 text-right text-white ring-2 ring-[#F4C430] transition active:scale-[0.98]"
      >
        <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-hidden="true">
          <g stroke="#F4C430" strokeWidth="2" strokeLinecap="round" opacity="0.85">
            <path className="mc-line" d="M32 32 L12 14" /><path className="mc-line" d="M32 32 L54 16" style={{ animationDelay: ".3s" }} />
            <path className="mc-line" d="M32 32 L10 46" style={{ animationDelay: ".6s" }} /><path className="mc-line" d="M32 32 L52 50" style={{ animationDelay: ".9s" }} />
          </g>
          <circle cx="12" cy="14" r="5.5" fill="#FF8A4C" /><circle cx="54" cy="16" r="5.5" fill="#5AA9F0" />
          <circle cx="10" cy="46" r="5.5" fill="#5CC46F" /><circle cx="52" cy="50" r="5.5" fill="#A08BFF" />
          <circle className="mc-core" cx="32" cy="32" r="9" fill="url(#mc-gold)" />
          <defs>
            <linearGradient id="mc-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE58A" /><stop offset="1" stopColor="#C99A06" /></linearGradient>
          </defs>
        </svg>
        <span className="min-w-0 flex-1">
          <FitText max={18} min={12} className="font-extrabold leading-7 text-white">الخرائط الذهنية المتحركة</FitText>
          <FitText max={13} min={10} className="leading-6 text-[#F8E3A8]">خمس خرائط · مشاهد قصيرة · تدريب مباشر</FitText>
        </span>
        <ChevronLeft className="h-5 w-5 shrink-0 text-[#F4C430]" strokeWidth={2.5} aria-hidden="true" />
      </button>


      {current ? (
        <div className="space-y-4">
          {/* المحور والفصل في محدِّد واحد، وسهمان صغيران للتنقل بين الفصول */}
          <div className="flex items-center gap-1 rounded-[20px] border border-[var(--t075)] bg-white p-1.5 dark:border-border dark:bg-card">
            <button type="button" aria-label="الفصل السابق" disabled={chIndex <= 0} onClick={() => setChIndex(chIndex - 1)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-[#C99A06] disabled:opacity-25">
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button type="button" onClick={() => setPicking(true)} className="min-w-0 flex-1 rounded-[14px] px-1 py-1 text-center transition active:scale-[0.98]">
              <FitText max={14} min={11} className="text-center font-bold leading-6 text-[#B8860B]">{`${COURSE_SHORT[courseId] ?? ""} ▾`}</FitText>
              <FitText max={20} min={12} className="text-center font-extrabold leading-7 text-foreground">{chapterLabel(current.chapter)}</FitText>
            </button>
            <button type="button" aria-label="الفصل التالي" disabled={chIndex >= chapters.length - 1} onClick={() => setChIndex(chIndex + 1)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-full text-[#C99A06] disabled:opacity-25">
              <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* أقسام الدفتر تحت محدد الفصل */}
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

          {part === "maps" ? (
            CHAPTER_MAPS[`${courseId}::${current.chapter}`] ? (
              <CausalMap map={CHAPTER_MAPS[`${courseId}::${current.chapter}`]} />
            ) : (
              <p className="p-3 text-center text-sm text-muted-foreground">خريطة هذا الفصل قيد الإعداد</p>
            )
          ) : part === "rules" ? (
            <Rules concepts={current.concepts} />
          ) : (
            <Examples concepts={current.concepts} />
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
                        className={cn("min-h-[48px] w-full rounded-[16px] px-4 text-right text-base font-bold", i === chIndex ? "bg-[var(--t100)] text-foreground" : "text-foreground hover:bg-muted")}
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
