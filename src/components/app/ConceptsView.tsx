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
  Users,
  Plus,
  Trash2,
  ChevronRight,
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
};
const CourseIcon = ({ id, className }: { id: string; className?: string }) => {
  const Icon = COURSE_ICONS[id] ?? BookOpen;
  return <Icon className={className} />;
};

// عرض أسماء الموضوعات — تُنظّف من حروف الترقيم الكتابية (أ. ب. ج.) حتى لا تشبه فهرس كتاب
const chapterLabel = (ch: string) => ch.replace(/^[أ-ي]ـ?\.\s*/, "");

// وصف موجز لكل محور في بطاقات المكتبة — مستمد من موضوعاته نفسها
const COURSE_SUBTITLE: Record<string, string> = {
  M1: "الوراثة والجهاز العصبي والسلوك",
  M2: "الغرائز والعواطف والذكاء",
  M3: "التعلم ونظرياته والذاكرة والدافعية",
  M4: "القياس وأدوات التقويم والاختبارات",
  M5: "طرق تدريس المواد الدراسية",
  G1: "مفاهيم عامة في التربية والتعليم",
};

// ---------- مجتمع الطلاب: أمثلة يضيفها الطلاب من واقع تخصصاتهم ----------
const SPECIALTIES = ["هندسة", "طب", "إنسانيات", "تربية", "أخرى"];
const SPECIALTY_COLORS: Record<string, string> = {
  "هندسة": "#0E7490",
  "طب": "#BE185D",
  "إنسانيات": "#7C3AED",
  "تربية": "#2D6A4F",
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
    <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/60 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-sky-900">
        <Users className="h-4 w-4" /> أمثلة الطلاب — مجتمع التطبيق
      </p>
      <p className="mt-1 text-[11px] font-bold leading-5 text-sky-800/80">
        أضف مثالاً من واقع تخصصك (هندسة، طب، إنسانيات...) يثري الفهم للجميع — أمثلتك محفوظة
        على جهازك وتظهر أسفل هذا المفهوم.
      </p>

      {/* أمثلة الطالب المضافة */}
      {mine.length > 0 && (
        <div className="mt-3 space-y-2">
          {mine.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-sky-100 bg-white p-3"
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
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-sky-200 bg-white text-sky-800"
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
          className="w-full resize-none rounded-2xl border border-sky-200 bg-white p-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-sky-300"
        />
        <Button
          disabled={!canAdd}
          onClick={() => {
            if (!canAdd) return;
            addStudentExample(conceptId, draft.trim(), specialty);
            setDraft("");
          }}
          className="h-11 w-full rounded-2xl bg-sky-600 text-sm font-black text-white hover:bg-sky-700 disabled:opacity-40"
        >
          <Plus className="ml-1.5 h-4 w-4" /> أضف مثالك للمجتمع
        </Button>
        {draft.trim().length > 0 && !canAdd && (
          <p className="text-center text-[10px] font-bold text-sky-700/70">
            اكتب مثالاً أوضح — عشرة أحرف على الأقل
          </p>
        )}
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

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div
        className="safe-top px-4 pb-4 pt-3 text-white"
        style={{ background: COURSE_COLOR[course.id] ?? "#1B4332" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold opacity-90">
              <CourseIcon id={course.id} className="h-3.5 w-3.5" /> {chapterLabel(c.chapter)}
            </p>
            <h2 className="mt-1 text-xl font-black leading-8">{c.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/20 p-2" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <div className="card-soft space-y-4 rounded-3xl border border-border bg-white p-5">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-black text-primary">
                <BookOpen className="h-4 w-4" /> الشرح
              </p>
              <SpeakButton text={`${c.title}. ${c.explanation}`} label="استمع للشرح" />
            </div>
            <p className="text-sm leading-8 text-foreground">{c.explanation}</p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-800">
              <Lightbulb className="h-4 w-4" /> أمثلة واقعية من الميدان
            </p>
            {examples.map((ex, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <p className="flex-1 text-sm leading-7 text-emerald-950">{ex}</p>
                <SpeakButton text={ex} label="استمع للمثال" />
              </div>
            ))}
          </div>
          {/* مجتمع الطلاب: مساحة لإثراء المفهوم بأمثلة من تخصصات الطلاب */}
          <StudentExamplesSection conceptId={c.id} />
        </div>
      </div>

      <div className="safe-bottom space-y-2 border-t border-border bg-white px-4 pt-3">
        <Button
          className="h-13 w-full rounded-2xl bg-primary py-3.5 text-base font-black text-primary-foreground"
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
    <div className="space-y-3 pb-6">
      {/* البحث في كل المفاهيم */}
      <div className="mx-4 flex items-center gap-2 rounded-2xl border border-border bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مفهوم..."
          className="w-full bg-transparent py-3 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="مسح البحث" className="rounded-full bg-muted p-1.5">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {searchResults !== null ? (
        // نتائج البحث فوق أي مستوى
        <div className="space-y-2 px-4">
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
                style={{ background: COURSE_COLOR[c.courseId] ?? "#1B4332" }}
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
        // المستوى الأول: بطاقة لكل محور — الضغط عليها يفتح موضوعاته (نموذج بطاقات المستخدم)
        <motion.div
          key="library-roots"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-2 gap-2.5 px-4"
        >
          {COURSES.map((course) => {
            const color = COURSE_COLOR[course.id] ?? "#1B4332";
            return (
              <button
                key={course.id}
                onClick={() => {
                  setOpenCourseId(course.id);
                  setOpenChapter(null);
                }}
                className="card-soft flex min-h-[104px] flex-col rounded-3xl border border-border bg-white p-3.5 text-right transition-transform active:scale-[0.98]"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                  style={{ background: color }}
                >
                  <CourseIcon id={course.id} className="h-5 w-5" />
                </span>
                <span className="mt-2.5 text-sm font-black leading-6 text-gray-900">
                  {COURSE_SHORT[course.id]}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-4 text-muted-foreground">
                  {COURSE_SUBTITLE[course.id]}
                </span>
              </button>
            );
          })}
        </motion.div>
      ) : !openChapter ? (
        // المستوى الثاني: بطاقات الموضوعات داخل المحور — كل موضوع بطاقة تفتح مفاهيمه
        <motion.div
          key={`course-${openCourse.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-3 px-4"
        >
          <SubHeader
            title={COURSE_SHORT[openCourse.id]}
            hint={COURSE_SUBTITLE[openCourse.id]}
            accent={COURSE_COLOR[openCourse.id] ?? "#1B4332"}
            onBack={() => {
              setOpenCourseId(null);
              setOpenChapter(null);
            }}
          />
          <div className="grid grid-cols-2 gap-2.5">
            {chapters.map((ch) => (
              <button
                key={ch}
                onClick={() => setOpenChapter(ch)}
                className="card-soft flex min-h-[88px] flex-col justify-center rounded-3xl border border-border bg-white p-3.5 text-right transition-transform active:scale-[0.98]"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                  style={{ background: COURSE_COLOR[openCourse.id] ?? "#1B4332" }}
                >
                  <CourseIcon id={openCourse.id} className="h-4 w-4" />
                </span>
                <span className="mt-2 line-clamp-2 text-[13px] font-black leading-5 text-gray-900">
                  {chapterLabel(ch)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        // المستوى الثالث: بطاقات المفاهيم داخل الموضوع — كل مفهوم وحده
        <motion.div
          key={`chapter-${openCourse.id}-${openChapter}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-3 px-4"
        >
          <SubHeader
            title={chapterLabel(openChapter)}
            hint={COURSE_SHORT[openCourse.id]}
            accent={COURSE_COLOR[openCourse.id] ?? "#1B4332"}
            onBack={() => setOpenChapter(null)}
          />
          <div className="grid grid-cols-2 gap-2">
            {chapterConcepts.map((c) => {
              const isRead = !!conceptReads[c.id];
              return (
                <button
                  key={c.id}
                  onClick={() => setDetailId(c.id)}
                  className="card-soft relative flex min-h-[104px] flex-col justify-between rounded-2xl border border-border bg-white p-3 text-right transition-transform active:scale-[0.98]"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                    style={{ background: COURSE_COLOR[c.courseId] ?? "#1B4332" }}
                  >
                    <CourseIcon id={c.courseId} className="h-4 w-4" />
                  </span>
                  <span className="mt-2 line-clamp-2 text-[13px] font-black leading-5 text-gray-900">
                    {c.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                    {isRead ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> تمت القراءة
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
