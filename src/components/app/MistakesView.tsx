"use client";

// تبويب «أخطائي» — الصفحة الواحدة المنظمة: سريع + مراجعة ذكية + كل خطأ مع مفهومه وأمثلته.
// القاعدة الصارمة (قرار المستخدم): ممنوع تأليف أي شرح أو مثال هنا — كل النصوص من qbank.json.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Dumbbell,
  ChevronDown,
  RotateCcw,
  PartyPopper,
  Zap,
  Share2,
} from "lucide-react";
import {
  conceptById,
  questionById,
  examplesOf,
  questionsOfConcept,
  QUESTIONS,
  COURSES,
  COURSE_COLOR,
  COURSE_SHORT,
  shuffle,
} from "@/lib/qbank";
import type { Concept } from "@/lib/types";
import { buildReviewSet } from "@/lib/srs";
import { shareText } from "@/lib/share";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import SpeakButton from "./SpeakButton";

interface WrongEntry {
  qid: string;
  answer?: string;
  ts: number;
}

// بطاقة نمط جلسة — نفس هوية مركز الاختبارات (نُقلت من الرئيسية لتقليل التشتيت)
function ModeCard({
  icon: Icon,
  title,
  desc,
  badge,
  disabled,
  color,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
  color: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={`card-soft flex w-full items-center gap-4 rounded-3xl border border-border bg-white p-4 text-right ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ background: color }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-black">{title}</span>
          {badge && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-black text-primary">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{desc}</span>
      </span>
    </motion.button>
  );
}

export default function MistakesView() {
  const startQuiz = useUi((s) => s.startQuiz);
  const attempts = useApp((s) => s.attempts);

  const [openExamples, setOpenExamples] = useState<Record<string, boolean>>({});
  // تصفية حسب المحور — بلا أرقام، أسماء المحاور فقط
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  const reviewSet = useMemo(() => buildReviewSet(attempts), [attempts]);

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

  // المحاور الموجودة فعلاً بين الأخطاء — بترتيب المحاور الأصلي
  const presentCourses = useMemo(() => {
    const ids = new Set<string>();
    for (const [cid] of groups) {
      const c = conceptById(cid);
      if (c) ids.add(c.courseId);
    }
    return COURSES.map((co) => co.id).filter((id) => ids.has(id));
  }, [groups]);

  // المجموعات بعد التصفية
  const visibleGroups = useMemo(
    () =>
      courseFilter
        ? groups.filter(([cid]) => conceptById(cid)?.courseId === courseFilter)
        : groups,
    [groups, courseFilter]
  );

  // مشاركة مفهوم كاملًا: الشرح + الأمثلة — عبر تطبيقات الجهاز أو نسخ للحافظة
  const shareConcept = async (c: Concept) => {
    const exs = examplesOf(c);
    const text = `${c.explanation}${
      exs.length ? "\n\n" + exs.map((e) => `• ${e}`).join("\n\n") : ""
    }\n\n— من تطبيق مساعد إعداد المعلم`;
    const r = await shareText(c.title, text);
    if (r === "copied") toast({ title: "نُسخ المفهوم — الصقه حيث تريد" });
  };

  const redoAll = () => {
    startQuiz({
      mode: "redo",
      label: "إعادة الأسئلة الخاطئة",
      qids: wrongs.map((w) => w.qid),
    });
  };

  return (
    <div className="space-y-4 px-4 pb-6">
      {/* شريط الملخص + إعادة كل الأخطاء */}
      <div className="rounded-3xl bg-gradient-to-l from-[#7F1D1D] to-[#B91C1C] p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Target className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-black">كل شيء عن أخطائك هنا</h3>
            <p className="mt-0.5 text-xs font-bold leading-5 text-red-100">
              {wrongs.length > 0
                ? "أخطاؤك مرتبة حسب المفهوم — كل خطأ مع شرحه وأمثلته الواقعية"
                : "كل شيء مرتب — لا أخطاء تنتظر إصلاحك"}
            </p>
          </div>
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

      {/* جلسات سريعة — نُقلت من الرئيسية (طلب المستخدم: تقليل التشتيت) */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            startQuiz({
              mode: "quick",
              label: "اختبار سريع",
              qids: shuffle(QUESTIONS).slice(0, 10).map((q) => q.id),
            })
          }
          className="card-soft flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Zap className="h-5 w-5" />
          </span>
          <span className="text-xs font-black text-gray-900">سريع</span>
          <span className="text-[9px] font-bold text-gray-600">أسئلة عشوائية سريعة</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (reviewSet.length > 0) {
              startQuiz({ mode: "review", label: "مراجعة ذكية متباعدة", qids: reviewSet });
            }
          }}
          className={`card-soft flex min-h-[92px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-white p-3 text-center ${
            reviewSet.length === 0 ? "opacity-60" : ""
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
            <RotateCcw className="h-5 w-5" />
          </span>
          <span className="text-xs font-black text-gray-900">مراجعة ذكية</span>
          <span className="text-[9px] font-bold text-gray-600">
            {reviewSet.length > 0
              ? "مراجعات مستحقة الآن"
              : "لا مراجعات مستحقة"}
          </span>
        </motion.button>
      </div>

      {/* المحتوى: الأخطاء مجمعة حسب المفهوم */}
      {wrongs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
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
          {/* تصفية حسب المحور — تظهر فقط حين يمتد الخطأ لأكثر من محور */}
          {presentCourses.length > 1 && (
            <div
              className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-label="تصفية حسب المحور"
            >
              <button
                onClick={() => setCourseFilter(null)}
                aria-pressed={courseFilter === null}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-colors ${
                  courseFilter === null
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-white text-muted-foreground"
                }`}
              >
                الكل
              </button>
              {presentCourses.map((id) => {
                const active = courseFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setCourseFilter(active ? null : id)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-colors ${
                      active
                        ? "text-white"
                        : "border border-border bg-white text-muted-foreground"
                    }`}
                    style={active ? { background: COURSE_COLOR[id] ?? "#5B21B6" } : undefined}
                  >
                    {COURSE_SHORT[id]}
                  </button>
                );
              })}
            </div>
          )}

          {visibleGroups.map(([conceptId, entries]) => {
            const concept = conceptById(conceptId);
            if (!concept) return null;
            const color = COURSE_COLOR[concept.courseId] ?? "#5B21B6";
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
                  <div className="mt-2 flex items-start gap-2">
                    <p className="flex-1 text-sm leading-7 text-gray-700">{concept.explanation}</p>
                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                      <SpeakButton
                        text={`${concept.title}. ${concept.explanation}`}
                        label="استمع للشرح"
                      />
                      <button
                        onClick={() => shareConcept(concept)}
                        aria-label="شارك المفهوم"
                        title="شارك المفهوم"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition-colors hover:bg-sky-200 dark:bg-sky-500/20 dark:text-sky-200"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {examples.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                        <Lightbulb className="h-3.5 w-3.5" /> أمثلة متنوعة من الميدان
                      </p>
                      {shown.map((ex, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3"
                        >
                          <p className="flex-1 text-xs leading-6 text-emerald-950">{ex}</p>
                          <SpeakButton text={ex} label="استمع للمثال" />
                        </div>
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
                    الأسئلة التي أخطأت فيها
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
  );
}
