"use client";

// مدرسة المذاكرة — من ميزة «هـ» في بحث مشاكل الطلبة: مهارات الدراسة المفقودة.
// ستة دروس قصيرة: قراءة موجزة ثم تطبيق تفاعلي داخل التطبيق نفسه ثم تحقق نهائي.
// كل درس مكتمل يُوسم في المخزن ويمنح نقاط خبرة. قواعد صارمة: بلا لاتيني، أرقام مشرقية، تنصيص ب«».

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Brain,
  CalendarClock,
  Feather,
  Timer,
  Map,
  Moon,
  CheckCircle2,
  XCircle,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  Lock,
} from "lucide-react";
import { STUDY_LESSONS, type StudyLesson, type StudyStep } from "@/lib/study-school";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad } from "@/lib/arabic";
import { Button } from "@/components/ui/button";

const LESSON_ICONS: Record<string, typeof Brain> = {
  Brain,
  CalendarClock,
  Feather,
  Timer,
  Map,
  Moon,
};

const LESSON_XP = 20;

export default function StudySchool() {
  const clearStudy = useUi((s) => s.clearStudy);
  const studyDone = useApp((s) => s.studyDone);
  const addStudyLesson = useApp((s) => s.addStudyLesson);
  const finishSession = useApp((s) => s.finishSession);

  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [quizOk, setQuizOk] = useState(false); // هل أُجيب عن كل أسئلة التحقق في الخطوة الراهنة؟

  const lesson = STUDY_LESSONS.find((l) => l.id === openLessonId) ?? null;
  const doneCount = useMemo(() => Object.keys(studyDone).length, [studyDone]);

  const openLesson = (id: string) => {
    setOpenLessonId(id);
    setStepIdx(0);
  };

  const completeLesson = (l: StudyLesson) => {
    const isNew = !studyDone[l.id];
    addStudyLesson(l.id);
    if (isNew) {
      finishSession({
        mode: "study",
        label: `مدرسة المذاكرة — ${l.title}`,
        total: 1,
        correctCount: 1,
        xp: LESSON_XP,
        durationSec: l.steps.length * 45,
      });
    }
  };

  // ---------- قائمة الدروس ----------
  if (!lesson) {
    const graduate = doneCount >= STUDY_LESSONS.length;
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-background"
      >
        <div className="safe-top" />
        <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4338CA] text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-black">مدرسة المذاكرة</h2>
            </div>
            <button onClick={clearStudy} className="rounded-full bg-muted p-2" aria-label="إغلاق المدرسة">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-2xl border-2 border-[#4338CA]/20 bg-gradient-to-l from-[#4338CA]/10 to-transparent p-4">
            <p className="text-sm font-black leading-7">
              أنت تجيد المذاكرة أم مجرد إعادة القراءة؟ ستة دروس قصيرة تعلّمك كيف تذاكر كما تقتضي
              الأبحاث — وكل درس تطبقه هنا في التطبيق نفسه.
            </p>
            <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-black text-[#4338CA]">
              {graduate
                ? "أكملت الدروس الستة كلها — أنت خريج المدرسة"
                : `أنجزت ${ad(doneCount)} من ${ad(STUDY_LESSONS.length)} دروسًا حتى الآن`}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {STUDY_LESSONS.map((l, i) => {
              const Icon = LESSON_ICONS[l.icon] ?? Brain;
              const done = Boolean(studyDone[l.id]);
              return (
                <button
                  key={l.id}
                  onClick={() => openLesson(l.id)}
                  className="card-soft flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-white p-3.5 text-right transition hover:border-[#4338CA]/50"
                >
                  <span
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      done ? "bg-indigo-100 text-indigo-700" : "bg-[#4338CA]/10 text-[#4338CA]"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    {done && (
                      <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-muted-foreground">
                        الدرس {["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"][i]}
                      </span>
                      {done && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                          مكتمل
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-base font-black">{l.title}</span>
                    <span className="mt-0.5 block text-xs font-bold text-muted-foreground">
                      {l.tagline} · {l.duration}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>

          {graduate && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4">
              <GraduationCap className="h-8 w-8 shrink-0 text-indigo-700" />
              <p className="text-xs font-bold leading-6 text-indigo-900">
                أتممت منهج المدرسة كله: استدعاء، تباعد، تبسيط فاينمان، بومودورو، خرائط، وليلة
                الاختبار — طبّقها وستلمس فرقًا في رسوخ ما تتعلمه.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ---------- الدرس المفتوح ----------
  const step: StudyStep = lesson.steps[stepIdx];
  const isLast = stepIdx + 1 >= lesson.steps.length;
  const stepDone = stepIdx + 1;

  const goNext = () => {
    if (isLast) {
      completeLesson(lesson);
      setOpenLessonId(null);
    } else {
      setStepIdx((i) => i + 1);
      setQuizOk(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="safe-top" />
      <div className="mx-auto max-w-lg px-4 pb-28 pt-4">
        <button
          onClick={() => setOpenLessonId(null)}
          className="mb-4 flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" /> عودة إلى الدروس
        </button>

        <div className="rounded-2xl border-2 border-[#4338CA]/20 bg-accent p-4">
          <h2 className="text-lg font-black leading-7">{lesson.title}</h2>
          <p className="mt-0.5 text-xs font-bold text-muted-foreground">{lesson.tagline}</p>
          <div className="mt-2.5 flex items-center gap-1.5">
            {lesson.steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= stepIdx ? "bg-[#4338CA]" : "bg-[#4338CA]/15"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] font-black text-[#4338CA]">
            الخطوة {ad(stepDone)} من {ad(lesson.steps.length)}
          </p>
        </div>

        <div className="mt-4">
          {step.kind === "read" && (
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-border bg-white p-5"
            >
              <h3 className="text-base font-black leading-7">{step.title}</h3>
              <p className="mt-2 text-sm leading-8 text-foreground">{step.body}</p>
            </motion.div>
          )}

          {step.kind === "flip" && <FlipStep step={step} />}

          {step.kind === "quiz" && <QuizStep step={step} onAllAnswered={() => setQuizOk(true)} />}
        </div>

        <Button
          onClick={goNext}
          disabled={step.kind === "quiz" && !quizOk}
          className="mt-4 h-14 w-full rounded-2xl bg-[#4338CA] text-base font-black text-white hover:bg-[#3730A3] disabled:opacity-40"
        >
          {isLast ? (
            <>
              <CheckCircle2 className="ml-2 h-5 w-5" />
              أوسم الدرس مكتملًا
            </>
          ) : (
            "الخطوة التالية"
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ---------- خطوة البطاقات القلابة: استدعاء نشط عملي ----------
function FlipStep({
  step,
}: {
  step: Extract<StudyStep, { kind: "flip" }>;
}) {
  const [flipped, setFlipped] = useState<number[]>([]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="rounded-2xl border-2 border-border bg-white p-5">
        <h3 className="text-base font-black leading-7">{step.title}</h3>
        <p className="mt-1.5 text-xs font-bold leading-6 text-muted-foreground">{step.guide}</p>
      </div>
      {step.cards.map((c, i) => {
        const open = flipped.includes(i);
        return (
          <button
            key={i}
            onClick={() => setFlipped((f) => (f.includes(i) ? f : [...f, i]))}
            className={`w-full rounded-2xl border-2 p-4 text-right transition ${
              open ? "border-indigo-300 bg-indigo-50" : "border-[#4338CA]/30 bg-[#4338CA]/5"
            }`}
          >
            <p className="flex items-start gap-2 text-sm font-black leading-7">
              {open ? (
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-indigo-600" />
              ) : (
                <Lock className="mt-1 h-4 w-4 shrink-0 text-[#4338CA]" />
              )}
              {open ? c.back : c.front}
            </p>
            {open ? (
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped((f) => f.filter((x) => x !== i));
                }}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" /> أعد المحاولة مرة أخرى
              </p>
            ) : (
              <p className="mt-2 text-[11px] font-black text-[#4338CA]">
                تذكر بجهدك أولًا… ثم انقر لقلب البطاقة
              </p>
            )}
          </button>
        );
      })}
    </motion.div>
  );
}

// ---------- خطوة التحقق: اختيار مع تغذية فورية ----------
function QuizStep({
  step,
  onAllAnswered,
}: {
  step: Extract<StudyStep, { kind: "quiz" }>;
  onAllAnswered?: () => void;
}) {
  const [answered, setAnswered] = useState<Record<number, number>>({});

  const allAnswered = step.items.every((_, i) => typeof answered[i] === "number");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="rounded-2xl border-2 border-border bg-white p-5">
        <h3 className="text-base font-black leading-7">{step.title}</h3>
      </div>
      {step.items.map((item, qi) => {
        const chosen = answered[qi];
        const done = typeof chosen === "number";
        return (
          <div key={qi} className="rounded-2xl border-2 border-border bg-white p-4">
            <p className="text-sm font-black leading-7">{item.q}</p>
            <div className="mt-2.5 space-y-1.5">
              {item.options.map((opt, oi) => {
                const isCorrect = oi === item.correct;
                let cls = "border-border bg-white";
                if (done && isCorrect) cls = "border-indigo-500 bg-indigo-50";
                else if (done && chosen === oi) cls = "border-red-400 bg-red-50";
                else if (done) cls = "border-border bg-white opacity-60";
                return (
                  <button
                    key={oi}
                    disabled={done}
                    onClick={() => {
                      const nxt = { ...answered, [qi]: oi };
                      setAnswered(nxt);
                      if (step.items.every((_, i2) => typeof nxt[i2] === "number")) onAllAnswered?.();
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl border-2 p-3 text-right text-sm font-bold transition ${cls}`}
                  >
                    <span className="min-w-0 flex-1 leading-6">{opt}</span>
                    {done && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" />}
                    {done && chosen === oi && !isCorrect && (
                      <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
            {done && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2.5 rounded-xl bg-muted/70 p-3 text-xs font-bold leading-6 text-foreground"
              >
                {item.why}
              </motion.p>
            )}
          </div>
        );
      })}
      {!allAnswered && (
        <p className="text-center text-[11px] font-bold text-muted-foreground">
          أجب عن جميع أسئلة التحقق قبل الانتقال
        </p>
      )}
    </motion.div>
  );
}
