"use client";

// صفحة «أخطائي» التفصيلية — كل خطأ مع مفهومه وأمثلته كما وردت في البنك حصراً.
// القاعدة الصارمة (قرار المستخدم): ممنوع تأليف أي شرح أو مثال هنا — كل النصوص من qbank.json.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Target,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Dumbbell,
  ChevronDown,
  RotateCcw,
  PartyPopper,
} from "lucide-react";
import {
  conceptById,
  questionById,
  examplesOf,
  questionsOfConcept,
  COURSE_COLOR,
  COURSE_SHORT,
  shuffle,
} from "@/lib/qbank";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad, arCount, QUESTION_MISTAKE_FORMS } from "@/lib/arabic";
import { Button } from "@/components/ui/button";

interface WrongEntry {
  qid: string;
  answer?: string;
  ts: number;
}

export default function MistakesView() {
  const clearMistakes = useUi((s) => s.clearMistakes);
  const startQuiz = useUi((s) => s.startQuiz);
  const attempts = useApp((s) => s.attempts);

  const [openExamples, setOpenExamples] = useState<Record<string, boolean>>({});

  // الأخطاء الحالية مرتبة من الأحدث إلى الأقدم
  const wrongs = useMemo(
    () =>
      Object.values(attempts)
        .filter((a) => !a.correct && questionById(a.qid))
        .sort((a, b) => b.ts - a.ts) as WrongEntry[],
    [attempts]
  );

  // تجميع الأخطاء حسب المفهوم — حتى يظهر الشرح والأمثلة مرة واحدة لكل مفهوم (ترتيب لا تكرار)
  const groups = useMemo(() => {
    const map = new Map<string, WrongEntry[]>();
    for (const w of wrongs) {
      const q = questionById(w.qid)!;
      const arr = map.get(q.conceptId) ?? [];
      arr.push(w);
      map.set(q.conceptId, arr);
    }
    return Array.from(map.entries());
  }, [wrongs]);

  const redoAll = () => {
    startQuiz({
      mode: "redo",
      label: "إعادة الأسئلة الخاطئة",
      qids: wrongs.map((w) => w.qid),
    });
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col bg-background shadow-xl"
    >
      {/* الترويسة */}
      <div className="safe-top bg-gradient-to-l from-[#7F1D1D] to-[#B91C1C] px-4 pb-4 pt-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Target className="h-6 w-6" /> أخطائي
            </h2>
            <p className="mt-1 text-xs font-bold leading-5 text-red-100">
              {wrongs.length > 0
                ? `${arCount(wrongs.length, QUESTION_MISTAKE_FORMS)} — كل خطأ مع شرح مفهومه وأمثلته الواقعية`
                : "كل شيء مرتب — لا أخطاء تنتظر إصلاحك"}
            </p>
          </div>
          <button onClick={clearMistakes} className="rounded-full bg-white/20 p-2" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
        {wrongs.length > 0 && (
          <Button
            onClick={redoAll}
            className="mt-3 h-11 w-full rounded-2xl bg-white text-sm font-black text-red-700 hover:bg-red-50"
          >
            <RotateCcw className="ml-1.5 h-4 w-4" /> إعادة تدريب كل أخطائي الآن
          </Button>
        )}
      </div>

      {/* المحتوى */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {wrongs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <PartyPopper className="h-10 w-10 text-emerald-600" />
            </span>
            <p className="text-lg font-black text-gray-900">لا أخطاء حتى الآن</p>
            <p className="max-w-xs text-sm leading-7 text-muted-foreground">
              أكمل الاختبار المكثف من الرئيسية، وسيظهر هنا كل سؤال أخطأت فيه مع شرح مفهومه
              وأمثلة متنوعة عليه — حتى تصحح فهمك خطوة بخطوة.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(([conceptId, entries]) => {
              const concept = conceptById(conceptId);
              if (!concept) return null;
              const color = COURSE_COLOR[concept.courseId] ?? "#1B4332";
              const examples = examplesOf(concept);
              const shown = openExamples[conceptId] ? examples : examples.slice(0, 3);
              return (
                <section
                  key={conceptId}
                  className="card-soft overflow-hidden rounded-3xl border border-border bg-white"
                >
                  {/* بطاقة المفهوم: الشرح + الأمثلة المتنوعة (من البنك حصراً) */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                        style={{ background: color }}
                      >
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black" style={{ color }}>
                          {COURSE_SHORT[concept.courseId]} — المفهوم
                        </p>
                        <h3 className="mt-0.5 text-base font-black leading-6 text-gray-900">
                          {concept.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-gray-700">{concept.explanation}</p>

                    {examples.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                          <Lightbulb className="h-3.5 w-3.5" /> أمثلة متنوعة من الميدان
                        </p>
                        {shown.map((ex, i) => (
                          <p
                            key={i}
                            className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-6 text-emerald-950"
                          >
                            {ex}
                          </p>
                        ))}
                        {examples.length > 3 && (
                          <button
                            onClick={() =>
                              setOpenExamples((o) => ({ ...o, [conceptId]: !o[conceptId] }))
                            }
                            className="flex items-center gap-1 text-[11px] font-black text-emerald-700 underline decoration-emerald-300 underline-offset-4"
                          >
                            {openExamples[conceptId] ? (
                              <>إظهار أقل <ChevronDown className="h-3 w-3 rotate-180" /></>
                            ) : (
                              <>عرض كل الأمثلة <ChevronDown className="h-3 w-3" /></>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() =>
                        startQuiz({
                          mode: "training",
                          label: `تدريب: ${concept.title}`,
                          qids: shuffle(questionsOfConcept(conceptId)).map((q) => q.id),
                          conceptId,
                        })
                      }
                      className="mt-3 h-11 w-full rounded-2xl text-sm font-black"
                      style={{ background: color }}
                    >
                      <Dumbbell className="ml-1.5 h-4 w-4" /> تدريب على هذا المفهوم
                    </Button>
                  </div>

                  {/* أسئلة هذا المفهوم التي أخطأت فيها */}
                  <div className="space-y-2 border-t border-border bg-muted/40 p-4">
                    <p className="text-[11px] font-black text-muted-foreground">
                      الأسئلة التي أخطأت فيها — {arCount(entries.length, QUESTION_MISTAKE_FORMS)}
                    </p>
                    {entries.map((w) => {
                      const q = questionById(w.qid)!;
                      return (
                        <div
                          key={w.qid}
                          className="rounded-2xl border border-border bg-white p-3.5"
                        >
                          <p className="text-sm font-bold leading-7 text-gray-900">{q.question}</p>
                          <div className="mt-2 space-y-1.5">
                            {w.answer && (
                              <p className="flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold leading-6 text-red-700">
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                إجابتك: {w.answer}
                              </p>
                            )}
                            <p className="flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-6 text-emerald-800">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                              الإجابة الصحيحة: {q.correct}
                            </p>
                          </div>
                          <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-xs leading-6 text-gray-700">
                            {q.reason}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            <p className="pb-2 text-center text-[10px] leading-5 text-muted-foreground">
              كل الشروح والأمثلة هنا من بنك المفاهيم نفسه — لا إضافات خارجية. صحّح خطأً وسيغادر
              هذه الصفحة تلقائياً.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
