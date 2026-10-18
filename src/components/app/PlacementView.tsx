"use client";

// اختبار تحديد المستوى — من ميزة «تقييم للمستوى» في تطبيقات المحاكاة:
// اثنا عشر سؤالًا من كل المحاور، بلا توجيه أثناء الحل، ثم مستوى ثلاثي
// مع نقاط القوة والفجوات وخطة تنفيذية بأزرار جاهزة.
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Compass,
  TrendingUp,
  Target,
  Dumbbell,
  GraduationCap,
  CircleCheck,
  CircleX,
  ChevronLeft,
} from "lucide-react";
import {
  buildPlacementSet,
  evaluatePlacement,
  PLACEMENT_LEVELS,
  type ExamItem,
  type PlacementResult,
} from "@/lib/exam-sim";
import { COURSE_COLOR, COURSE_SHORT, OPTION_LETTERS, questionsOfCourse, questionById } from "@/lib/qbank";
import { orderUnseenFirst } from "@/lib/srs";
import { useApp } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import { ad, arCount, QUESTION_OBJ_FORMS } from "@/lib/arabic";
import { Card, Chip, Divided, ListRow, OptionButton, ProgressBar, ScreenShell, SecondaryButton, SectionHeader, SkillBar } from "./ui-kit";
import { NewBadge } from "./shared";

export default function PlacementView() {
  const close = useUi((s) => s.clearPlacement);
  const startQuiz = useUi((s) => s.startQuiz);
  const startExamsim = useUi((s) => s.startExamsim);
  const recordAttempt = useApp((s) => s.recordAttempt);
  const finishSession = useApp((s) => s.finishSession);
  const attempts = useApp((s) => s.attempts);

  const [items] = useState<ExamItem[]>(() => buildPlacementSet());
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const result: PlacementResult | null = useMemo(() => {
    if (!done) return null;
    const judged: Record<string, boolean> = {};
    for (const it of items) {
      const q = questionById(it.qid);
      judged[it.qid] = !!q && answers[it.qid] === q.correct;
    }
    return evaluatePlacement(items, judged);
  }, [done, items, answers]);

  // تسجيل الإجابة فقط — والانتقال والإنهاء يُدار من الأثر أدناه
  const choose = (text: string) => {
    const it = items[idx];
    if (!it || answers[it.qid]) return;
    setAnswers((a) => ({ ...a, [it.qid]: text }));
  };

  const finish = useCallback(
    (finalAnswers: Record<string, string>) => {
      if (done) return;
      let correct = 0;
      for (const it of items) {
        const q = questionById(it.qid);
        const ok = !!q && finalAnswers[it.qid] === q.correct;
        if (ok) correct += 1;
        recordAttempt(it.qid, ok, finalAnswers[it.qid]);
      }
      finishSession({
        mode: "placement",
        label: "اختبار تحديد المستوى",
        total: items.length,
        correctCount: correct,
        xp: correct * 3,
        durationSec: 0,
      });
      setDone(true);
    },
    [done, items, recordAttempt, finishSession]
  );

  // الانتقال مدفوع بالحالة: إذا أُجيب عن السؤال الحالي انتقلنا تلقائيًا —
  // وباكتمال الأجوبة الاثنتي عشرة يُعرض المستوى فورًا
  useEffect(() => {
    if (done) return;
    const it = items[idx];
    if (!it || !answers[it.qid]) return;
    if (Object.keys(answers).length >= items.length) {
      const f = setTimeout(() => finish(answers), 0);
      return () => clearTimeout(f);
    }
    const t = setTimeout(() => setIdx((i) => Math.min(items.length - 1, i + 1)), 300);
    return () => clearTimeout(t);
  }, [answers, idx, done, items, finish]);

  const current = items[idx] ? questionById(items[idx].qid) : undefined;

  // ============ النتيجة: مستوى + قوة وفجوات + خطة ============
  if (done && result) {
    const level = PLACEMENT_LEVELS[result.level];
    const weakest = result.weak[0];
    const trainWeak = () => {
      if (!weakest) return;
      const qs = questionsOfCourse(weakest.courseId).map((q) => q.id);
      startQuiz({
        mode: "training",
        label: `خطة الفجوة: ${COURSE_SHORT[weakest.courseId] ?? weakest.courseId}`,
        qids: orderUnseenFirst(qs, attempts),
      });
    };

    return (
      <ScreenShell title="نتيجة تحديد المستوى" onClose={close}>
        <div className="space-y-5">
          <Card className="p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Compass className="h-7 w-7" />
            </span>
            <p className="mt-3 font-display text-2xl font-bold">{level.title}</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-7 text-secondary-foreground">{level.desc}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              أجبت صوابًا عن {arCount(result.correctCount, QUESTION_OBJ_FORMS)} من {ad(result.total)}
            </p>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-success" /> نقاط قوتك
              </p>
              <div className="flex flex-wrap gap-2">
                {result.strong.map((x) => (
                  <Chip key={x.courseId} tone="success">
                    {COURSE_SHORT[x.courseId] ?? x.courseId}
                  </Chip>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-gem" /> فجواتك
              </p>
              <div className="flex flex-wrap gap-2">
                {result.weak.map((x) => (
                  <Chip key={x.courseId} tone="warning">
                    {COURSE_SHORT[x.courseId] ?? x.courseId}
                  </Chip>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <SectionHeader title="أداؤك في كل محور" />
            <div className="space-y-4">
              {result.perCourse.map((r) => (
                <SkillBar
                  key={r.courseId}
                  label={COURSE_SHORT[r.courseId] ?? r.courseId}
                  value={r.total ? (r.correct / r.total) * 100 : 0}
                  status={`${ad(r.correct)} من ${ad(r.total)}`}
                />
              ))}
            </div>
          </Card>

          <section>
            <SectionHeader title="خطتك المقترحة" sub="أعد الاختبار بعد أسبوع من التدريب لترى تقدمك" />
            <Divided>
              <ListRow
                icon={Dumbbell}
                title="تدرّب على أضعف محاورك"
                sub={`جلسة على ${weakest ? COURSE_SHORT[weakest.courseId] : "المحور الأضعف"}، الجديد أولًا`}
                onClick={trainWeak}
              />
              <ListRow icon={GraduationCap} title="اختبر جاهزيتك في المحاكي" sub="اختبار بالوقت والأقسام، كالاختبار الرسمي" onClick={() => startExamsim()} />
            </Divided>
          </section>
        </div>
      </ScreenShell>
    );
  }

  // ============ شاشة الأسئلة ============
  return (
    <ScreenShell
      title="اختبار تحديد المستوى"
      sub={`السؤال ${ad(idx + 1)} من ${ad(items.length)}، بلا تصحيح حتى النهاية`}
      onClose={close}
      footer={
        <SecondaryButton onClick={() => finish(answers)} className="w-full">
          أنهِ واعرض مستواي
        </SecondaryButton>
      }
    >
      <ProgressBar value={((idx + 1) / items.length) * 100} className="mb-5" />
      {current && (
        <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <h2 className="font-display text-lg font-semibold leading-9">{current.question}</h2>
          <div className="space-y-3">
            {current.options.map((o, i) => (
              <OptionButton
                key={i}
                letter={current.options.length > 2 ? OPTION_LETTERS[i] : undefined}
                state={answers[current.id] === o.text ? "selected" : "idle"}
                onClick={() => choose(o.text)}
              >
                {o.text}
              </OptionButton>
            ))}
          </div>
        </motion.div>
      )}
    </ScreenShell>
  );
}
