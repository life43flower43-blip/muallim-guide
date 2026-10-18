"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Dumbbell,
  Lightbulb,
  X,
  Search,
  Dna,
  Brain,
  Heart,
  ClipboardList,
  School,
  Library,
  Bot,
  Plus,
  Trash2,
  ChevronLeft,
  Share2,
  StickyNote,
} from "lucide-react";
import {
  COURSES,
  CONCEPTS,
  conceptsOfCourse,
  chaptersOfCourse,
  questionsOfConcept,
  examplesOf,
  COURSE_COLOR,
  COURSE_SHORT,
  shuffle,
} from "@/lib/qbank";
import type { Concept, Course } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { shareText } from "@/lib/share";
import { ad, arCount, CONCEPT_FORMS, CHAPTER_FORMS, EXAMPLE_FORMS, QUESTION_FORMS, splitArParagraphs, exampleContext } from "@/lib/arabic";
import { toast } from "@/hooks/use-toast";
import SpeakButton from "./SpeakButton";
import { Card, Chip, Divided, EmptyState, PageTitle, PrimaryButton, ProgressBar, ScreenShell, SecondaryButton, SectionHeader, pct } from "./ui-kit";

// أيقونة كل مقرر
const COURSE_ICONS: Record<string, React.ElementType> = {
  M1: Dna,
  M2: Heart,
  M3: Brain,
  M4: ClipboardList,
  M5: School,
  G1: Library,
  AI1: Bot,
};
function CourseIcon({ id, className }: { id: string; className?: string }) {
  const Icon = COURSE_ICONS[id] ?? BookOpen;
  return <Icon className={className} />;
}

// أسماء الفصول تُعرض بلا حروف الترقيم الكتابية (أ. ب. ج.)
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

// وصف موجز لكل مقرر
const COURSE_SUBTITLE: Record<string, string> = {
  M1: "النمو بمراحله ومجالاته وتطبيقاته في الصف",
  M2: "الدوافع والانفعالات والذكاء والفروق الفردية",
  M3: "التعلم ونظرياته والذاكرة والدافعية",
  M4: "القياس وأدوات التقويم والاختبارات",
  M5: "طرق تدريس المواد الدراسية",
  G1: "مفاهيم عامة في التربية والتعليم",
  AI1: "تطوره ودوره في العملية التعليمية وأخلاقياته",
};

const SPECIALTIES = ["تربية", "إنسانيات", "علوم", "هندسة", "طب", "أخرى"];

const textareaCls =
  "w-full resize-none rounded-xl border border-input bg-card p-3 text-[15px] leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

