"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Users,
  Plus,
  Trash2,
  ChevronRight,
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
import { ad, arCount, CONCEPT_FORMS, splitArParagraphs, exampleContext } from "@/lib/arabic";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import SpeakButton from "./SpeakButton";

// أيقونة كل محور — بديل أرقام المحاور (قرار المستخدم: بلا شكل كتاب مدرسي)
const COURSE_ICONS: Record<string, React.ElementType> = {
  M1: Dna,
  M2: Heart,
  M3: Brain,
  M4: ClipboardList,
  M5: School,
  G1: Library,
  AI1: Bot,
};
const CourseIcon = ({ id, className }: { id: string; className?: string }) => {
  const Icon = COURSE_ICONS[id] ?? BookOpen;
  return <Icon className={className} />;
};

// عرض أسماء الموضوعات — تُنظّف من حروف الترقيم الكتابية (أ. ب. ج.) حتى لا تشبه فهرس كتاب
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

// وصف موجز لكل محور في بطاقات المكتبة — مستمد من موضوعاته نفسها
const COURSE_SUBTITLE: Record<string, string> = {
  M1: "النمو بمراحله ومجالاته وتطبيقاته في الصف",
  M2: "الغرائز والعواطف والذكاء",
  M3: "التعلم ونظرياته والذاكرة والدافعية",
  M4: "القياس وأدوات التقويم والاختبارات",
  M5: "طرق تدريس المواد الدراسية",
  G1: "مفاهيم عامة في التربية والتعليم",
  AI1: "تطوره ودوره في العملية التعليمية وأخلاقياته",
};

// ---------- مجتمع الطلاب: أمثلة يضيفها الطلاب من واقع تخصصاتهم ----------
const SPECIALTIES = ["هندسة", "طب", "إنسانيات", "تربية", "أخرى"];
const SPECIALTY_COLORS: Record<string, string> = {
  "هندسة": "#14919B",
  "طب": "#BE185D",
  "إنسانيات": "#14919B",
  "تربية": "#0E7C86",
  "أخرى": "#B45309",
};

