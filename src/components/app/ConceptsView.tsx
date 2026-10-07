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
  Layers,
  List,
  Search,
  Dna,
  Brain,
  Heart,
  ClipboardList,
  School,
  Library,
} from "lucide-react";
import {
  COURSES,
  CONCEPTS,
  conceptsOfCourse,
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
import FlashcardsView from "./FlashcardsView";

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
              <CourseIcon id={course.id} className="h-3.5 w-3.5" /> {course.name}
            </p>
            <h2 className="mt-1 text-xl font-black leading-8">{c.title}</h2>
            <p className="mt-1 text-[11px] opacity-80">{c.chapter}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/20 p-2" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        <div className="card-soft space-y-4 rounded-3xl border border-border bg-white p-5">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-black text-primary">
              <BookOpen className="h-4 w-4" /> الشرح
            </p>
            <p className="text-sm leading-8 text-foreground">{c.explanation}</p>
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-800">
              <Lightbulb className="h-4 w-4" /> أمثلة واقعية من الميدان
            </p>
            {examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <p className="text-sm leading-7 text-emerald-950">{ex}</p>
              </div>
            ))}
          </div>
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

export default function ConceptsView() {
  const { conceptReads } = useApp();

  // طلبات فتح من خارج الشاشة (مفهوم اليوم / عوالم الأساس وأعرف في الرئيسية)
  // تُستهلك عند التحميل الأول لتهيئة الحالة مباشرة — بلا setState داخل التأثيرات
  const pendingConceptId = useUi((s) => s.pendingConceptId);
  const pendingCourseId = useUi((s) => s.pendingCourseId);
  const clearPendingConcept = useUi((s) => s.clearPendingConcept);
  const clearPendingCourse = useUi((s) => s.clearPendingCourse);

  const [mode, setMode] = useState<"cards" | "list">(
    pendingConceptId || pendingCourseId ? "list" : "cards"
  );
  const [filterCourse, setFilterCourse] = useState<string | null>(pendingCourseId);
  const [detailId, setDetailId] = useState<string | null>(pendingConceptId);
  const [query, setQuery] = useState("");

  // مسح الطلب المعلق بعد الاستهلاك (تحديث مخزن خارجي فقط — لا حالة محلية هنا)
  useEffect(() => {
    if (pendingConceptId) clearPendingConcept();
    if (pendingCourseId) clearPendingCourse();
  }, [pendingConceptId, pendingCourseId, clearPendingConcept, clearPendingCourse]);

  // البحث الفوري في العنوان والموضوع
  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return CONCEPTS.filter((c) => c.title.includes(q) || c.chapter.includes(q)).slice(0, 40);
  }, [query]);

  const totalConcepts = CONCEPTS.length;

  // مفاهيم القائمة حسب الفلتر المختار — بلا تجزئة فصول
  const listConcepts = useMemo(
    () => (filterCourse ? conceptsOfCourse(filterCourse) : CONCEPTS),
    [filterCourse]
  );

  return (
    <div className="space-y-3 pb-6">
      {/* مبدّل العرض: بطاقات / قائمة */}
      <div className="mx-4 flex items-center gap-2 rounded-2xl border border-border bg-white p-1.5">
        <button
          onClick={() => setMode("cards")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-colors ${
            mode === "cards" ? "bg-primary text-primary-foreground" : "text-foreground/60"
          }`}
        >
          <Layers className="h-4 w-4" /> بطاقات
        </button>
        <button
          onClick={() => setMode("list")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-colors ${
            mode === "list" ? "bg-primary text-primary-foreground" : "text-foreground/60"
          }`}
        >
          <List className="h-4 w-4" /> قائمة
        </button>
      </div>

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
        // نتائج البحث فوق أي وضع
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
                <span className="text-[10px] text-muted-foreground">{c.chapter}</span>
              </span>
            </button>
          ))}
        </div>
      ) : mode === "cards" ? (
        <FlashcardsView />
      ) : (
      <div className="space-y-3 px-4">
      <div className="card-soft flex items-center gap-3 rounded-3xl border border-border bg-white p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <BookOpen className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-black">مكتبة المفاهيم</h2>
          <p className="text-xs text-muted-foreground">
            اضغط أي مفهوم لقراءة شرحه وأمثلته الواقعية والتدريب عليه
          </p>
        </div>
      </div>

      {/* رقائق فلترة حسب المحور — بلا فصول كتاب ولا أكورديون */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setFilterCourse(null)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-black transition-colors ${
            filterCourse === null
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-white text-gray-700"
          }`}
        >
          <Library className="h-3.5 w-3.5" /> الكل
        </button>
        {COURSES.map((course) => {
          const active = filterCourse === course.id;
          const color = COURSE_COLOR[course.id] ?? "#1B4332";
          return (
            <button
              key={course.id}
              onClick={() => setFilterCourse(course.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-black transition-colors ${
                active ? "text-white" : "border-border bg-white text-gray-700"
              }`}
              style={active ? { background: color, borderColor: color } : undefined}
            >
              <CourseIcon id={course.id} className="h-3.5 w-3.5" />
              {COURSE_SHORT[course.id]}
            </button>
          );
        })}
      </div>

      {/* شبكة بطاقات المفاهيم — كل مفهوم بطاقة مستقلة، بلا ترتيب فصول */}
      <div className="grid grid-cols-2 gap-2">
        {listConcepts.map((c) => {
          const isRead = !!conceptReads[c.id];
          const color = COURSE_COLOR[c.courseId] ?? "#1B4332";
          return (
            <button
              key={c.id}
              onClick={() => setDetailId(c.id)}
              className="card-soft relative flex min-h-[104px] flex-col justify-between rounded-2xl border border-border bg-white p-3 text-right transition-transform active:scale-[0.98]"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                style={{ background: color }}
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
                    <Circle className="h-3 w-3 text-border" /> {COURSE_SHORT[c.courseId]}
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {listConcepts.length === 0 && (
        <p className="py-6 text-center text-xs font-bold text-muted-foreground">
          لا مفاهيم في هذا المحور بعد
        </p>
      )}
      </div>
      )}

      {/* التفاصيل تُعرض فوق أي وضع (بطاقات أو قائمة) */}
      <AnimatePresence>
        {detailId && <ConceptDetail conceptId={detailId} onClose={() => setDetailId(null)} />}
      </AnimatePresence>
    </div>
  );
}
