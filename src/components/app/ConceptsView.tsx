"use client";

// ============================================================================
// التعلّم — محور ← فصل ← مفهوم
// ============================================================================
// مبني على أنماط Coursera وKhan Academy:
// - إتقان بأربعة مستويات لكل مفهوم وفصل ومحور، مع شريط مقسّم ومفتاح ألوان.
// - «تابع التعلّم» يعيدك إلى آخر مفهوم قرأته.
// - صفحة قراءة بمخطط الفصل جانبًا، ووقت قراءة، وسؤال «تحقّق من فهمك»،
//   وانتقال «التالي» الذي يعلّم المفهوم مكتملًا، واختبار في نهاية الفصل.
// ============================================================================

import { FitText } from "./FitText";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
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
  ChevronRight,
  ChevronDown,
  Share2,
  StickyNote,
  GraduationCap,
  ClipboardCheck,
  Play,
  HelpCircle,
  HandHeart,
  Landmark,
} from "lucide-react";
import {
  COURSES,
  CONCEPTS,
  conceptsOfCourse,
  chaptersOfCourse,
  questionsOfConcept,
  questionsOfCourse,
  questionsOfChapter,
  examplesOf,
  conceptById,
  COURSE_COLOR,
  COURSE_SHORT,
  OPTION_LETTERS,
  shuffle,
} from "@/lib/qbank";
import type { Concept, Question } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { shareText } from "@/lib/share";
import { recordMistake } from "@/lib/mistakes-client";
import {
  MASTERY_LABELS,
  chapterMastery,
  chapterSession,
  conceptMastery,
  courseExam,
  courseMastery,
  examKey,
  starsFor,
  topicKey,
  EXAM_SECONDS,
  type MasteryLevel,
} from "@/lib/practice-bank";
import { ConceptDiagram } from "./Diagrams";
import { referencesFor } from "@/lib/references";
import { ad, arCount, CONCEPT_FORMS, CHAPTER_FORMS, QUESTION_FORMS, splitArParagraphs, splitReason, exampleContext } from "@/lib/arabic";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  Chip,
  Divided,
  EmptyState,
  MasteryBar,
  MasteryDot,
  MasteryLegend,
  OptionButton,
  PrimaryButton,
  ProgressBar,
  ScreenShell,
  SecondaryButton,
  SectionHeader,
  Stars,
  pct,
} from "./ui-kit";

// أيقونة كل محور
const COURSE_ICONS: Record<string, React.ElementType> = {
  M1: Dna,
  M2: Heart,
  M3: Brain,
  M4: ClipboardList,
  M5: School,
  G1: Library,
  SE1: HandHeart,
  F1: Landmark,
  AI1: Bot,
};
function CourseIcon({ id, className }: { id: string; className?: string }) {
  const Icon = COURSE_ICONS[id] ?? BookOpen;
  return <Icon className={className} />;
}
function CourseBadge({ id, size = 44 }: { id: string; size?: number }) {
  const color = COURSE_COLOR[id] ?? "var(--primary)";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
    >
      <CourseIcon id={id} className={size >= 44 ? "h-5 w-5" : "h-4 w-4"} />
    </span>
  );
}

// أسماء الفصول تُعرض بلا حروف الترقيم الكتابية (أ. ب. ج.)
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

// وصف موجز لكل محور
const COURSE_SUBTITLE: Record<string, string> = {
  M1: "النمو بمراحله ومجالاته وتطبيقاته في الصف",
  M2: "الدوافع والانفعالات والذكاء والفروق الفردية",
  M3: "التعلم ونظرياته والذاكرة والدافعية",
  M4: "القياس وأدوات التقويم والاختبارات",
  M5: "طرق تدريس المواد الدراسية",
  G1: "مفاهيم عامة في التربية والتعليم",
  SE1: "صعوبات التعلم والإعاقات والموهبة والدمج في الصف العادي",
  F1: "فلسفة التربية وتاريخها والبحث الإجرائي وأخلاقيات المهنة",
  AI1: "تطوره ودوره في العملية التعليمية وأخلاقياته",
};

const MASTERY_TONE: Record<MasteryLevel, "neutral" | "primary" | "success"> = { 0: "neutral", 1: "neutral", 2: "primary", 3: "success" };
const EXAMPLE_MORE = { one: "مثال آخر", two: "مثالان آخران", few: "أمثلة أخرى", many: "مثالًا آخر" };

