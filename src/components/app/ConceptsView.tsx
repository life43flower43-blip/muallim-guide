"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  BookOpen,
  CheckCircle2,
  Circle,
  Dumbbell,
  FileText,
  Lightbulb,
  X,
  Layers,
  List,
  Search,
} from "lucide-react";
import {
  COURSES,
  CONCEPTS,
  chaptersOfCourse,
  conceptsOfCourse,
  questionsOfConcept,
  COURSE_COLOR,
  shuffle,
} from "@/lib/qbank";
import type { Concept, Course } from "@/lib/types";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad, arCount, CONCEPT_FORMS, QUESTION_FORMS } from "@/lib/arabic";
import { Button } from "@/components/ui/button";
import FlashcardsView from "./FlashcardsView";

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
            <p className="text-[11px] font-bold opacity-80">{course.name}</p>
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-black text-emerald-800">
              <Lightbulb className="h-4 w-4" /> مثال تطبيقي
            </p>
            <p className="text-sm leading-7 text-emerald-950">{c.example}</p>
          </div>
          <div className="rounded-2xl bg-muted p-3">
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <FileText className="h-4 w-4" /> أسئلة هذا المفهوم في بنك الأسئلة: {qs.length}
            </p>
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

  // طلبات فتح من خارج الشاشة (مفهوم اليوم / عوالم الجامعة وأعرف في الرئيسية)
  // تُستهلك عند التحميل الأول لتهيئة الحالة مباشرة — بلا setState داخل التأثيرات
  const pendingConceptId = useUi((s) => s.pendingConceptId);
  const pendingCourseId = useUi((s) => s.pendingCourseId);
  const clearPendingConcept = useUi((s) => s.clearPendingConcept);
  const clearPendingCourse = useUi((s) => s.clearPendingCourse);

  const [mode, setMode] = useState<"cards" | "list">(
    pendingConceptId || pendingCourseId ? "list" : "cards"
  );
  const [openCourse, setOpenCourse] = useState<string | null>(pendingCourseId ?? "M1");
  const [detailId, setDetailId] = useState<string | null>(pendingConceptId);
  const [query, setQuery] = useState("");

  // مسح الطلب المعلق بعد الاستهلاك (تحديث مخزن خارجي فقط — لا حالة محلية هنا)
  useEffect(() => {
    if (pendingConceptId) clearPendingConcept();
    if (pendingCourseId) clearPendingCourse();
  }, [pendingConceptId, pendingCourseId, clearPendingConcept, clearPendingCourse]);

  // البحث الفوري في العنوان والفصل
  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return CONCEPTS.filter((c) => c.title.includes(q) || c.chapter.includes(q)).slice(0, 40);
  }, [query]);

  const totalConcepts = CONCEPTS.length;

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
          placeholder={`ابحث في ${arCount(totalConcepts, CONCEPT_FORMS)}...`}
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
              ? `${ad(searchResults.length)} نتيجة مطابقة`
              : "لا نتائج مطابقة — جرّب كلمة أقصر أو مختلفة"}
          </p>
          {searchResults.map((c) => (
            <button
              key={c.id}
              onClick={() => setDetailId(c.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 text-right transition-colors active:bg-accent"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-white ${
                  c.courseId === "G1" ? "text-[9px]" : "text-sm"
                }`}
                style={{ background: COURSE_COLOR[c.courseId] ?? "#1B4332" }}
              >
                {c.courseId === "G1" ? "مكتبة" : c.courseId.replace("M", "")}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold leading-6">{c.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {c.chapter} • {arCount(questionsOfConcept(c.id).length, QUESTION_FORMS)}
                </span>
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
            {arCount(totalConcepts, CONCEPT_FORMS)} — اضغط أي مفهوم للشرح والمثال والتدريب
          </p>
        </div>
      </div>

      {COURSES.map((course) => {
        const open = openCourse === course.id;
        const concepts = conceptsOfCourse(course.id);
        const readCount = concepts.filter((c) => conceptReads[c.id]).length;
        const color = COURSE_COLOR[course.id] ?? "#1B4332";
        return (
          <div key={course.id} className="card-soft overflow-hidden rounded-3xl border border-border bg-white">
            <button
              className="flex w-full items-center gap-3 p-4 text-right"
              onClick={() => setOpenCourse((o) => (o === course.id ? null : course.id))}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-white ${
                  course.id === "G1" ? "text-[10px]" : "text-base"
                }`}
                style={{ background: color }}
              >
                {course.id === "G1" ? "مكتبة" : ad(course.id.replace("M", ""))}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-black leading-6 text-foreground">{course.name}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {arCount(concepts.length, CONCEPT_FORMS)} • قُرئ {ad(readCount)} من {ad(concepts.length)}
                </span>
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 border-t border-border px-4 py-3">
                    {chaptersOfCourse(course.id).map((chapter) => {
                      const chapterConcepts = concepts.filter((c) => c.chapter === chapter);
                      return (
                        <div key={chapter}>
                          <p className="mb-1.5 mt-2 flex items-center gap-1.5 text-[11px] font-extrabold text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                            {chapter}
                          </p>
                          {chapterConcepts.map((c) => {
                            const isRead = !!conceptReads[c.id];
                            return (
                              <button
                                key={c.id}
                                onClick={() => setDetailId(c.id)}
                                className="mb-1.5 flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-right transition-colors active:bg-accent"
                              >
                                {isRead ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                  <Circle className="h-5 w-5 shrink-0 text-border" />
                                )}
                                <span className="flex-1">
                                  <span className="block text-sm font-bold leading-6">{c.title}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {arCount(questionsOfConcept(c.id).length, QUESTION_FORMS)}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      </div>
      )}

      {/* التفاصيل تُعرض فوق أي وضع (بطاقات أو قائمة) */}
      <AnimatePresence>
        {detailId && <ConceptDetail conceptId={detailId} onClose={() => setDetailId(null)} />}
      </AnimatePresence>
    </div>
  );
}