// ---------- أمثلة من تخصصي: يكتبها المتعلم وتُحفظ على جهازه ----------
function StudentExamplesSection({ conceptId }: { conceptId: string }) {
  const studentExamples = useApp((s) => s.studentExamples);
  const addStudentExample = useApp((s) => s.addStudentExample);
  const removeStudentExample = useApp((s) => s.removeStudentExample);
  const [draft, setDraft] = useState("");
  const [specialty, setSpecialty] = useState<string>("تربية");
  const mine = studentExamples[conceptId] ?? [];
  const canAdd = draft.trim().length >= 10;

  return (
    <section>
      <SectionHeader title="أمثلة من تخصصي" sub="اكتب مثالًا من مجال تخصصك يوضح المفهوم، ويُحفظ على جهازك" />
      <Card className="space-y-3 p-4">
        {mine.map((e) => (
          <div key={e.id} className="flex items-start gap-3 rounded-lg bg-muted p-3">
            <div className="min-w-0 flex-1">
              <Chip tone="primary">{e.specialty}</Chip>
              <p className="mt-2 text-sm leading-7 text-secondary-foreground">{e.text}</p>
            </div>
            <button
              type="button"
              onClick={() => removeStudentExample(conceptId, e.id)}
              aria-label="حذف المثال"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={specialty === s}
              onClick={() => setSpecialty(s)}
              className={`min-h-[36px] shrink-0 rounded-full border px-3 text-sm transition-colors ${
                specialty === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-secondary-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          aria-label="مثالك"
          placeholder={`مثال من مجال «${specialty}»`}
          className={textareaCls}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted-foreground">{draft.trim().length > 0 && !canAdd ? "عشرة أحرف على الأقل" : ""}</span>
          <SecondaryButton
            disabled={!canAdd}
            onClick={() => {
              addStudentExample(conceptId, draft.trim(), specialty);
              setDraft("");
            }}
          >
            <Plus className="h-4 w-4" /> أضف المثال
          </SecondaryButton>
        </div>
      </Card>
    </section>
  );
}

// ---------- ملاحظاتي على المفهوم ----------
function MyNotesSection({ conceptId }: { conceptId: string }) {
  const notes = useApp((s) => s.notes);
  const addNote = useApp((s) => s.addNote);
  const removeNote = useApp((s) => s.removeNote);
  const [draft, setDraft] = useState("");
  const mine = notes[conceptId] ?? [];
  const canAdd = draft.trim().length >= 5;

  return (
    <section>
      <SectionHeader title="ملاحظاتي" sub="تعود معك كلما فتحت المفهوم" />
      <Card className="space-y-3 p-4">
        {mine.map((n) => (
          <div key={n.id} className="flex items-start gap-3 rounded-lg bg-muted p-3">
            <StickyNote className="mt-1 h-4 w-4 shrink-0 text-gem" />
            <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-7 text-secondary-foreground">{n.text}</p>
            <button
              type="button"
              onClick={() => removeNote(conceptId, n.id)}
              aria-label="حذف الملاحظة"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} aria-label="ملاحظة جديدة" placeholder="اكتب ملاحظة بلغتك" className={textareaCls} />
        <div className="flex justify-end">
          <SecondaryButton
            disabled={!canAdd}
            onClick={() => {
              addNote(conceptId, draft.trim());
              setDraft("");
            }}
          >
            <Plus className="h-4 w-4" /> احفظ الملاحظة
          </SecondaryButton>
        </div>
      </Card>
    </section>
  );
}

// ---------- صفحة المفهوم: قراءة هادئة ثم تدريب ----------
function ConceptDetail({ conceptId, onClose }: { conceptId: string; onClose: () => void }) {
  const readConcept = useApp((s) => s.readConcept);
  const conceptReads = useApp((s) => s.conceptReads);
  const startQuiz = useUi((s) => s.startQuiz);

  let found: { concept: Concept; course: Course } | null = null;
  for (const c of COURSES) {
    const x = conceptsOfCourse(c.id).find((y) => y.id === conceptId);
    if (x) {
      found = { concept: x, course: c };
      break;
    }
  }
  if (!found) return null;
  const { concept: c, course } = found;
  const qs = questionsOfConcept(c.id);
  const isRead = !!conceptReads[c.id];
  const examples = examplesOf(c);
  const explainParas = splitArParagraphs(c.explanation);

  const share = async () => {
    const r = await shareText(c.title, `${c.explanation}${examples.length ? "\n\n" + examples.map((e) => `• ${e}`).join("\n\n") : ""}\n\nمن تطبيق «تربوي»`);
    if (r === "copied") toast({ title: "نُسخ المفهوم" });
  };

  return (
    <ScreenShell
      title={c.title}
      sub={`${COURSE_SHORT[course.id] ?? course.name}، ${chapterLabel(c.chapter)}`}
      onClose={onClose}
      actions={
        <>
          <SpeakButton text={`${c.title}. ${c.explanation}`} label="استمع للشرح" />
          <button type="button" onClick={share} aria-label="شارك المفهوم" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <Share2 className="h-5 w-5" />
          </button>
        </>
      }
      footer={
        <>
          {!isRead && (
            <SecondaryButton onClick={() => readConcept(c.id)} className="flex-1 sm:flex-none">
              <CheckCircle2 className="h-4 w-4" /> قرأته
            </SecondaryButton>
          )}
          <PrimaryButton
            className="flex-1"
            disabled={qs.length === 0}
            onClick={() => {
              readConcept(c.id);
              startQuiz({ mode: "training", label: `تدريب: ${c.title}`, qids: shuffle(qs).map((q) => q.id), conceptId: c.id });
            }}
          >
            <Dumbbell className="h-4 w-4" /> تدرّب ({ad(qs.length)})
          </PrimaryButton>
        </>
      }
    >
      <article className="space-y-8">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="primary">{COURSE_SHORT[course.id] ?? course.name}</Chip>
            {isRead && (
              <Chip tone="success">
                <CheckCircle2 className="h-3.5 w-3.5" /> قرأته
              </Chip>
            )}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold leading-[1.6]">{c.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {chapterLabel(c.chapter)}، {arCount(examples.length, EXAMPLE_FORMS)}، {arCount(qs.length, QUESTION_FORMS)}
          </p>
        </header>

        <section className="space-y-4">
          {explainParas.map((p, i) => (
            <p key={i} className="text-base leading-9">
              {p}
            </p>
          ))}
        </section>

        {examples.length > 0 && (
          <section>
            <SectionHeader title="أمثلة من الميدان" sub="مواقف صفية تجسّد المفهوم في سياقه" />
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{ad(i + 1)}</span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                        <Lightbulb className="h-4 w-4 text-gem" /> {exampleContext(ex)}
                      </p>
                      {splitArParagraphs(ex).map((p, j) => (
                        <p key={j} className="text-[15px] leading-8 text-secondary-foreground">
                          {p}
                        </p>
                      ))}
                    </div>
                    <SpeakButton text={ex} label="استمع للمثال" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <MyNotesSection conceptId={c.id} />
        <StudentExamplesSection conceptId={c.id} />
      </article>
    </ScreenShell>
  );
}

export default function ConceptsView() {
  const conceptReads = useApp((s) => s.conceptReads);
  const startQuiz = useUi((s) => s.startQuiz);

  // طلبات فتح من خارج الشاشة تُستهلك عند التحميل الأول
  const pendingConceptId = useUi((s) => s.pendingConceptId);
  const pendingCourseId = useUi((s) => s.pendingCourseId);
  const clearPendingConcept = useUi((s) => s.clearPendingConcept);
  const clearPendingCourse = useUi((s) => s.clearPendingCourse);

  // التنقل: مقرر ← فصل ← مفهوم
  const [openCourseId, setOpenCourseId] = useState<string | null>(pendingCourseId);
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(pendingConceptId);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (pendingConceptId) clearPendingConcept();
    if (pendingCourseId) clearPendingCourse();
  }, [pendingConceptId, pendingCourseId, clearPendingConcept, clearPendingCourse]);

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return CONCEPTS.filter((c) => c.title.includes(q) || chapterLabel(c.chapter).includes(q)).slice(0, 40);
  }, [query]);

  const openCourse = COURSES.find((c) => c.id === openCourseId) ?? null;
  const chapters = useMemo(() => (openCourse ? chaptersOfCourse(openCourse.id) : []), [openCourse]);
  const chapterConcepts = useMemo(
    () => (openCourse && openChapter ? conceptsOfCourse(openCourse.id).filter((c) => c.chapter === openChapter) : []),
    [openCourse, openChapter]
  );

  const detail = detailId && <ConceptDetail conceptId={detailId} onClose={() => setDetailId(null)} />;

  const trainOn = (label: string, concepts: Concept[]) =>
    startQuiz({ mode: "training", label, qids: shuffle(concepts.flatMap((c) => questionsOfConcept(c.id))).slice(0, 10).map((q) => q.id) });

  // ---------- الفصل: قائمة مفاهيمه ----------
  if (openCourse && openChapter) {
    const read = chapterConcepts.filter((c) => conceptReads[c.id]).length;
    return (
      <>
        <ScreenShell
          title={chapterLabel(openChapter)}
          sub={COURSE_SHORT[openCourse.id] ?? openCourse.name}
          onBack={() => setOpenChapter(null)}
          footer={
            <PrimaryButton className="w-full" onClick={() => trainOn(`تدريب: ${chapterLabel(openChapter)}`, chapterConcepts)}>
              <Dumbbell className="h-4 w-4" /> تدرّب على الفصل
            </PrimaryButton>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <ProgressBar value={chapterConcepts.length ? (read / chapterConcepts.length) * 100 : 0} className="flex-1" />
              <span className="shrink-0 text-[13px] text-muted-foreground">
                قرأت {ad(read)} من {ad(chapterConcepts.length)}
              </span>
            </div>
            <Divided>
              {chapterConcepts.map((c, i) => {
                const isRead = !!conceptReads[c.id];
                const n = questionsOfConcept(c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDetailId(c.id)}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                  >
                    {isRead ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="مقروء" />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-input text-xs text-muted-foreground">{ad(i + 1)}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-6">{c.title}</span>
                      <span className="text-[13px] text-muted-foreground">{arCount(n, QUESTION_FORMS)}</span>
                    </span>
                    <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  </button>
                );
              })}
            </Divided>
          </div>
        </ScreenShell>
        {detail}
      </>
    );
  }

  // ---------- المقرر: فصوله ----------
  if (openCourse) {
    const all = conceptsOfCourse(openCourse.id);
    const read = all.filter((c) => conceptReads[c.id]).length;
    const color = COURSE_COLOR[openCourse.id] ?? "var(--primary)";
    return (
      <>
        <ScreenShell title={openCourse.name} sub={COURSE_SUBTITLE[openCourse.id]} onBack={() => setOpenCourseId(null)}>
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                  <CourseIcon id={openCourse.id} className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold leading-8">{openCourse.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {arCount(chapters.length, CHAPTER_FORMS)}، {arCount(all.length, CONCEPT_FORMS)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={all.length ? (read / all.length) * 100 : 0} className="flex-1" />
                <span className="shrink-0 text-[13px] font-medium">{pct(all.length ? (read / all.length) * 100 : 0)}</span>
              </div>
            </Card>

            <section>
              <SectionHeader title="الفصول" />
              <Divided>
                {chapters.map((ch, i) => {
                  const cs = all.filter((c) => c.chapter === ch);
                  const r = cs.filter((c) => conceptReads[c.id]).length;
                  const done = cs.length > 0 && r === cs.length;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setOpenChapter(ch)}
                      className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-success-soft text-success" : "bg-muted text-secondary-foreground"}`}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : ad(i + 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-medium leading-6">{chapterLabel(ch)}</span>
                        <span className="mt-1 flex items-center gap-2">
                          <ProgressBar value={cs.length ? (r / cs.length) * 100 : 0} height={4} className="max-w-[120px] flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {ad(r)} من {ad(cs.length)}
                          </span>
                        </span>
                      </span>
                      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                    </button>
                  );
                })}
              </Divided>
            </section>
          </div>
        </ScreenShell>
        {detail}
      </>
    );
  }

  // ---------- المكتبة: كل المقررات والبحث ----------
  return (
    <div className="space-y-6 pb-6">
      <PageTitle title="التعلّم" sub="المقررات بفصولها ومفاهيمها، ولكل مفهوم شرح وأمثلة وأسئلة" />

      <div className="flex h-12 items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مفهوم أو نظرية"
          aria-label="ابحث عن مفهوم"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="مسح البحث" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {searchResults !== null ? (
        searchResults.length === 0 ? (
          <EmptyState icon={Search} title="لا نتائج مطابقة" sub="جرّب كلمة أقصر أو مختلفة" />
        ) : (
          <section>
            <SectionHeader title="نتائج البحث" sub={arCount(searchResults.length, CONCEPT_FORMS)} />
            <Divided>
              {searchResults.map((c) => {
                            const color = COURSE_COLOR[c.courseId] ?? "var(--primary)";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDetailId(c.id)}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                      <CourseIcon id={c.courseId} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium leading-6">{c.title}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {COURSE_SHORT[c.courseId]}، {chapterLabel(c.chapter)}
                      </span>
                    </span>
                    {conceptReads[c.id] ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-input" />}
                  </button>
                );
              })}
            </Divided>
          </section>
        )
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="grid gap-3 sm:grid-cols-2">
          {COURSES.map((course) => {
            const color = COURSE_COLOR[course.id] ?? "var(--primary)";
                    const cs = conceptsOfCourse(course.id);
            const readCount = cs.filter((cc) => conceptReads[cc.id]).length;
            const v = cs.length ? (readCount / cs.length) * 100 : 0;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  setOpenCourseId(course.id);
                  setOpenChapter(null);
                }}
                className="card-soft flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-right transition-colors hover:bg-muted/40"
              >
                <span className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
                    <CourseIcon id={course.id} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-6">{course.name}</span>
                    <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{COURSE_SUBTITLE[course.id]}</span>
                  </span>
                </span>
                <span className="mt-auto block">
                  <span className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {arCount(cs.length, CONCEPT_FORMS)}، قرأت {ad(readCount)}
                    </span>
                    <span className="font-medium text-foreground">{pct(v)}</span>
                  </span>
                  <ProgressBar value={v} />
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      {detail}
    </div>
  );
}
