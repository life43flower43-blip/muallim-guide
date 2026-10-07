"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  RotateCcw,
  Zap,
  Timer,
  Dumbbell,
  ChevronLeft,
  BookOpenCheck,
  AlertTriangle,
  Target,
} from "lucide-react";
import { COURSES, questionsOfCourse, QUESTIONS, conceptById, shuffle } from "@/lib/qbank";
import { buildReviewSet, buildRedoSet, orderUnseenFirst } from "@/lib/srs";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";

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
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ background: color }}
      >
        <Icon className="h-7 w-7" />
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="text-lg font-black">{title}</span>
          {badge && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-black text-primary">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{desc}</span>
      </span>
      <ChevronLeft className="h-5 w-5 text-muted-foreground" />
    </motion.button>
  );
}

export default function QuizHome({ onGoTab }: { onGoTab: (t: string) => void }) {
  const startQuiz = useUi((s) => s.startQuiz);
  const attempts = useApp((s) => s.attempts);
  const [expanded, setExpanded] = useState<string | null>(null);

  const reviewSet = useMemo(() => buildReviewSet(attempts), [attempts]);
  const redoSet = useMemo(() => buildRedoSet(attempts), [attempts]);
  const seenCount = Object.keys(attempts).length;

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="card-soft rounded-3xl border border-border bg-gradient-to-l from-[#1B4332] to-[#2D6A4F] p-5 text-white">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="h-8 w-8" />
          <div>
            <h2 className="text-lg font-black">مركز الاختبارات</h2>
            <p className="text-xs text-gray-100">
              {seenCount > 0
                ? "راجع بذكاء، صحّح أخطاءك، وتحدّ نفسك — الجديد يأتي أولاً"
                : "ابدأ أول جلسة — أسئلة من محاور الرحلة كلها مع توجيه فوري"}
            </p>
          </div>
        </div>
      </div>

      <ModeCard
        icon={Brain}
        title="الاختبار المكثف"
        desc="جميع أسئلة البنك في جلسة واحدة — وعند كل خطأ نعرفك بمفهومه وأمثلته، ويُسجل الخطأ في صفحة أخطائي"
        color="#1B4332"
        onClick={() =>
          startQuiz({
            mode: "intensive",
            label: "الاختبار المكثف — جميع الأسئلة",
            qids: orderUnseenFirst(
              QUESTIONS.map((q) => q.id),
              attempts
            ),
          })
        }
      />

      <ModeCard
        icon={Target}
        title="صفحة أخطائي"
        desc="كل خطأ مع شرح مفهومه وأمثلة متنوعة عليه — كل شيء مرتب حسب المفهوم"
        color="#DC2626"
        onClick={() => onGoTab("mistakes")}
      />

      <ModeCard
        icon={Brain}
        title="المراجعة الذكية"
        desc="تكرار متباعد: نعيد السؤال قبل أن تنساه — في وقته المثالي وفق منحنى النسيان"
        badge={reviewSet.length > 0 ? "مستحقة الآن" : undefined}
        disabled={reviewSet.length === 0}
        color="#7C3AED"
        onClick={() =>
          startQuiz({ mode: "review", label: "مراجعة ذكية متباعدة", qids: reviewSet })
        }
      />

      <ModeCard
        icon={RotateCcw}
        title="إعادة أخطائي"
        desc="الأسئلة التي أخطأت فيها سابقاً — صحّح مفاهيمك الآن"
        badge={redoSet.length > 0 ? "تنتظر إصلاحك" : undefined}
        disabled={redoSet.length === 0}
        color="#DC2626"
        onClick={() => startQuiz({ mode: "redo", label: "إعادة الأسئلة الخاطئة", qids: redoSet })}
      />

      <ModeCard
        icon={Zap}
        title="اختبار سريع"
        desc="١٠ أسئلة عشوائية من كل المحاور مع توجيه فوري"
        color="#F59E0B"
        onClick={() =>
          startQuiz({
            mode: "quick",
            label: "اختبار سريع — ١٠ أسئلة",
            qids: shuffle(QUESTIONS).slice(0, 10).map((q) => q.id),
          })
        }
      />

      <ModeCard
        icon={Timer}
        title="اختبار محاكاة"
        desc="٢٠ سؤالًا في ١٥ دقيقة — بلا توجيه فوري، والنتيجة في النهاية (كالامتحان الحقيقي)"
        color="#0E7490"
        onClick={() =>
          startQuiz({
            mode: "exam",
            label: "اختبار محاكاة — ٢٠ سؤالًا",
            qids: shuffle(QUESTIONS).slice(0, 20).map((q) => q.id),
            timeLimitSec: 15 * 60,
          })
        }
      />

      {/* تدريب حسب المحور */}
      <div className="card-soft rounded-3xl border border-border bg-white p-4">
        <button
          className="flex w-full items-center gap-4 text-right"
          onClick={() => setExpanded((e) => (e ? null : "courses"))}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2D6A4F] text-white">
            <Dumbbell className="h-7 w-7" />
          </span>
          <span className="flex-1">
            <span className="text-lg font-black">تدريب حسب المحور</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              اختر محورًا ثم موضوعًا لتتدرب على أسئلته مع توجيه فوري بعد كل سؤال — الجديد يأتي أولاً
            </span>
          </span>
          <ChevronLeft
            className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? "-rotate-90" : ""}`}
          />
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 space-y-2 overflow-hidden border-t border-border pt-3"
          >
            {COURSES.map((course) => {
              return (
                <div key={course.id} className="rounded-2xl bg-muted/60 p-3">
                  <button
                    className="flex w-full items-center justify-between text-right"
                    onClick={() => setExpanded((e) => (e === course.id ? null : course.id))}
                  >
                    <span className="text-sm font-extrabold leading-6 text-primary">{course.name}</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <ChevronLeft
                        className={`h-4 w-4 transition-transform ${
                          expanded === course.id ? "-rotate-90" : ""
                        }`}
                      />
                    </span>
                  </button>
                  {expanded === course.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1.5">
                      <button
                        onClick={() => {
                          const qs = questionsOfCourse(course.id);
                          startQuiz({
                            mode: "training",
                            label: course.name,
                            qids: orderUnseenFirst(qs.map((q) => q.id), attempts),
                          });
                        }}
                        className="w-full rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground"
                      >
                        تدريب شامل على المحور
                      </button>
                      <ChaptersGrid courseId={course.id} />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {redoSet.length === 0 && reviewSet.length === 0 && seenCount === 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          المراجعة الذكية وإعادة الأخطاء تُفعّلان تلقائياً بعد أول جلسة تدريب — النظام يتتبع أخطاءك وجدول نسيان كل سؤال.
        </div>
      )}
    </div>
  );
}

function ChaptersGrid({ courseId }: { courseId: string }) {
  const startQuiz = useUi((s) => s.startQuiz);
  const attempts = useApp((s) => s.attempts);
  // نجمع الموضوعات من بنك المفاهيم مباشرة
  const chaptersList = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const q of questionsOfCourse(courseId)) {
      const concept = conceptById(q.conceptId);
      if (!concept) continue;
      const arr = map.get(concept.chapter) ?? [];
      arr.push(q.id);
      map.set(concept.chapter, arr);
    }
    return Array.from(map.entries());
  }, [courseId]);

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {chaptersList.map(([chapter, qids]) => (
        <button
          key={chapter}
          onClick={() =>
            startQuiz({
              mode: "training",
              label: chapter,
              qids: orderUnseenFirst(qids, attempts),
            })
          }
          className="flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2 text-right text-xs font-bold text-foreground"
        >
          <span className="leading-5">{chapter}</span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