function StudentExamplesSection({ conceptId }: { conceptId: string }) {
  const studentExamples = useApp((s) => s.studentExamples);
  const addStudentExample = useApp((s) => s.addStudentExample);
  const removeStudentExample = useApp((s) => s.removeStudentExample);

  const [draft, setDraft] = useState("");
  const [specialty, setSpecialty] = useState<string>("تربية");
  const mine = studentExamples[conceptId] ?? [];
  const canAdd = draft.trim().length >= 10;

  return (
    <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-amber-900">
        <Users className="h-4 w-4" /> أمثلة الطلاب — مجتمع التطبيق
      </p>
      <p className="mt-1 text-[11px] font-bold leading-5 text-amber-800/90">
        أضف مثالاً من واقع تخصصك (هندسة، طب، إنسانيات...) يثري الفهم للجميع — أمثلتك محفوظة
        على جهازك وتظهر أسفل هذا المفهوم.
      </p>

      {/* أمثلة الطالب المضافة */}
      {mine.length > 0 && (
        <div className="mt-3 space-y-2">
          {mine.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-amber-100 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[9px] font-black text-white"
                  style={{ background: SPECIALTY_COLORS[e.specialty] ?? "#B45309" }}
                >
                  {e.specialty}
                </span>
                <button
                  onClick={() => removeStudentExample(conceptId, e.id)}
                  aria-label="حذف المثال"
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-xs leading-6 text-gray-700">{e.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* نموذج الإضافة */}
      <div className="mt-3 space-y-2">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition-colors ${
                specialty === s
                  ? "border-amber-600 bg-amber-600 text-white"
                  : "border-amber-200 bg-white text-amber-800"
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
          placeholder={`اكتب مثالاً من واقع تخصص «${specialty}» يوضح هذا المفهوم...`}
          className="w-full resize-none rounded-2xl border border-amber-200 bg-white p-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-amber-300"
        />
        <Button
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd) return;
            addStudentExample(conceptId, draft.trim(), specialty);
            setDraft("");
          }}
          className="h-11 w-full rounded-2xl bg-amber-500 text-sm font-black text-amber-950 hover:bg-amber-400 disabled:opacity-40"
        >
          <Plus className="ml-1.5 h-4 w-4" /> أضف مثالك للمجتمع
        </Button>
        {draft.trim().length > 0 && !canAdd && (
          <p className="text-center text-[10px] font-bold text-amber-700/70">
            اكتب مثالاً أوضح — عشرة أحرف على الأقل
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- ملاحظاتي: ملاحظة مرتبطة بالمفهوم — من ميزة «ملاحظاتي» ضد ضياع الملاحظات ----------
function MyNotesSection({ conceptId }: { conceptId: string }) {
  const notes = useApp((s) => s.notes);
  const addNote = useApp((s) => s.addNote);
  const removeNote = useApp((s) => s.removeNote);
  const [draft, setDraft] = useState("");
  const mine = notes[conceptId] ?? [];
  const canAdd = draft.trim().length >= 5;

  return (
    <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-amber-900">
        <StickyNote className="h-4 w-4" /> ملاحظاتي على هذا المفهوم
      </p>
      <p className="mt-1 text-[11px] font-bold leading-5 text-amber-800/80">
        دون ما يخطرك أثناء المحاضرة أو القراءة بلغتك الخاصة — ملاحظاتك محفوظة على جهازك وتعود معك كلما فتحت المفهوم.
      </p>

      {mine.length > 0 && (
        <div className="mt-3 space-y-2">
          {mine.map((n) => (
            <div key={n.id} className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-white p-3">
              <p className="flex-1 whitespace-pre-wrap text-xs leading-6 text-gray-700">{n.text}</p>
              <button
                onClick={() => removeNote(conceptId, n.id)}
                aria-label="حذف الملاحظة"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="ملاحظة سريعة بلغتك..."
          className="w-full resize-none rounded-2xl border border-amber-200 bg-white p-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-amber-300"
        />
        <Button
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd) return;
            addNote(conceptId, draft.trim());
            setDraft("");
          }}
          className="h-11 w-full rounded-2xl bg-amber-500 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-40"
        >
          <Plus className="ml-1.5 h-4 w-4" /> احفظ الملاحظة
        </Button>
      </div>
    </div>
  );
}

function ConceptDetail({
  conceptId,
  onClose,
}: {
  conceptId: string;
  onClose: () => void;
}) {
  const readConcept = useApp((s) => s.readConcept);
  const conceptReads = useApp((s) => s.conceptReads);
  const startQuiz = useUi((s) => s.startQuiz);

  let concept: { concept: Concept; course: Course } | null = null;
  for (const c of COURSES) {
    const found = conceptsOfCourse(c.id).find((x) => x.id === conceptId);
    if (found) {
      concept = { concept: found, course: c };
      break;
    }
  }

  if (!concept) return null;
  const { concept: c, course } = concept;
  const qs = questionsOfConcept(c.id);
  const isRead = !!conceptReads[c.id];
  const examples = examplesOf(c);
  const explainParas = splitArParagraphs(c.explanation);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div
        className="safe-top relative overflow-hidden px-4 pb-5 pt-3 text-white"
        style={{ background: `linear-gradient(135deg, ${COURSE_COLOR[course.id] ?? "#0E7C86"}, #0A5A62)` }}
      >
        {/* أشكال زخرفية */}
        <span aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-14 -right-8 h-36 w-36 rounded-full bg-white/5" />
        <span aria-hidden className="pointer-events-none absolute bottom-6 left-16 h-16 w-16 rounded-full bg-amber-300/10" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold opacity-90">
              <CourseIcon id={course.id} className="h-3.5 w-3.5" /> {chapterLabel(c.chapter)}
            </p>
            <h2 className="mt-1 text-xl font-black leading-8">{c.title}</h2>
            {/* شرائح إحصاء */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black ring-1 ring-white/20 backdrop-blur">
                {ad(examples.length)} شواهد تطبيقية
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black ring-1 ring-white/20 backdrop-blur">
                {ad(qs.length)} سؤال تدريب
              </span>
              {isRead && (
                <span className="flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-black text-amber-950">
                  <CheckCircle2 className="h-3 w-3" /> تمت القراءة
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/20 p-2 ring-1 ring-white/25 backdrop-blur" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <div className="card-soft space-y-4 rounded-3xl border border-border bg-white p-5">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-black text-primary">
                <BookOpen className="h-4 w-4" /> المضمون العلمي
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => {
                    const exs = examples;
                    const r = await shareText(
                      c.title,
                      `${c.explanation}${
                        exs.length
                          ? "\n\n" + exs.map((e) => `• ${e}`).join("\n\n")
                          : ""
                      }\n\n— من تطبيق مساعد إعداد المعلم`
                    );
                    if (r === "copied") toast({ title: "نُسخ المفهوم — الصقه حيث تريد" });
                  }}
                  aria-label="شارك المفهوم"
                  title="شارك المفهوم"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <SpeakButton text={`${c.title}. ${c.explanation}`} label="استمع للشرح" />
              </div>
            </div>
            <div className="space-y-3">
              {explainParas.map((p, i) => (
                <p key={i} className={`text-[15px] leading-8 text-foreground/95 ${i === 0 ? "first-letter:text-[26px] first-letter:font-black first-letter:text-primary" : ""}`}>
                  {p}
                </p>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-black text-cyan-800">
              <Lightbulb className="h-4 w-4" /> الشواهد التطبيقية من الميدان
            </p>
            <p className="text-[11px] font-bold leading-5 text-muted-foreground">
              مواقف حقيقية مُعاد تركيبها تُجسّد المفهوم في سياقه التربوي — تُقرأ كل شاهدة كحالة مستقلة تُلاحظ ثم تُحلَّل.
            </p>
            <div className="relative space-y-3 pr-5">
              {/* الخط الزمني الرأسي */}
              <span
                aria-hidden
                className="absolute bottom-3 right-[11px] top-3 w-0.5 rounded-full bg-gradient-to-b from-cyan-300 via-cyan-200 to-cyan-100"
              />
              {examples.map((ex, i) => (
                <div key={i} className="relative">
                  {/* عقدة الرقم على الخط */}
                  <span className="absolute -right-5 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-cyan-800 text-[11px] font-black text-white shadow-md ring-2 ring-white">
                    {ad(i + 1)}
                  </span>
                  <div className="rounded-3xl border border-cyan-100 bg-gradient-to-bl from-cyan-50/80 to-white p-4 shadow-[0_2px_10px_rgba(109,40,217,0.05)]">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <span className="inline-block rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black text-cyan-700 ring-1 ring-cyan-200">
                          سياق: {exampleContext(ex)}
                        </span>
                        {splitArParagraphs(ex).map((p, j) => (
                          <p key={j} className="text-sm leading-7 text-cyan-950/95">{p}</p>
                        ))}
                      </div>
                      <SpeakButton text={ex} label="استمع للمثال" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ملاحظاتي — قبل أمثلة المجتمع لأنها شخصية أولًا */}
          <MyNotesSection conceptId={c.id} />
          {/* مجتمع الطلاب: مساحة لإثراء المفهوم بأمثلة من تخصصات الطلاب */}
          <StudentExamplesSection conceptId={c.id} />
        </div>
      </div>

      <div className="safe-bottom space-y-2 border-t border-border bg-white px-4 pt-3">
        <Button
          className="h-13 w-full rounded-2xl bg-gradient-to-l from-cyan-700 to-cyan-900 py-3.5 text-base font-black text-white shadow-lg shadow-cyan-900/20"
          onClick={() => {
            readConcept(c.id);
            startQuiz({
              mode: "training",
              label: `تدريب: ${c.title}`,
              qids: shuffle(qs).map((q) => q.id),
              conceptId: c.id,
            });
          }}
        >
          <Dumbbell className="ml-2 h-5 w-5" /> تدريب على هذا المفهوم
        </Button>
        {!isRead && (
          <Button
            variant="outline"
            className="w-full rounded-2xl border-2 text-sm font-bold"
            onClick={() => {
              readConcept(c.id);
              onClose();
            }}
          >
            <CheckCircle2 className="ml-1 h-4 w-4 text-emerald-600" /> تعليم كمقروء
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ---------- ترويسة المستويات الداخلية: زر عودة + عنوان ملون بنقطة المحور ----------
function SubHeader({
  title,
  hint,
  accent,
  onBack,
}: {
  title: string;
  hint?: string;
  accent: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={onBack}
        aria-label="عودة"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-gray-700 transition-colors active:bg-accent"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-base font-black leading-6 text-gray-900">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
          <span className="truncate">{title}</span>
        </h2>
        {hint && (
          <p className="truncate text-[10px] font-bold text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  );
}

export default function ConceptsView() {
  const { conceptReads } = useApp();

  // طلبات فتح من خارج الشاشة (مفهوم اليوم / عوالم الأساس وأعرف في الرئيسية)
  // تُستهلك عند التحميل الأول لتهيئة الحالة مباشرة — بلا setState داخل التأثيرات
  const pendingConceptId = useUi((s) => s.pendingConceptId);
  const pendingCourseId = useUi((s) => s.pendingCourseId);
  const clearPendingConcept = useUi((s) => s.clearPendingConcept);
  const clearPendingCourse = useUi((s) => s.clearPendingCourse);
  const startHeart = useUi((s) => s.startHeart);

  // التنقل البطاقي ثلاثي المستويات (نموذج المستخدم): بطاقة محور ← بطاقات موضوعاته ← بطاقات مفاهيمه
  const [openCourseId, setOpenCourseId] = useState<string | null>(pendingCourseId);
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(pendingConceptId);
  const [query, setQuery] = useState("");

  // مسح الطلب المعلق بعد الاستهلاك (تحديث مخزن خارجي فقط — لا حالة محلية هنا)
  useEffect(() => {
    if (pendingConceptId) clearPendingConcept();
    if (pendingCourseId) clearPendingCourse();
  }, [pendingConceptId, pendingCourseId, clearPendingConcept, clearPendingCourse]);

  // البحث الفوري في العنوان والموضوع — فوق أي مستوى
  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return CONCEPTS.filter(
      (c) => c.title.includes(q) || chapterLabel(c.chapter).includes(q)
    ).slice(0, 40);
  }, [query]);

  const openCourse = COURSES.find((c) => c.id === openCourseId) ?? null;

  // موضوعات المحور المفتوح بترتيب ظهورها فيه
  const chapters = useMemo(
    () => (openCourse ? chaptersOfCourse(openCourse.id) : []),
    [openCourse]
  );

  // مفاهيم الموضوع المفتوح
  const chapterConcepts = useMemo(
    () =>
      openCourse && openChapter
        ? conceptsOfCourse(openCourse.id).filter((c) => c.chapter === openChapter)
        : [],
    [openCourse, openChapter]
  );

  return (
    <div className="space-y-4 pb-6">
      {!openCourse && searchResults === null && (
        <div>
          <h1 className="font-display text-2xl font-bold lg:text-[28px]">التعلّم</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">المقررات بفصولها ومفاهيمها، لكل مفهوم شرح وأمثلة من الميدان وأسئلة.</p>
        </div>
      )}
      {/* البحث في كل المفاهيم */}
      <div className="flex h-12 items-center gap-2 rounded-xl border border-input bg-card px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مفهوم أو نظرية..."
          aria-label="ابحث عن مفهوم"
          className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="مسح البحث" className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {searchResults !== null ? (
        // نتائج البحث فوق أي مستوى
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground">
            {searchResults.length > 0
              ? "نتائج البحث"
              : "لا نتائج مطابقة — جرّب كلمة أقصر أو مختلفة"}
          </p>
          {searchResults.map((c) => (
            <button
              key={c.id}
              onClick={() => setDetailId(c.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 text-right transition-colors active:bg-accent"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: COURSE_COLOR[c.courseId] ?? "#0E7C86" }}
              >
                <CourseIcon id={c.courseId} className="h-4.5 w-4.5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold leading-6">{c.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {chapterLabel(c.chapter)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : !openCourse ? (
        // المستوى الأول: قلب الصف + بطاقة لكل محور
        <motion.div
          key="library-roots"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
          {COURSES.map((course) => {
            const color = COURSE_COLOR[course.id] ?? "#0E7C86";
            const courseConcepts = conceptsOfCourse(course.id);
            const readCount = courseConcepts.filter((cc) => conceptReads[cc.id]).length;
            const pct = courseConcepts.length ? Math.round((readCount / courseConcepts.length) * 100) : 0;
            return (
              <button
                key={course.id}
                onClick={() => {
                  setOpenCourseId(course.id);
                  setOpenChapter(null);
                }}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-right card-soft transition-colors hover:bg-muted/40"
              >
                <span className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                  >
                    <CourseIcon id={course.id} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-6 text-foreground">{course.name}</span>
                    <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{COURSE_SUBTITLE[course.id]}</span>
                  </span>
                </span>
                <span className="mt-auto">
                  <span className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{arCount(courseConcepts.length, CONCEPT_FORMS)}، قرأت {ad(readCount)}</span>
                    <span className="font-medium text-foreground">{ad(pct)}٪</span>
                  </span>
                  <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </span>
                </span>
              </button>
            );
          })}
          </div>
        </motion.div>
      ) : !openChapter ? (
        // المستوى الثاني: بطاقات الموضوعات داخل المحور — كل موضوع بطاقة تفتح مفاهيمه
        <motion.div
          key={`course-${openCourse.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          <SubHeader
            title={COURSE_SHORT[openCourse.id]}
            hint={COURSE_SUBTITLE[openCourse.id]}
            accent={COURSE_COLOR[openCourse.id] ?? "#0E7C86"}
            onBack={() => {
              setOpenCourseId(null);
              setOpenChapter(null);
            }}
          />
          <div className="grid grid-cols-2 gap-2.5">
            {chapters.map((ch, chIdx) => {
              const chConcepts = conceptsOfCourse(openCourse.id).filter((c) => c.chapter === ch);
              const chRead = chConcepts.filter((c) => conceptReads[c.id]).length;
              const chPct = chConcepts.length ? Math.round((chRead / chConcepts.length) * 100) : 0;
              const color = COURSE_COLOR[openCourse.id] ?? "#0E7C86";
              return (
              <button
                key={ch}
                onClick={() => setOpenChapter(ch)}
                className="group relative flex min-h-[112px] flex-col overflow-hidden rounded-3xl border border-emerald-100/70 bg-white p-3.5 text-right shadow-[0_2px_8px_rgba(49,46,129,0.04),0_10px_26px_rgba(49,46,129,0.06)] transition-all active:scale-[0.98]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-5 -top-5 h-16 w-16 rounded-full opacity-[0.07]"
                  style={{ background: color }}
                />
                <span className="relative flex items-start justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}c0)` }}
                  >
                    <span className="text-[13px] font-black">{ad(chIdx + 1)}</span>
                  </span>
                  {chPct === 100 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-black"
                      style={{ background: `${color}14`, color }}
                    >
                      مكتمل
                    </span>
                  )}
                </span>
                <span className="relative mt-2 line-clamp-2 text-[13px] font-black leading-5 text-gray-900">
                  {chapterLabel(ch)}
                </span>
                <span className="relative mt-auto pt-2">
                  <span className="mb-1 flex items-center justify-between text-[9px] font-black">
                    <span className="text-muted-foreground">{ad(chConcepts.length)} مفاهيم</span>
                    <span style={{ color: chPct > 0 ? color : undefined }}>{ad(chPct)}٪</span>
                  </span>
                  <span className="block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${chPct}%`, background: color }}
                    />
                  </span>
                </span>
              </button>
              );
            })}
          </div>
        </motion.div>
      ) : (
        // المستوى الثالث: بطاقات المفاهيم داخل الموضوع — كل مفهوم وحده
        <motion.div
          key={`chapter-${openCourse.id}-${openChapter}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          <SubHeader
            title={chapterLabel(openChapter)}
            hint={COURSE_SHORT[openCourse.id]}
            accent={COURSE_COLOR[openCourse.id] ?? "#0E7C86"}
            onBack={() => setOpenChapter(null)}
          />
          <div className="grid grid-cols-2 gap-2.5">
            {chapterConcepts.map((c, cIdx) => {
              const isRead = !!conceptReads[c.id];
              const color = COURSE_COLOR[c.courseId] ?? "#0E7C86";
              const cQs = questionsOfConcept(c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setDetailId(c.id)}
                  className={`group relative flex min-h-[124px] flex-col overflow-hidden rounded-3xl border p-3 text-right shadow-[0_2px_8px_rgba(49,46,129,0.04),0_10px_26px_rgba(49,46,129,0.06)] transition-all active:scale-[0.98] ${
                    isRead ? "border-emerald-200 bg-emerald-50/40" : "border-emerald-100/70 bg-white"
                  }`}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -left-4 -top-4 h-14 w-14 rounded-full opacity-[0.07]"
                    style={{ background: color }}
                  />
                  <span className="relative flex items-start justify-between">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}c0)` }}
                    >
                      {isRead ? <CheckCircle2 className="h-4.5 w-4.5" /> : <span className="text-[13px] font-black">{ad(cIdx + 1)}</span>}
                    </span>
                    {!isRead && cQs > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 ring-1 ring-amber-100">
                        {ad(cQs)} سؤال
                      </span>
                    )}
                  </span>
                  <span className="relative mt-2 line-clamp-2 text-[13px] font-black leading-5 text-gray-900">
                    {c.title}
                  </span>
                  <span className="relative mt-auto flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                    {isRead ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" style={{ color }} /> تمت القراءة
                      </>
                    ) : (
                      <>
                        <Circle className="h-3 w-3 text-border" /> جديد
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* التفاصيل تُعرض فوق أي مستوى */}
      <AnimatePresence>
        {detailId && <ConceptDetail conceptId={detailId} onClose={() => setDetailId(null)} />}
      </AnimatePresence>
    </div>
  );
}