const conceptsOfChapter = (courseId: string, chapter: string) => conceptsOfCourse(courseId).filter((c) => c.chapter === chapter);

const SPECIALTIES = ["تربية", "إنسانيات", "علوم", "هندسة", "طب", "أخرى"];
const textareaCls =
  "w-full resize-none rounded-xl border border-input bg-card p-3 text-base leading-7 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

// ---------- قسم قابل للطي ----------
function Disclosure({ icon: Icon, title, count, children }: { icon: React.ElementType; title: string; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
      >
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-base font-medium">{title}</span>
        {count !== undefined && count > 0 && <Chip>{ad(count)}</Chip>}
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t border-border px-4 py-4">{children}</div>}
    </div>
  );
}

// ---------- ملاحظاتي ----------
function MyNotes({ conceptId }: { conceptId: string }) {
  const notes = useApp((s) => s.notes);
  const addNote = useApp((s) => s.addNote);
  const removeNote = useApp((s) => s.removeNote);
  const [draft, setDraft] = useState("");
  const mine = notes[conceptId] ?? [];
  const canAdd = draft.trim().length >= 5;
  return (
    <>
      {mine.map((n) => (
        <div key={n.id} className="flex items-start gap-3 rounded-lg bg-muted p-3">
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
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} aria-label="ملاحظة جديدة" placeholder="اكتب ملاحظة بلغتك، تعود معك كلما فتحت المفهوم" className={textareaCls} />
      <div className="flex justify-end">
        <SecondaryButton
          disabled={!canAdd}
          onClick={() => {
            addNote(conceptId, draft.trim());
            setDraft("");
          }}
        >
          <Plus className="h-4 w-4" /> احفظ
        </SecondaryButton>
      </div>
    </>
  );
}

// ---------- أمثلة من تخصصي ----------
function MyExamples({ conceptId }: { conceptId: string }) {
  const studentExamples = useApp((s) => s.studentExamples);
  const addStudentExample = useApp((s) => s.addStudentExample);
  const removeStudentExample = useApp((s) => s.removeStudentExample);
  const [draft, setDraft] = useState("");
  const [specialty, setSpecialty] = useState<string>("تربية");
  const mine = studentExamples[conceptId] ?? [];
  const canAdd = draft.trim().length >= 10;
  return (
    <>
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
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} aria-label="مثالك" placeholder={`مثال من مجال «${specialty}» يوضح المفهوم`} className={textareaCls} />
      <div className="flex justify-end">
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
    </>
  );
}

// ---------- تحقّق من فهمك: سؤال واحد داخل صفحة القراءة ----------
function pickCheckQuestion(conceptId: string, attempts: Record<string, { correct: boolean }>): Question | null {
  const qs = questionsOfConcept(conceptId);
  if (qs.length === 0) return null;
  const fresh = qs.filter((q) => !attempts[q.id]);
  const pool = fresh.length > 0 ? fresh : qs;
  return pool[Math.floor(Math.random() * pool.length)];
}

function CheckUnderstanding({ conceptId, onAnswered }: { conceptId: string; onAnswered: () => void }) {
  const recordAttempt = useApp((s) => s.recordAttempt);
  const queryClient = useQueryClient();
  const [q] = useState(() => pickCheckQuestion(conceptId, useApp.getState().attempts));
  const [opts] = useState(() => (q ? (q.type === "mcq" && !q.fixedOrder ? shuffle(q.options) : q.options) : []));
  const [chosen, setChosen] = useState<string | null>(null);
  if (!q) return null;
  const done = chosen !== null;
  const ok = chosen === q.correct;
  const { base } = splitReason(q.reason);

  const answer = (text: string) => {
    if (done) return;
    setChosen(text);
    const right = text === q.correct;
    recordAttempt(q.id, right, text);
    if (!right) recordMistake(q.id, text, queryClient);
    onAnswered();
  };

  return (
    <Card className="p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        <HelpCircle className="h-4 w-4" /> تحقّق من فهمك
      </p>
      <p className="mt-3 font-display text-base font-semibold leading-8">{q.question}</p>
      <div className={`mt-4 ${q.type === "tf" ? "grid grid-cols-2 gap-3" : "space-y-3"}`}>
        {opts.map((o, i) => {
          const state = !done ? "idle" : o.isCorrect ? "correct" : o.text === chosen ? "wrong" : "dim";
          return (
            <OptionButton key={i} letter={q.type === "mcq" ? OPTION_LETTERS[i] : undefined} state={state} disabled={done} onClick={() => answer(o.text)}>
              {o.text}
            </OptionButton>
          );
        })}
      </div>
      {done && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-xl p-4 ${ok ? "bg-success-soft" : "bg-danger-soft"}`}>
          <p className={`flex items-center gap-2 text-sm font-semibold ${ok ? "text-success" : "text-destructive"}`}>
            {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {ok ? "أحسنت، فهمت المفهوم" : "ليس تمامًا، وأُضيف السؤال إلى «أخطائي»"}
          </p>
          <p className="mt-1.5 text-sm leading-7 text-foreground/85">{base}</p>
        </motion.div>
      )}
    </Card>
  );
}

// ---------- مخطط الفصل (يظهر جانبًا على الحاسوب) ----------
function ChapterOutline({ concepts, currentId, onPick }: { concepts: Concept[]; currentId: string; onPick: (id: string) => void }) {
  const conceptReads = useApp((s) => s.conceptReads);
  const read = concepts.filter((c) => conceptReads[c.id]).length;
  return (
    <nav aria-label="مفاهيم الفصل" className="sticky top-0">
      <p className="text-xs font-medium text-muted-foreground">
        أكملت {ad(read)} من {ad(concepts.length)}
      </p>
      <ProgressBar value={concepts.length ? (read / concepts.length) * 100 : 0} height={4} className="mb-3 mt-2" />
      <ol className="space-y-0.5">
        {concepts.map((c, i) => {
          const active = c.id === currentId;
          const isRead = !!conceptReads[c.id];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-right text-sm leading-6 transition-colors ${
                  active ? "bg-accent font-medium text-accent-foreground" : "text-secondary-foreground hover:bg-muted"
                }`}
              >
                {isRead ? (
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-input text-xs">{ad(i + 1)}</span>
                )}
                <span className="min-w-0 flex-1">{c.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------- صفحة القراءة ----------
/** embedded: يُفتح من داخل جلسة أسئلة، فلا يبدأ تدريبًا جديدًا ويعود إلى السؤال */
export function ConceptReader({ conceptId, onClose, embedded = false }: { conceptId: string; onClose: () => void; embedded?: boolean }) {
  const [currentId, setCurrentId] = useState(conceptId);
  const [showAllExamples, setShowAllExamples] = useState(false);
  const readConcept = useApp((s) => s.readConcept);
  const conceptReads = useApp((s) => s.conceptReads);
  const attempts = useApp((s) => s.attempts);
  const notes = useApp((s) => s.notes);
  const studentExamples = useApp((s) => s.studentExamples);
  const setLastConcept = useApp((s) => s.setLastConcept);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const startQuiz = useUi((s) => s.startQuiz);
  const openConcept = useUi((s) => s.openConcept);

  const c = conceptById(currentId);
  useEffect(() => {
    if (c) setLastConcept(c.id);
  }, [c, setLastConcept]);
  if (!c) return null;

  const course = COURSES.find((x) => x.id === c.courseId);
  const siblings = conceptsOfChapter(c.courseId, c.chapter);
  const pos = siblings.findIndex((x) => x.id === c.id);
  const prev = pos > 0 ? siblings[pos - 1] : null;
  const next = pos >= 0 && pos < siblings.length - 1 ? siblings[pos + 1] : null;
  const qs = questionsOfConcept(c.id);
  const examples = examplesOf(c);
  const shownExamples = showAllExamples ? examples : examples.slice(0, 2);
  const isRead = !!conceptReads[c.id];
  const level = conceptMastery(c.id, attempts);

  const go = (id: string) => {
    setShowAllExamples(false);
    setCurrentId(id);
  };
  const train = () => {
    readConcept(c.id);
    openConcept(c.id); // العودة إلى هذه الصفحة بعد التدريب
    startQuiz({ mode: "training", label: `تدريب: ${c.title}`, qids: shuffle(qs).map((q) => q.id), conceptId: c.id });
  };
  const chapterQuiz = () => {
    readConcept(c.id);
    setLastStudy(c.courseId, c.chapter);
    startQuiz({
      mode: "training",
      label: `اختبار الفصل: ${chapterLabel(c.chapter)}`,
      qids: chapterSession(c.courseId, c.chapter, attempts),
      topicKey: topicKey(c.courseId, c.chapter),
    });
  };
  const share = async () => {
    const r = await shareText(c.title, `${c.explanation}${examples.length ? "\n\n" + examples.map((e) => `• ${e}`).join("\n\n") : ""}\n\nمن تطبيق «تربوي»`);
    if (r === "copied") toast({ title: "نُسخ المفهوم" });
  };

  return (
    <ScreenShell
      key={c.id}
      wide
      title={chapterLabel(c.chapter)}
      sub={`المفهوم ${ad(pos + 1)} من ${ad(siblings.length)}، ${COURSE_SHORT[c.courseId] ?? course?.name ?? ""}`}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={share} aria-label="شارك المفهوم" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#174D41] hover:bg-black/5 dark:text-foreground">
            <Share2 className="h-5 w-5" />
          </button>
        </>
      }
      footer={
        <>
          <SecondaryButton onClick={() => prev && go(prev.id)} disabled={!prev} aria-label="المفهوم السابق" className="px-3 sm:px-5">
            <ChevronRight className="h-5 w-5" />
            <span className="hidden sm:inline">السابق</span>
          </SecondaryButton>
          <div className="hidden flex-1 sm:block" />
          {embedded ? (
            <PrimaryButton onClick={onClose} className="flex-1 sm:flex-none">
              عودة إلى السؤال
            </PrimaryButton>
          ) : next ? (
            <PrimaryButton
              onClick={() => {
                readConcept(c.id);
                go(next.id);
              }}
              className="flex-1 sm:flex-none"
            >
              {isRead ? "التالي" : "أكملت، التالي"} <ChevronLeft className="h-5 w-5" />
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={chapterQuiz} className="flex-1 sm:flex-none">
              <ClipboardCheck className="h-4 w-4" /> أكملت الفصل، اختبر نفسك
            </PrimaryButton>
          )}
        </>
      }
    >
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <ChapterOutline concepts={siblings} currentId={c.id} onPick={go} />
        </aside>

        <article className="mx-auto w-full max-w-[680px] space-y-8">
          <ProgressBar value={((pos + 1) / Math.max(1, siblings.length)) * 100} height={4} className="lg:hidden" />
          <header>
            <div className="flex flex-wrap items-center gap-2">
              {level > 0 && (
                <Chip tone={MASTERY_TONE[level]}>
                  <MasteryDot level={level} size={10} /> {MASTERY_LABELS[level]}
                </Chip>
              )}
              {isRead && (
                <Chip tone="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> مكتمل
                </Chip>
              )}
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold leading-[1.6] sm:text-[28px]">{c.title}</h1>
          </header>

          {c.rule && (
            <p className="rounded-2xl border-[1.5px] border-[#E3A93B] bg-[#FFF8D6] p-4 text-lg font-bold leading-9 dark:bg-[#E3A93B]/10">
              {c.rule}
            </p>
          )}

          <ConceptDiagram conceptId={c.id} pageTitle={c.title} />

          <section className="space-y-5">
            {splitArParagraphs(c.explanation).map((p, i) => (
              <p key={i} className="text-lg leading-[2.1]">
                {p}
              </p>
            ))}
          </section>

          {examples.length > 0 && (
            <section>
              <SectionHeader title="أمثلة من الميدان" sub="مواقف صفية تجسّد المفهوم" />
              <div className="space-y-3">
                {shownExamples.map((ex, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-gem" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{exampleContext(ex)}</p>
                        <div className="mt-1.5 space-y-2">
                          {splitArParagraphs(ex).map((p, j) => (
                            <p key={j} className="text-base leading-8 text-secondary-foreground">
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {examples.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllExamples((v) => !v)}
                  className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-primary hover:bg-accent"
                >
                  {showAllExamples ? "أمثلة أقل" : arCount(examples.length - 2, EXAMPLE_MORE)}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAllExamples ? "rotate-180" : ""}`} />
                </button>
              )}
            </section>
          )}

          <CheckUnderstanding key={c.id} conceptId={c.id} onAnswered={() => readConcept(c.id)} />

          {!embedded && <Divided>
            <button type="button" onClick={train} disabled={qs.length === 0} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60 disabled:opacity-50">
              <Dumbbell className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium">تدرّب على هذا المفهوم</span>
                <span className="text-sm text-muted-foreground">{arCount(qs.length, QUESTION_FORMS)} بشرح كامل</span>
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </button>
            <Disclosure icon={StickyNote} title="ملاحظاتي" count={(notes[c.id] ?? []).length}>
              <MyNotes conceptId={c.id} />
            </Disclosure>
            <Disclosure icon={GraduationCap} title="أمثلة من تخصصي" count={(studentExamples[c.id] ?? []).length}>
              <MyExamples conceptId={c.id} />
            </Disclosure>
          </Divided>}

          {referencesFor(c).length > 0 && (
            <section className="border-t-2 border-border pt-5">
              <h2 className="font-display text-base font-bold">المرجع الأصلي</h2>
              <ul className="mt-2 space-y-1.5">
                {referencesFor(c).map((r) => (
                  <li key={r} className="text-base leading-8 text-secondary-foreground">
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </ScreenShell>
  );
}

// ---------- صفحة الفصل ----------
function ChapterPage({ courseId, chapter, onBack, onOpen }: { courseId: string; chapter: string; onBack: () => void; onOpen: (id: string) => void }) {
  const conceptReads = useApp((s) => s.conceptReads);
  const attempts = useApp((s) => s.attempts);
  const best = useApp((s) => s.best);
  const setLastStudy = useApp((s) => s.setLastStudy);
  const startQuiz = useUi((s) => s.startQuiz);

  const concepts = conceptsOfChapter(courseId, chapter);
  const read = concepts.filter((c) => conceptReads[c.id]).length;
  const mastery = chapterMastery(courseId, chapter, attempts);
  const nQ = questionsOfChapter(courseId, chapter).length;
  const nextUp = concepts.find((c) => !conceptReads[c.id]) ?? concepts[0];
  const b = best[topicKey(courseId, chapter)];

  const quiz = () => {
    setLastStudy(courseId, chapter);
    startQuiz({ mode: "training", label: `اختبار الفصل: ${chapterLabel(chapter)}`, qids: chapterSession(courseId, chapter, attempts), topicKey: topicKey(courseId, chapter) });
  };

  return (
    <ScreenShell
      wide
      title={chapterLabel(chapter)}
      sub={COURSE_SHORT[courseId]}
      onBack={onBack}
      footer={
        <>
          <SecondaryButton onClick={quiz} className="flex-1 sm:flex-none">
            <ClipboardCheck className="h-4 w-4" /> اختبار الفصل
          </SecondaryButton>
          <PrimaryButton onClick={() => nextUp && onOpen(nextUp.id)} className="flex-1 sm:flex-none">
            <Play className="h-4 w-4" /> {read === 0 ? "ابدأ القراءة" : read === concepts.length ? "راجع من البداية" : "تابع القراءة"}
          </PrimaryButton>
        </>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-5">
          <h2 className="mt-1 font-display text-xl font-bold leading-8">{chapterLabel(chapter)}</h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> {arCount(concepts.length, CONCEPT_FORMS)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Dumbbell className="h-4 w-4" /> {arCount(nQ, QUESTION_FORMS)}
            </span>
          </div>
          <div className="mt-5 space-y-2.5">
            <MasteryBar counts={mastery} />
            <MasteryLegend labels={MASTERY_LABELS} counts={mastery} />
          </div>
          {b !== undefined && (
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">أفضل نتيجة في اختبار الفصل</span>
              <span className="font-medium">{pct(b)}</span>
              <Stars count={starsFor(b)} />
            </div>
          )}
        </Card>

        <section>
          <SectionHeader title="المفاهيم" sub={`أكملت ${ad(read)} من ${ad(concepts.length)}`} />
          <Divided>
            {concepts.map((c, i) => {
              const isRead = !!conceptReads[c.id];
              const lv = conceptMastery(c.id, attempts);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onOpen(c.id)}
                  className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                >
                  {isRead ? (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-label="مكتمل" />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-input text-xs text-muted-foreground">{ad(i + 1)}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium leading-6">{c.title}</span>
                    {lv > 0 && (
                      <span className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                        <MasteryDot level={lv} size={10} />
                        <span>{MASTERY_LABELS[lv]}</span>
                      </span>
                    )}
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </button>
              );
            })}
          </Divided>
        </section>
      </div>
    </ScreenShell>
  );
}

// ---------- صفحة المحور ----------
function CoursePage({ courseId, onBack, onChapter, onOpen }: { courseId: string; onBack: () => void; onChapter: (ch: string) => void; onOpen: (id: string) => void }) {
  const conceptReads = useApp((s) => s.conceptReads);
  const attempts = useApp((s) => s.attempts);
  const best = useApp((s) => s.best);
  const startQuiz = useUi((s) => s.startQuiz);
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return null;
  const chapters = chaptersOfCourse(courseId);
  const all = conceptsOfCourse(courseId);
  const read = all.filter((c) => conceptReads[c.id]).length;
  const mastery = courseMastery(courseId, attempts);
  const nextUp = all.find((c) => !conceptReads[c.id]);
  const bestExam = best[examKey(courseId)];

  return (
    <ScreenShell wide title={course.name} sub={COURSE_SUBTITLE[courseId]} onBack={onBack}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* ملخص المحور: أولًا على الجوال، وجانبًا على الحاسوب */}
        <aside className="space-y-4 lg:sticky lg:top-0 lg:order-2">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <CourseBadge id={courseId} size={48} />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold leading-7">{course.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {arCount(chapters.length, CHAPTER_FORMS)}، {arCount(all.length, CONCEPT_FORMS)}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">الإتقان</span>
                <span className="text-muted-foreground">
                  قرأت {ad(read)} من {ad(all.length)}
                </span>
              </div>
              <MasteryBar counts={mastery} />
              <MasteryLegend labels={MASTERY_LABELS} counts={mastery} />
            </div>
            {bestExam !== undefined && (
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                أفضل اختبار: <span className="font-bold text-foreground">{pct(bestExam)}</span>
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2.5">
              {nextUp && (
                <PrimaryButton onClick={() => onOpen(nextUp.id)} className="w-full">
                  <Play className="h-4 w-4" /> {read === 0 ? "ابدأ المحور" : "تابع"}
                </PrimaryButton>
              )}
              <SecondaryButton
                className="w-full"
                onClick={() => startQuiz({ mode: "exam", label: `اختبار: ${course.name}`, qids: courseExam(courseId), timeLimitSec: EXAM_SECONDS, topicKey: examKey(courseId) })}
              >
                <ClipboardCheck className="h-4 w-4" /> اختبار المحور
              </SecondaryButton>
            </div>
            {nextUp && <p className="mt-3 text-center text-sm text-muted-foreground">التالي: {nextUp.title}</p>}
          </Card>
        </aside>

        <section className="lg:order-1">
          <SectionHeader title="الفصول" sub={`${arCount(questionsOfCourse(courseId).length, QUESTION_FORMS)} في بنك المحور`} />
          <Divided>
            {chapters.map((ch, i) => {
              const cs = all.filter((c) => c.chapter === ch);
              const r = cs.filter((c) => conceptReads[c.id]).length;
              const m = chapterMastery(courseId, ch, attempts);
              const done = cs.length > 0 && r === cs.length;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onChapter(ch)}
                  className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3.5 text-right transition-colors hover:bg-muted/60"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? "bg-success-soft text-success" : "bg-muted text-secondary-foreground"}`}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : ad(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium leading-6">{chapterLabel(ch)}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {arCount(cs.length, CONCEPT_FORMS)}
                    </span>
                    <MasteryBar counts={m} height={5} className="mt-2 max-w-[220px]" />
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </button>
              );
            })}
          </Divided>
        </section>
      </div>
    </ScreenShell>
  );
}

// ---------- المكتبة ----------
export default function ConceptsView() {
  const conceptReads = useApp((s) => s.conceptReads);
  const attempts = useApp((s) => s.attempts);
  const lastConcept = useApp((s) => s.lastConcept);

  // طلب فتح مفهوم من خارج الشاشة (من الرئيسية، أو عودة من تدريب بدأ من صفحة القراءة)
  const pendingConceptId = useUi((s) => s.pendingConceptId);
  const pendingCourseId = useUi((s) => s.pendingCourseId);
  const clearPendingConcept = useUi((s) => s.clearPendingConcept);
  const clearPendingCourse = useUi((s) => s.clearPendingCourse);

  const pending = pendingConceptId ? conceptById(pendingConceptId) : undefined;
  const [openCourseId, setOpenCourseId] = useState<string | null>(pending?.courseId ?? pendingCourseId);
  const [openChapter, setOpenChapter] = useState<string | null>(pending?.chapter ?? null);
  const [detailId, setDetailId] = useState<string | null>(pending?.id ?? null);
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

  // فتح مفهوم يضبط محوره وفصله، فيعود «رجوع» إلى الفصل الصحيح
  const openConceptHere = (id: string) => {
    const c = conceptById(id);
    if (c) {
      setOpenCourseId(c.courseId);
      setOpenChapter(c.chapter);
    }
    setDetailId(id);
  };

  const reader = detailId && <ConceptReader conceptId={detailId} onClose={() => setDetailId(null)} />;

  if (openCourseId && openChapter) {
    return (
      <>
        <ChapterPage courseId={openCourseId} chapter={openChapter} onBack={() => setOpenChapter(null)} onOpen={openConceptHere} />
        {reader}
      </>
    );
  }
  if (openCourseId) {
    return (
      <>
        <CoursePage courseId={openCourseId} onBack={() => setOpenCourseId(null)} onChapter={setOpenChapter} onOpen={openConceptHere} />
        {reader}
      </>
    );
  }

  const resume = lastConcept ? conceptById(lastConcept) : undefined;
  const resumeSiblings = resume ? conceptsOfChapter(resume.courseId, resume.chapter) : [];
  const resumeRead = resumeSiblings.filter((c) => conceptReads[c.id]).length;

  return (
    <div className="space-y-7 pb-6">

      <div className="flex h-12 items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مفهوم أو نظرية"
          aria-label="ابحث عن مفهوم"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
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
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConceptHere(c.id)}
                  className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-muted/60"
                >
                  <CourseBadge id={c.courseId} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium leading-6">{c.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {COURSE_SHORT[c.courseId]}، {chapterLabel(c.chapter)}
                    </span>
                  </span>
                  <MasteryDot level={conceptMastery(c.id, attempts)} />
                </button>
              ))}
            </Divided>
          </section>
        )
      ) : (
        <>
          {resume && (
            <section>
              <SectionHeader title="تابع التعلّم" />
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <CourseBadge id={resume.courseId} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold leading-7">{resume.title}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={resumeSiblings.length ? (resumeRead / resumeSiblings.length) * 100 : 0} className="flex-1" />
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {ad(resumeRead)} من {ad(resumeSiblings.length)}
                      </span>
                    </div>
                  </div>
                </div>
                <PrimaryButton onClick={() => openConceptHere(resume.id)} className="mt-4 w-full sm:w-auto">
                  <Play className="h-4 w-4" /> تابع
                </PrimaryButton>
              </Card>
            </section>
          )}

          <section>
            <SectionHeader title="المحاور" />
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="grid gap-3 sm:grid-cols-2">
              {COURSES.map((course) => {
                const cs = conceptsOfCourse(course.id);
                const readCount = cs.filter((cc) => conceptReads[cc.id]).length;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setOpenCourseId(course.id);
                      setOpenChapter(null);
                    }}
                    className="flex min-w-0 items-center gap-3 rounded-[24px] border border-[#E2ECE7] bg-white p-3.5 text-right transition active:scale-[0.98] dark:border-border dark:bg-card"
                  >
                    <CourseBadge id={course.id} size={48} />
                    <span className="min-w-0 flex-1">
                      <FitText max={20} min={13} className="font-bold leading-7">{course.name}</FitText>
                      <span className="mt-2 flex items-center gap-2">
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full" style={{ width: `${cs.length ? (readCount / cs.length) * 100 : 0}%`, background: COURSE_COLOR[course.id] ?? "var(--primary)" }} />
                        </span>
                        <span className="shrink-0 text-sm font-bold text-muted-foreground">
                          {ad(readCount)}/{ad(cs.length)}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </section>
        </>
      )}

      {reader}
    </div>
  );
}
