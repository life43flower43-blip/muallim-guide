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
import { Card, Chip, Divided, ListRow, OptionButton, ProgressBar, ScreenShell, SecondaryButton, SectionHeader, SkillBar, GameTile, SceneCard } from "./ui-kit";
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
        <div className="space-y-4">
          {/* المستوى في بطاقة بارزة بلون الهوية */}
          <div className="rounded-[24px] bg-[var(--t700)] px-5 py-5 text-center text-white">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-[26px]" aria-hidden="true">🧭</span>
            <p className="mt-2 font-display text-[22px] font-extrabold">{level.title}</p>
            <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-6 text-white/85">{level.desc}</p>
            <p className="mx-auto mt-3 inline-block rounded-full bg-white/15 px-3 text-[13px] font-bold leading-7">
              أجبت صوابًا عن {arCount(result.correctCount, QUESTION_OBJ_FORMS)} من {ad(result.total)}
            </p>
          </div>

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
            <div className="space-y-2.5">
              <GameTile tone={0} emoji="💪" title={`تدرّب على ${weakest ? COURSE_SHORT[weakest.courseId] : "أضعف محاورك"}`} onClick={trainWeak} />
              <GameTile tone={2} emoji="⏱️" title="اختبر جاهزيتك في المحاكي" onClick={() => startExamsim()} />
            </div>
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
        <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <SceneCard className="font-bold">{current.question}</SceneCard>
          <div className="space-y-2.5">
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
